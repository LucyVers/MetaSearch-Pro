// Import the file system module
import fs from 'fs';
// Import pdf-parse-fork that lets me extract metadata from PDF files
import pdfParse from 'pdf-parse-fork';
// Import express - that will help me create a web server
import express from 'express';
// Import Fuse.js for fuzzy matching
import Fuse from 'fuse.js';

// MULTI-FILETYPE SUPPORT - COMMON METADATA STRUCTURE
// This defines the common structure that all file types will use
const COMMON_METADATA_STRUCTURE = {
  filename: null,
  fileType: null, // 'PDF', 'JPG', 'MP3', 'CSV', 'PPT'
  fileSize: null,
  title: null,
  author: null,
  createdDate: null,
  modifiedDate: null,
  keywords: [],
  language: 'Unknown',
  category: 'Unknown',
  // File type specific fields
  pdfVersion: null, // PDF specific
  dimensions: null, // JPG specific
  camera: null, // JPG specific
  location: null, // JPG specific (GPS)
  duration: null, // MP3 specific
  album: null, // MP3 specific
  columns: null, // CSV specific
  rows: null, // CSV specific
  slides: null // PPT specific
};

// Search history storage (in memory - will reset when server restarts)
let searchHistory = [];
const MAX_HISTORY_ITEMS = 10;

// Create a web server, store in the variable app
let app = express();

// Helper function to parse PDF dates
function parsePDFDate(dateString) {
  if (!dateString) return null;
  
  try {
    // Remove 'D:' prefix if present
    let cleanDate = dateString.replace('D:', '');
    
    // Handle different PDF date formats
    if (cleanDate.includes("'")) {
      // Format: D:20150106100649-06'00'
      cleanDate = cleanDate.replace(/'/g, '');
    }
    
    // Try to parse the date
    let date = new Date(cleanDate);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return null;
    }
    
    return date;
  } catch (error) {
    return null;
  }
}

// Helper function to extract author from text content
function extractAuthorFromText(text, existingAuthor) {
  if (existingAuthor && existingAuthor.trim() !== '') {
    return existingAuthor;
  }
  
  // Look for common author patterns in text
  const lines = text.split('\n').slice(0, 10); // Check first 10 lines
  
  for (let line of lines) {
    line = line.trim();
    
    // Look for patterns like "By [Name]", "Author: [Name]", etc.
    const authorPatterns = [
      /by\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
      /author:\s*([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
      /written by\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
      /prepared by\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/i
    ];
    
    for (let pattern of authorPatterns) {
      const match = line.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
  }
  
  return null;
}

// MULTI-FILETYPE SUPPORT - FILE TYPE DETECTION
function detectFileType(filename) {
  const extension = filename.toLowerCase().split('.').pop();
  switch (extension) {
    case 'pdf':
      return 'PDF';
    case 'jpg':
    case 'jpeg':
    case 'png':
      return 'JPG';
    case 'mp3':
    case 'wav':
    case 'flac':
      return 'MP3';
    case 'csv':
      return 'CSV';
    case 'ppt':
    case 'pptx':
      return 'PPT';
    default:
      return 'UNKNOWN';
  }
}

// MULTI-FILETYPE SUPPORT - GET FILE FOLDERS
function getFileFolders() {
  return {
    'PDF': './frontend/pdfs',
    'JPG': './frontend/jpgs',
    'MP3': './frontend/mp3s',
    'CSV': './frontend/csvs',
    'PPT': './frontend/ppts'
  };
}

// Helper function to extract date from filename
function extractDateFromFilename(filename) {
  // Look for date patterns in filename like YYYY-MM-DD, YYYYMMDD, etc.
  const datePatterns = [
    /(\d{4})-(\d{2})-(\d{2})/,
    /(\d{4})(\d{2})(\d{2})/,
    /(\d{2})-(\d{2})-(\d{4})/,
    /(\d{2})(\d{2})(\d{4})/
  ];
  
  for (let pattern of datePatterns) {
    const match = filename.match(pattern);
    if (match) {
      // Try to create a date from the matched pattern
      try {
        let year, month, day;
        if (match[1].length === 4) {
          // YYYY-MM-DD or YYYYMMDD format
          year = parseInt(match[1]);
          month = parseInt(match[2]) - 1; // Month is 0-indexed
          day = parseInt(match[3]);
        } else {
          // MM-DD-YYYY or MMDDYYYY format
          month = parseInt(match[1]) - 1;
          day = parseInt(match[2]);
          year = parseInt(match[3]);
        }
        
        const date = new Date(year, month, day);
        if (!isNaN(date.getTime())) {
          return date;
        }
      } catch (error) {
        // Continue to next pattern
      }
    }
  }
  
  return null;
}

// ADVANCED METADATA EXTRACTION - STEP 2: KEYWORD EXTRACTION
function extractKeywords(text) {
  if (!text || text.trim().length === 0) {
    return [];
  }

  // Common words to filter out (stop words)
  const stopWords = new Set([
    'och', 'eller', 'i', 'på', 'av', 'till', 'för', 'med', 'som', 'den', 'det', 'de', 'ett', 'en', 'är', 'var', 'kan', 'ska', 'vill', 'måste', 'får',
    'the', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'with', 'as', 'is', 'are', 'was', 'were', 'can', 'will', 'would', 'should', 'must', 'may',
    'a', 'an', 'of', 'by', 'from', 'into', 'during', 'including', 'until', 'against', 'among', 'throughout', 'despite', 'towards', 'upon',
    'this', 'that', 'these', 'those', 'it', 'its', 'they', 'them', 'their', 'we', 'us', 'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her', 'hers'
  ]);

  // Clean and split text into words
  const words = text
    .toLowerCase()
    .replace(/[^\w\såäö]/g, ' ') // Remove special characters, keep Swedish letters
    .split(/\s+/)
    .filter(word => 
      word.length > 2 && // Only words longer than 2 characters
      !stopWords.has(word) && // Not a stop word
      !/^\d+$/.test(word) // Not just numbers
    );

  // Count word frequency
  const wordCount = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });

  // Sort by frequency and get top 8 keywords
  const keywords = Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 8)
    .map(([word]) => word);

  return keywords;
}

// ADVANCED METADATA EXTRACTION - STEP 3: LANGUAGE DETECTION
function detectLanguage(text) {
  if (!text || text.trim().length === 0) {
    return 'Unknown';
  }

  // Common Swedish words and characters
  const swedishWords = ['och', 'eller', 'i', 'på', 'av', 'till', 'för', 'med', 'som', 'den', 'det', 'de', 'ett', 'en', 'är', 'var', 'kan', 'ska', 'vill', 'måste', 'får', 'jag', 'du', 'han', 'hon', 'vi', 'ni', 'de', 'min', 'din', 'hans', 'hennes', 'vår', 'er', 'deras'];
  const swedishChars = ['å', 'ä', 'ö', 'Å', 'Ä', 'Ö'];
  
  // Common English words
  const englishWords = ['the', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'with', 'as', 'is', 'are', 'was', 'were', 'can', 'will', 'would', 'should', 'must', 'may', 'a', 'an', 'of', 'by', 'from', 'this', 'that', 'these', 'those', 'it', 'its', 'they', 'them', 'their', 'we', 'us', 'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her', 'hers'];
  
  // Count Swedish and English indicators
  const textLower = text.toLowerCase();
  let swedishScore = 0;
  let englishScore = 0;
  
  // Check for Swedish characters
  swedishChars.forEach(char => {
    if (text.includes(char)) {
      swedishScore += 3; // Swedish characters are strong indicators
    }
  });
  
  // Check for Swedish words
  swedishWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'g');
    const matches = textLower.match(regex);
    if (matches) {
      swedishScore += matches.length;
    }
  });
  
  // Check for English words
  englishWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'g');
    const matches = textLower.match(regex);
    if (matches) {
      englishScore += matches.length;
    }
  });
  
  // Determine language based on scores
  if (swedishScore > englishScore && swedishScore > 2) {
    return 'Swedish';
  } else if (englishScore > swedishScore && englishScore > 2) {
    return 'English';
  } else if (swedishScore === englishScore && swedishScore > 0) {
    return 'Mixed';
  } else {
    return 'Unknown';
  }
}

// ADVANCED METADATA EXTRACTION - STEP 4: AUTOMATIC CATEGORIZATION
function categorizeDocument(text, title, keywords) {
  if (!text && !title) {
    return 'Unknown';
  }

  const content = (text + ' ' + title).toLowerCase();
  const keywordString = keywords.join(' ').toLowerCase();

  // Define category patterns
  const categories = {
    'Report': {
      patterns: ['report', 'study', 'analysis', 'investigation', 'assessment', 'evaluation', 'review'],
      keywords: ['research', 'data', 'findings', 'conclusion', 'methodology', 'results']
    },
    'Article': {
      patterns: ['article', 'paper', 'publication', 'journal', 'academic', 'scientific'],
      keywords: ['abstract', 'introduction', 'references', 'doi', 'peer-reviewed']
    },
    'Legal': {
      patterns: ['legal', 'court', 'judgment', 'decision', 'case', 'law', 'attorney', 'prosecutor'],
      keywords: ['defendant', 'plaintiff', 'indictment', 'conviction', 'appeal', 'statute']
    },
    'Government': {
      patterns: ['government', 'federal', 'state', 'department', 'agency', 'official', 'public'],
      keywords: ['policy', 'regulation', 'compliance', 'tax', 'irs', 'dept', 'administration']
    },
    'News': {
      patterns: ['news', 'press', 'release', 'announcement', 'media', 'publicity'],
      keywords: ['immediate', 'announce', 'public', 'statement', 'official']
    },
    'Technical': {
      patterns: ['technical', 'manual', 'guide', 'instruction', 'specification', 'protocol'],
      keywords: ['procedure', 'step', 'instruction', 'manual', 'guide', 'how-to']
    },
    'Financial': {
      patterns: ['financial', 'economic', 'business', 'commercial', 'market', 'investment'],
      keywords: ['revenue', 'profit', 'loss', 'income', 'expense', 'budget', 'financial']
    },
    'Medical': {
      patterns: ['medical', 'health', 'clinical', 'patient', 'treatment', 'diagnosis'],
      keywords: ['health', 'medical', 'patient', 'treatment', 'clinical', 'diagnosis']
    }
  };

  // Score each category
  const scores = {};
  
  Object.keys(categories).forEach(category => {
    let score = 0;
    const cat = categories[category];
    
    // Check patterns in content
    cat.patterns.forEach(pattern => {
      const regex = new RegExp(pattern, 'gi');
      const matches = content.match(regex);
      if (matches) {
        score += matches.length * 2; // Patterns are worth more
      }
    });
    
    // Check keywords
    cat.keywords.forEach(keyword => {
      const regex = new RegExp(keyword, 'gi');
      const matches = content.match(regex);
      if (matches) {
        score += matches.length;
      }
    });
    
    scores[category] = score;
  });

  // Find the category with highest score
  let bestCategory = 'Unknown';
  let bestScore = 0;
  
  Object.keys(scores).forEach(category => {
    if (scores[category] > bestScore) {
      bestScore = scores[category];
      bestCategory = category;
    }
  });

  // Only return a category if we have a meaningful score
  return bestScore >= 2 ? bestCategory : 'Unknown';
}

// Create a REST route for getting the metadata
app.get('/api/metadata', async (_request, response) => {

  // Read all files in pdfs
  let files = fs
    // Read all files in the folder pdfs
    .readdirSync('./frontend/pdfs')
    // Only keep files that ends with .pdf in my list
    .filter(x => x.endsWith('.pdf'));

  // Create a new array for metadata
  let metadataList = [];

  // Loop through the files
  for (let file of files) {
    // Get the meta data from PDF file
    let data = await pdfParse(fs.readFileSync('./frontend/pdfs/' + file));
    
    // OPTION A: Extract title from text if PDF title is missing
    let extractedTitle = data.info.Title;
    if (!extractedTitle || extractedTitle.trim() === '') {
      // Take first line of text as title
      let firstLine = data.text.split('\n')[0];
      // Clean up extra whitespace and special characters
      extractedTitle = firstLine.trim().replace(/[^\w\s-]/g, '').substring(0, 100);
      // If first line is too short, take first sentence
      if (extractedTitle.length < 10) {
        let firstSentence = data.text.split('.')[0];
        extractedTitle = firstSentence.trim().replace(/[^\w\s-]/g, '').substring(0, 100);
      }
    }
    
    // ENHANCED AUTHOR EXTRACTION
    let enhancedAuthor = extractAuthorFromText(data.text, data.info.Author);
    
    // ENHANCED DATE EXTRACTION
    let createdDate = parsePDFDate(data.info.CreationDate);
    let modifiedDate = parsePDFDate(data.info.ModDate);
    
    // Try to extract date from filename if no date found
    if (!createdDate) {
      createdDate = extractDateFromFilename(file);
    }
    
    // OPTION B: Add file size
    let filePath = './frontend/pdfs/' + file;
    let fileStats = fs.statSync(filePath);
    let fileSizeInBytes = fileStats.size;
    let fileSizeInKB = Math.round(fileSizeInBytes / 1024);
    let fileSizeInMB = Math.round(fileSizeInBytes / (1024 * 1024) * 100) / 100;
    
    // Format file size
    let formattedFileSize;
    if (fileSizeInMB >= 1) {
      formattedFileSize = fileSizeInMB + ' MB';
    } else {
      formattedFileSize = fileSizeInKB + ' KB';
    }
    
    // OPTION C: Add PDF version
    let pdfVersion = data.info.PDFFormatVersion || 'Unknown';
    
    // ADVANCED METADATA EXTRACTION - STEP 1: TEXT SUMMARY
    let textSummary = '';
    if (data.text && data.text.trim().length > 0) {
      // Clean the text: remove extra whitespace, newlines, and special characters
      let cleanText = data.text
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .replace(/\n+/g, ' ') // Replace newlines with spaces
        .trim();
      
      // Only create summary if we have meaningful text (more than 10 characters)
      if (cleanText.length > 10) {
        // Extract first 200 characters as summary
        textSummary = cleanText.substring(0, 200);
        
        // Add ellipsis if text was truncated
        if (cleanText.length > 200) {
          textSummary += '...';
        }
      } else if (cleanText.length > 0) {
        // For very short text, use it as is
        textSummary = cleanText;
      }
      // If cleanText is empty or very short, textSummary remains empty
    }
    
    // If no text summary was created, try to create one from available metadata
    if (!textSummary || textSummary.trim() === '') {
      let fallbackSummary = '';
      
      // Try to create summary from title and author
      if (data.info.Title && data.info.Title.trim() !== '') {
        fallbackSummary = data.info.Title.trim();
      }
      
      if (data.info.Author && data.info.Author.trim() !== '') {
        if (fallbackSummary) {
          fallbackSummary += ' - ';
        }
        fallbackSummary += data.info.Author.trim();
      }
      
      // If we have a fallback summary, use it
      if (fallbackSummary && fallbackSummary.length > 0) {
        textSummary = fallbackSummary.substring(0, 200);
        if (fallbackSummary.length > 200) {
          textSummary += '...';
        }
      }
    }
    
    // ADVANCED METADATA EXTRACTION - STEP 2: KEYWORD EXTRACTION
    let keywords = [];
    if (data.text && data.text.trim().length > 0) {
      keywords = extractKeywords(data.text);
    }
    
    // ADVANCED METADATA EXTRACTION - STEP 3: LANGUAGE DETECTION
    let language = detectLanguage(data.text);
    
    // ADVANCED METADATA EXTRACTION - STEP 4: AUTOMATIC CATEGORIZATION
    let category = categorizeDocument(data.text, data.info.Title, keywords);
    
    // Create enhanced metadata with all new fields
    let enhancedMetadata = {
      ...data,
      extractedTitle: extractedTitle,
      enhancedAuthor: enhancedAuthor,
      fileSize: formattedFileSize,
      fileSizeBytes: fileSizeInBytes,
      pdfVersion: pdfVersion,
      createdDate: createdDate,
      modifiedDate: modifiedDate,
      textSummary: textSummary, // Add the new text summary
      keywords: keywords, // Add the new keywords
      language: language, // Add the new language
      category: category // Add the new category
    };
    
    // Add the filename and the enhanced metadata to our meta data list
    metadataList.push({ file, metadata: enhancedMetadata });
  }

  // Send the meta data as a response to the request
  // (to our web browser)
  response.json(metadataList);

});

// Create a REST route for searching PDF metadata
app.get('/api/search', async (request, response) => {
  
  // Get search query, filter parameters, and sorting parameters from URL parameters
  let searchQuery = request.query.q;
  const minSize = parseInt(request.query.minSize) || 0;
  const maxSize = parseInt(request.query.maxSize) || Infinity;
  const minDate = request.query.minDate ? new Date(request.query.minDate) : null;
  const maxDate = request.query.maxDate ? new Date(request.query.maxDate) : null;
  const sortBy = request.query.sortBy || 'title'; // title, size, date
  const sortOrder = request.query.sortOrder || 'asc'; // asc, desc
  
  // If no search query provided, return empty results
  if (!searchQuery || searchQuery.trim() === '') {
    response.json([]);
    return;
  }

  // Add search query to history (if it's not already there)
  const trimmedQuery = searchQuery.trim();
  if (!searchHistory.includes(trimmedQuery)) {
    searchHistory.unshift(trimmedQuery); // Add to beginning
    if (searchHistory.length > MAX_HISTORY_ITEMS) {
      searchHistory = searchHistory.slice(0, MAX_HISTORY_ITEMS); // Keep only latest 10
    }
  }
  
  // Convert search query to lowercase for case-insensitive search
  searchQuery = searchQuery.toLowerCase().trim();
  
  // Read all files in pdfs (same logic as /api/metadata)
  let files = fs
    // Read all files in the folder pdfs
    .readdirSync('./frontend/pdfs')
    // Only keep files that ends with .pdf in my list
    .filter(x => x.endsWith('.pdf'));

  // Create a new array for search results
  let searchResults = [];

  // Loop through the files
  for (let file of files) {
    // Get the meta data from PDF file
    let data = await pdfParse(fs.readFileSync('./frontend/pdfs/' + file));
    
    // OPTION A: Extract title from text if PDF title is missing (same as /api/metadata)
    let extractedTitle = data.info.Title;
    if (!extractedTitle || extractedTitle.trim() === '') {
      // Take first line of text as title
      let firstLine = data.text.split('\n')[0];
      // Clean up extra whitespace and special characters
      extractedTitle = firstLine.trim().replace(/[^\w\s-]/g, '').substring(0, 100);
      // If first line is too short, take first sentence
      if (extractedTitle.length < 10) {
        let firstSentence = data.text.split('.')[0];
        extractedTitle = firstSentence.trim().replace(/[^\w\s-]/g, '').substring(0, 100);
      }
    }
    
    // ENHANCED AUTHOR EXTRACTION (same as /api/metadata)
    let enhancedAuthor = extractAuthorFromText(data.text, data.info.Author);
    
    // ENHANCED DATE EXTRACTION (same as /api/metadata)
    let createdDate = parsePDFDate(data.info.CreationDate);
    let modifiedDate = parsePDFDate(data.info.ModDate);
    
    // Try to extract date from filename if no date found
    if (!createdDate) {
      createdDate = extractDateFromFilename(file);
    }
    
    // OPTION B: Add file size (same as /api/metadata)
    let filePath = './frontend/pdfs/' + file;
    let fileStats = fs.statSync(filePath);
    let fileSizeInBytes = fileStats.size;
    let fileSizeInKB = Math.round(fileSizeInBytes / 1024);
    let fileSizeInMB = Math.round(fileSizeInBytes / (1024 * 1024) * 100) / 100;
    
    // Format file size
    let formattedFileSize;
    if (fileSizeInMB >= 1) {
      formattedFileSize = fileSizeInMB + ' MB';
    } else {
      formattedFileSize = fileSizeInKB + ' KB';
    }
    
    // OPTION C: Add PDF version (same as /api/metadata)
    let pdfVersion = data.info.PDFFormatVersion || 'Unknown';
    
    // ADVANCED METADATA EXTRACTION - STEP 1: TEXT SUMMARY (same as /api/metadata)
    let textSummary = '';
    if (data.text && data.text.trim().length > 0) {
      // Clean the text: remove extra whitespace, newlines, and special characters
      let cleanText = data.text
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .replace(/\n+/g, ' ') // Replace newlines with spaces
        .trim();
      
      // Only create summary if we have meaningful text (more than 10 characters)
      if (cleanText.length > 10) {
        // Extract first 200 characters as summary
        textSummary = cleanText.substring(0, 200);
        
        // Add ellipsis if text was truncated
        if (cleanText.length > 200) {
          textSummary += '...';
        }
      } else if (cleanText.length > 0) {
        // For very short text, use it as is
        textSummary = cleanText;
      }
      // If cleanText is empty or very short, textSummary remains empty
    }
    
    // If no text summary was created, try to create one from available metadata
    if (!textSummary || textSummary.trim() === '') {
      let fallbackSummary = '';
      
      // Try to create summary from title and author
      if (data.info.Title && data.info.Title.trim() !== '') {
        fallbackSummary = data.info.Title.trim();
      }
      
      if (data.info.Author && data.info.Author.trim() !== '') {
        if (fallbackSummary) {
          fallbackSummary += ' - ';
        }
        fallbackSummary += data.info.Author.trim();
      }
      
      // If we have a fallback summary, use it
      if (fallbackSummary && fallbackSummary.length > 0) {
        textSummary = fallbackSummary.substring(0, 200);
        if (fallbackSummary.length > 200) {
          textSummary += '...';
        }
      }
    }
    
    // ADVANCED METADATA EXTRACTION - STEP 2: KEYWORD EXTRACTION (same as /api/metadata)
    let keywords = [];
    if (data.text && data.text.trim().length > 0) {
      keywords = extractKeywords(data.text);
    }
    
    // ADVANCED METADATA EXTRACTION - STEP 3: LANGUAGE DETECTION (same as /api/metadata)
    let language = detectLanguage(data.text);
    
    // ADVANCED METADATA EXTRACTION - STEP 4: AUTOMATIC CATEGORIZATION (same as /api/metadata)
    let category = categorizeDocument(data.text, data.info.Title, keywords);
    
    // Create enhanced metadata with all new fields (same as /api/metadata)
    let enhancedMetadata = {
      ...data,
      extractedTitle: extractedTitle,
      enhancedAuthor: enhancedAuthor,
      fileSize: formattedFileSize,
      fileSizeBytes: fileSizeInBytes,
      pdfVersion: pdfVersion,
      createdDate: createdDate,
      modifiedDate: modifiedDate,
      textSummary: textSummary, // Add the new text summary
      keywords: keywords, // Add the new keywords
      language: language, // Add the new language
      category: category // Add the new category
    };
    
                    // FUZZY SEARCH LOGIC: Use Fuse.js for better matching
                const searchData = [
                  { title: extractedTitle, author: enhancedAuthor || '', content: data.text || '', keywords: keywords.join(' '), language: language, category: category }
                ];
                
                const fuseOptions = {
                  keys: ['title', 'author', 'content', 'keywords', 'language', 'category'],
                  threshold: 0.4, // Lower = more strict, Higher = more fuzzy
                  includeScore: true,
                  ignoreLocation: true,
                  useExtendedSearch: false
                };
                
                const fuse = new Fuse(searchData, fuseOptions);
                const fuzzyResults = fuse.search(searchQuery);
                
                const matchesSearch = fuzzyResults.length > 0 && fuzzyResults[0].score < 0.6;
                
                // FILTER LOGIC: Check file size and date filters
                const matchesSizeFilter = fileSizeInKB >= minSize && fileSizeInKB <= maxSize;
                
                const matchesDateFilter = !minDate || !maxDate || (createdDate && createdDate >= minDate && createdDate <= maxDate);
                
                if (matchesSearch && matchesSizeFilter && matchesDateFilter) {
      // Add matching file to search results
      searchResults.push({ file, metadata: enhancedMetadata });
    }
  }

  // SORT THE SEARCH RESULTS
  searchResults.sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'title':
        aValue = (a.metadata.extractedTitle || '').toLowerCase();
        bValue = (b.metadata.extractedTitle || '').toLowerCase();
        break;
      case 'size':
        aValue = a.metadata.fileSizeBytes || 0;
        bValue = b.metadata.fileSizeBytes || 0;
        break;
      case 'date':
        aValue = a.metadata.createdDate ? new Date(a.metadata.createdDate).getTime() : 0;
        bValue = b.metadata.createdDate ? new Date(b.metadata.createdDate).getTime() : 0;
        break;
      default:
        aValue = (a.metadata.extractedTitle || '').toLowerCase();
        bValue = (b.metadata.extractedTitle || '').toLowerCase();
    }
    
    if (sortOrder === 'desc') {
      return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
    } else {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    }
  });

  // Send the sorted search results as a response
  response.json(searchResults);

});

// GET endpoint to retrieve search history
app.get('/api/search-history', (request, response) => {
  response.json(searchHistory);
});

// Serve all files in the frontend folder
app.use(express.static('frontend'));

// Start the webserver on port 3000
app.listen(3000, () => {
  console.log('Server listening on http://localhost:3000');
});