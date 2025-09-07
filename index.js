// Import the file system module
import fs from 'fs';
// Import pdf-parse-fork that lets me extract metadata from PDF files
import pdfParse from 'pdf-parse-fork';
// Import express - that will help me create a web server
import express from 'express';
// Import Fuse.js for fuzzy matching
import Fuse from 'fuse.js';
// Import exif-parser for JPG metadata extraction
import ExifParser from 'exif-parser';
// Import music-metadata for MP3 metadata extraction
import { parseFile } from 'music-metadata';
// Import database connection and models
import sequelize from './database.js';
import { FileMetadata, Favorites, syncDatabase } from './models.js';

// Load PowerPoint metadata from JSON file
let pptMetadata = [];
try {
  const pptMetadataContent = fs.readFileSync('./data/ppt-metadata.json', 'utf8');
  pptMetadata = JSON.parse(pptMetadataContent);
  console.log(`Loaded ${pptMetadata.length} PowerPoint metadata records`);
} catch (error) {
  console.log('No PowerPoint metadata found, will create empty array');
  pptMetadata = [];
}

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

// Function to apply search operator
function applySearchOperator(value, searchTerm, operator) {
  if (!value || !searchTerm) return false;
  
  const valueStr = value.toString().toLowerCase();
  const searchStr = searchTerm.toLowerCase();
  
  switch (operator) {
    case 'equals':
      return valueStr === searchStr;
    case 'not_equals':
      return valueStr !== searchStr;
    case 'greater_than':
      const numValue = parseFloat(valueStr);
      const numSearch = parseFloat(searchStr);
      return !isNaN(numValue) && !isNaN(numSearch) && numValue > numSearch;
    case 'less_than':
      const numValue2 = parseFloat(valueStr);
      const numSearch2 = parseFloat(searchStr);
      return !isNaN(numValue2) && !isNaN(numSearch2) && numValue2 < numSearch2;
    case 'contains':
    default:
      return valueStr.includes(searchStr);
  }
}

// Function to apply GPS search operator
function applyGPSSearchOperator(fileLat, fileLon, searchLat, searchLon, operator) {
  if (!fileLat || !fileLon || (!searchLat && !searchLon)) return false;
  
  const fileLatNum = parseFloat(fileLat);
  const fileLonNum = parseFloat(fileLon);
  const searchLatNum = parseFloat(searchLat);
  const searchLonNum = parseFloat(searchLon);
  
  if (isNaN(fileLatNum) || isNaN(fileLonNum)) return false;
  
  switch (operator) {
    case 'equals':
      if (searchLat && searchLon) {
        return Math.abs(fileLatNum - searchLatNum) < 0.001 && Math.abs(fileLonNum - searchLonNum) < 0.001;
      } else if (searchLat) {
        return Math.abs(fileLatNum - searchLatNum) < 0.001;
      } else if (searchLon) {
        return Math.abs(fileLonNum - searchLonNum) < 0.001;
      }
      return false;
    case 'greater_than':
      if (searchLon) return fileLonNum > searchLonNum;
      return false;
    case 'less_than':
      if (searchLon) return fileLonNum < searchLonNum;
      return false;
    case 'greater_than_lat':
      if (searchLat) return fileLatNum > searchLatNum;
      return false;
    case 'less_than_lat':
      if (searchLat) return fileLatNum < searchLatNum;
      return false;
    default:
      return false;
  }
}

// Function to save metadata to database
async function saveMetadataToDatabase(metadata) {
  try {
    // Check if file already exists in database
    const existingFile = await FileMetadata.findOne({
      where: {
        filename: metadata.filename,
        filepath: metadata.filepath
      }
    });

    if (existingFile) {
      // Update existing record
      await existingFile.update(metadata);
      console.log(`📝 Uppdaterade metadata för: ${metadata.filename}`);
    } else {
      // Create new record
      await FileMetadata.create(metadata);
      console.log(`💾 Sparade ny metadata för: ${metadata.filename}`);
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Fel vid sparande av metadata för ${metadata.filename}:`, error.message);
    return false;
  }
}

// Create a web server, store in the variable app
let app = express();

// Middleware för att hantera JSON requests (behövs för favorites API)
app.use(express.json());

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

// Helper function to parse PPT dates
function parsePPTDate(dateString) {
  if (!dateString || dateString === "-" || dateString.trim() === "") {
    return null;
  }
  
  try {
    // Try to parse the date
    let date = new Date(dateString);
    
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

// Function to calculate relevance score for search results
function calculateRelevanceScore(metadata, searchQuery, searchOperator) {
  if (!searchQuery || !searchQuery.trim()) return 0;
  
  let totalScore = 0;
  const query = searchQuery.toLowerCase().trim();
  
  // Define field weights (higher = more important)
  const fieldWeights = {
    title: 10,           // Most important
    author: 8,           // Very important
    content: 5,          // Important
    keywords: 6,         // Important
    language: 2,         // Less important
    category: 2,         // Less important
    fileType: 1          // Least important
  };
  
  // Check each field for matches
  const fields = {
    title: metadata.title || metadata.extractedTitle || '',
    author: metadata.author || metadata.enhancedAuthor || '',
    content: metadata.text || metadata.textSummary || '',
    keywords: (metadata.keywords || []).join(' '),
    language: metadata.language || '',
    category: metadata.category || '',
    fileType: metadata.fileType || ''
  };
  
  // Calculate score for each field
  for (const [fieldName, fieldValue] of Object.entries(fields)) {
    const weight = fieldWeights[fieldName];
    const value = fieldValue.toString().toLowerCase();
    
    // Check if field matches search query
    if (applySearchOperator(value, query, searchOperator)) {
      // Base score for matching
      totalScore += weight;
      
      // Bonus for exact matches
      if (value === query) {
        totalScore += 5; // Extra bonus for exact match
      }
      
      // Bonus for word boundary matches (starts with, ends with, whole word)
      if (value.startsWith(query) || value.endsWith(query)) {
        totalScore += 2;
      }
    }
  }
  
  return totalScore;
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

// JPG METADATA EXTRACTION FUNCTION
function extractJPGMetadata(filePath) {
  try {
    // Read the JPG file
    const buffer = fs.readFileSync(filePath);
    
    // Extract EXIF data
    let exifData = null;
    try {
      exifData = ExifParser.create(buffer).parse();
    } catch (exifError) {
      console.log(`No EXIF data found in ${filePath}:`, exifError.message);
    }
    
    // Initialize metadata object using common structure
    const metadata = {
      filename: filePath.split('/').pop(),
      fileType: 'JPG',
      fileSize: formatFileSize(fs.statSync(filePath).size),
      title: 'JPG Image',
      author: null,
      createdDate: null,
      modifiedDate: null,
      keywords: ['image', 'photo', 'jpg'],
      language: 'Unknown',
      category: 'Image',
      // JPG specific fields
      dimensions: null,
      camera: null,
      location: null
    };
    
    // Extract basic file info
    if (exifData && exifData.tags) {
      // Camera information
      if (exifData.tags.Make && exifData.tags.Model) {
        metadata.camera = `${exifData.tags.Make} ${exifData.tags.Model}`;
      }
      
      // Date information
      if (exifData.tags.DateTimeOriginal) {
        metadata.createdDate = new Date(exifData.tags.DateTimeOriginal);
      }
      if (exifData.tags.ModifyDate) {
        metadata.modifiedDate = new Date(exifData.tags.ModifyDate);
      }
      
      // Extract GPS information
      if (exifData.tags.GPSLatitude && exifData.tags.GPSLongitude) {
        metadata.location = {
          latitude: exifData.tags.GPSLatitude,
          longitude: exifData.tags.GPSLongitude
        };
      }
      
      // Extract image dimensions
      if (exifData.imageSize) {
        metadata.dimensions = `${exifData.imageSize.width} x ${exifData.imageSize.height}`;
      }
      
      // Extract title/description
      if (exifData.tags.ImageDescription) {
        metadata.title = exifData.tags.ImageDescription;
      }
    }
    
    // Generate keywords from available data
    const keywordData = [
      metadata.camera,
      metadata.title,
      metadata.author,
      metadata.dimensions
    ].filter(Boolean).join(' ');
    
    if (keywordData) {
      metadata.keywords = extractKeywords(keywordData);
    }
    
    return metadata;
    
  } catch (error) {
    console.error(`Error extracting JPG metadata from ${filePath}:`, error);
    return {
      filename: filePath.split('/').pop(),
      fileType: 'JPG',
      fileSize: formatFileSize(fs.statSync(filePath).size),
      title: 'JPG Image',
      author: null,
      createdDate: null,
      modifiedDate: null,
      keywords: ['image', 'photo', 'jpg'],
      language: 'Unknown',
      category: 'Image',
      dimensions: null,
      camera: null,
      location: null
    };
  }
}

// MP3 METADATA EXTRACTION FUNCTION
async function extractMP3Metadata(filePath) {
  try {
    // Parse MP3 file metadata - use the correct async API
    const metadata = await parseFile(filePath);
    
    // Initialize metadata object using common structure
    const mp3Metadata = {
      filename: filePath.split('/').pop(),
      fileType: 'MP3',
      fileSize: formatFileSize(fs.statSync(filePath).size),
      title: metadata.common.title || 'Unknown Title',
      author: metadata.common.artist || null,
      createdDate: null,
      modifiedDate: null,
      keywords: ['music', 'audio', 'mp3'],
      language: 'Unknown',
      category: 'Music',
      // MP3 specific fields
      duration: metadata.format.duration ? Math.round(metadata.format.duration) : null,
      album: metadata.common.album || null,
      artist: metadata.common.artist || null,
      year: metadata.common.year || null,
      genre: metadata.common.genre ? metadata.common.genre[0] : null
    };

    return mp3Metadata;
  } catch (error) {
    console.error(`Error extracting MP3 metadata from ${filePath}:`, error);
    return {
      filename: filePath.split('/').pop(),
      fileType: 'MP3',
      fileSize: formatFileSize(fs.statSync(filePath).size),
      title: 'MP3 Audio File',
      author: null,
      createdDate: null,
      modifiedDate: null,
      keywords: ['music', 'audio', 'mp3'],
      language: 'Unknown',
      category: 'Music',
      duration: null,
      album: null,
      artist: null,
      year: null,
      genre: null
    };
  }
}

// PPT METADATA EXTRACTION FUNCTION
function extractPPTMetadata(filePath) {
  try {
    // Get filename without path
    const filename = filePath.split('/').pop();
    const digest = filename.replace('.ppt', '');
    
    // Find metadata for this file
    const metadata = pptMetadata.find(record => record.digest === digest);
    
    // Get file stats
    const fileStats = fs.statSync(filePath);
    const fileSizeInBytes = fileStats.size;
    
    // Create better title if the original is poor
    let betterTitle = metadata ? metadata.title : 'Unknown PowerPoint';
    
    // If title is "Slide 1" or similar, create a better title
    if (betterTitle === 'Slide 1' || betterTitle === 'Unknown PowerPoint' || betterTitle.trim() === '' || 
        /^\d+$/.test(betterTitle) || betterTitle.length < 3 || 
        /^(Arial|Times|Calibri|Verdana)\s+\d+$/i.test(betterTitle)) {
      // Try to create title from company and slides info
      if (metadata && metadata.company && metadata.company !== '-' && metadata.company !== 'Unknown Company') {
        betterTitle = `${metadata.company} Presentation`;
        if (metadata.slide_count) {
          betterTitle += ` (${metadata.slide_count} slides)`;
        }
      } else {
        // Fallback to filename-based title
        betterTitle = `PowerPoint Presentation - ${filename.replace('.ppt', '')}`;
      }
    }
    
    // Initialize metadata object using common structure
    const pptData = {
      filename: filename,
      fileType: 'PPT',
      fileSize: formatFileSize(fileSizeInBytes),
      title: betterTitle,
      author: metadata ? metadata.company : null,
      createdDate: metadata && metadata.creation_date ? parsePPTDate(metadata.creation_date) : null,
      modifiedDate: metadata && metadata.last_modified ? parsePPTDate(metadata.last_modified) : null,
      keywords: ['presentation', 'powerpoint', 'ppt'],
      language: 'Unknown',
      category: 'Presentation',
      // PPT specific fields
      slides: metadata ? metadata.slide_count : 0,
      wordCount: metadata ? metadata.word_count : 0,
      revisionNumber: metadata ? metadata.revision_number : null,
      company: metadata ? metadata.company : null,
      urlkey: metadata ? metadata.urlkey : null
    };
    
    // Generate keywords from available data
    const keywordData = [
      pptData.title,
      pptData.author,
      pptData.company,
      `slides: ${pptData.slides}`,
      `words: ${pptData.wordCount}`
    ].filter(Boolean).join(' ');
    
    if (keywordData) {
      pptData.keywords = extractKeywords(keywordData);
    }
    
    return pptData;
    
  } catch (error) {
    console.error(`Error extracting PPT metadata from ${filePath}:`, error);
    const filename = filePath.split('/').pop();
    return {
      filename: filename,
      fileType: 'PPT',
      fileSize: formatFileSize(fs.statSync(filePath).size),
      title: `PowerPoint Presentation - ${filename.replace('.ppt', '')}`,
      author: null,
      createdDate: null,
      modifiedDate: null,
      keywords: ['presentation', 'powerpoint', 'ppt'],
      language: 'Unknown',
      category: 'Presentation',
      slides: 0,
      wordCount: 0,
      revisionNumber: null,
      company: null,
      urlkey: null
    };
  }
}

// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
  const keywordString = (keywords && Array.isArray(keywords) ? keywords.join(' ') : '').toLowerCase();

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
    
    // Save to database
    const dbMetadata = {
      filename: file,
      filepath: './frontend/pdfs/' + file,
      fileType: 'pdf',
      fileSize: fileSizeInBytes,
      title: extractedTitle,
      author: enhancedAuthor,
      creationDate: createdDate,
      modificationDate: modifiedDate,
      keywords: keywords.join(', '),
      description: textSummary,
      category: category,
      language: language,
      pdfVersion: pdfVersion,
      pageCount: data.numpages || null
    };
    
    await saveMetadataToDatabase(dbMetadata);
  }

  // PROCESS JPG FILES
  try {
    let jpgFiles = fs
      .readdirSync('./frontend/jpgs')
      .filter(x => x.toLowerCase().endsWith('.jpg') || x.toLowerCase().endsWith('.jpeg') || x.toLowerCase().endsWith('.png'));

    for (let file of jpgFiles) {
      let jpgMetadata = extractJPGMetadata('./frontend/jpgs/' + file);
      metadataList.push({ file, metadata: jpgMetadata });
      
      // Save to database
      const dbMetadata = {
        filename: file,
        filepath: './frontend/jpgs/' + file,
        fileType: 'jpg',
        fileSize: jpgMetadata.fileSizeBytes || 0,
        title: jpgMetadata.title,
        author: jpgMetadata.photographer,
        creationDate: jpgMetadata.photoDate,
        modificationDate: jpgMetadata.modifiedDate,
        keywords: jpgMetadata.keywords ? jpgMetadata.keywords.join(', ') : '',
        description: jpgMetadata.description,
        category: jpgMetadata.category,
        language: jpgMetadata.language,
        dimensions: jpgMetadata.dimensions,
        camera: jpgMetadata.camera,
        photoDate: jpgMetadata.photoDate,
        photographer: jpgMetadata.photographer,
        location: jpgMetadata.location ? JSON.stringify(jpgMetadata.location) : null,
        gpsLatitude: jpgMetadata.gpsLatitude,
        gpsLongitude: jpgMetadata.gpsLongitude
      };
      
      await saveMetadataToDatabase(dbMetadata);
    }
  } catch (error) {
    console.error('Error processing JPG files:', error);
  }

  // PROCESS MP3 FILES
  try {
    let mp3Files = fs
      .readdirSync('./frontend/mp3s')
      .filter(x => x.toLowerCase().endsWith('.mp3') || x.toLowerCase().endsWith('.wav') || x.toLowerCase().endsWith('.flac'));

    for (let file of mp3Files) {
      let mp3Metadata = await extractMP3Metadata('./frontend/mp3s/' + file);
      metadataList.push({ file, metadata: mp3Metadata });
      
      // Save to database
      const dbMetadata = {
        filename: file,
        filepath: './frontend/mp3s/' + file,
        fileType: 'mp3',
        fileSize: mp3Metadata.fileSizeBytes || 0,
        title: mp3Metadata.title,
        author: mp3Metadata.artist,
        creationDate: mp3Metadata.createdDate,
        modificationDate: mp3Metadata.modifiedDate,
        keywords: mp3Metadata.keywords ? mp3Metadata.keywords.join(', ') : '',
        description: mp3Metadata.description,
        category: mp3Metadata.category,
        language: mp3Metadata.language,
        artist: mp3Metadata.artist,
        album: mp3Metadata.album,
        duration: mp3Metadata.duration,
        genre: mp3Metadata.genre,
        year: mp3Metadata.year
      };
      
      await saveMetadataToDatabase(dbMetadata);
    }
  } catch (error) {
    console.error('Error processing MP3 files:', error);
  }

  // PROCESS PPT FILES
  try {
    let pptFiles = fs
      .readdirSync('./frontend/ppts')
      .filter(x => x.toLowerCase().endsWith('.ppt') || x.toLowerCase().endsWith('.pptx'));

    for (let file of pptFiles) {
      let pptMetadata = extractPPTMetadata('./frontend/ppts/' + file);
      metadataList.push({ file, metadata: pptMetadata });
      
      // Save to database
      const dbMetadata = {
        filename: file,
        filepath: './frontend/ppts/' + file,
        fileType: 'ppt',
        fileSize: pptMetadata.fileSizeBytes || 0,
        title: pptMetadata.title,
        author: pptMetadata.author,
        creationDate: pptMetadata.createdDate,
        modificationDate: pptMetadata.modifiedDate,
        keywords: pptMetadata.keywords ? pptMetadata.keywords.join(', ') : '',
        description: pptMetadata.description,
        category: pptMetadata.category,
        language: pptMetadata.language,
        slideCount: pptMetadata.slides,
        wordCount: pptMetadata.words,
        company: pptMetadata.company,
        revision: pptMetadata.revision
      };
      
      await saveMetadataToDatabase(dbMetadata);
    }
  } catch (error) {
    console.error('Error processing PPT files:', error);
  }

  // Send the meta data as a response to the request
  // (to our web browser)
  response.json(metadataList);

});

// New endpoint to get metadata from database
app.get('/api/database-metadata', async (request, response) => {
  try {
    const fileType = request.query.fileType;
    const searchQuery = request.query.q;
    
    let whereClause = {};
    
    // Filter by file type if specified
    if (fileType && fileType !== 'all') {
      whereClause.fileType = fileType;
    }
    
    // Search in title, author, keywords, description
    if (searchQuery && typeof searchQuery === 'string' && searchQuery.trim() !== '') {
      whereClause[sequelize.Op.or] = [
        { title: { [sequelize.Op.like]: `%${searchQuery}%` } },
        { author: { [sequelize.Op.like]: `%${searchQuery}%` } },
        { keywords: { [sequelize.Op.like]: `%${searchQuery}%` } },
        { description: { [sequelize.Op.like]: `%${searchQuery}%` } }
      ];
    }
    
    const dbResults = await FileMetadata.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });
    
    // Transform database format to frontend-compatible format
    const transformedResults = dbResults.map(dbItem => {
      // Convert to plain object
      const item = dbItem.toJSON();
      
      // Create frontend-compatible structure
      return {
        file: item.filename,
        metadata: {
          fileType: item.fileType ? item.fileType.toUpperCase() : 'UNKNOWN',
          title: item.title,
          extractedTitle: item.title, // Alias for compatibility
          author: item.author,
          enhancedAuthor: item.author, // Alias for compatibility
          fileSize: formatFileSize(item.fileSize),
          createdDate: item.creationDate,
          modifiedDate: item.modificationDate,
          numpages: item.pageCount, // PDF field mapping
          pdfVersion: item.pdfVersion, // PDF field
          
          // JPG-specific fields
          dimensions: item.dimensions,
          camera: item.camera,
          location: item.gpsLatitude && item.gpsLongitude ? {
            latitude: parseFloat(item.gpsLatitude),
            longitude: parseFloat(item.gpsLongitude)
          } : null,
          
          // MP3-specific fields  
          duration: item.duration,
          album: item.album,
          artist: item.artist,
          genre: item.genre,
          
          // PPT-specific fields
          slides: item.slideCount,
          company: item.company,
          wordCount: item.wordCount,
          revisionNumber: item.revisionNumber,
          
          // Enhanced metadata
          keywords: item.keywords ? item.keywords.split(',').map(k => k.trim()) : [],
          language: item.language || 'Unknown',
          category: item.category || 'Unknown',
          textSummary: item.description || item.textSummary
        }
      };
    });
    
    response.json(transformedResults);
  } catch (error) {
    console.error('Error fetching from database:', error);
    response.status(500).json({ error: 'Database error' });
  }
});

// formatFileSize function already exists above, using that one

// Create a REST route for searching PDF metadata
app.get('/api/search', async (request, response) => {
  
  // Get search query, filter parameters, and sorting parameters from URL parameters
  let searchQuery = request.query.q;
  const fileType = request.query.type; // New: file type filter
  const searchOperator = request.query.operator || 'contains'; // New: search operator
      const isGPSSearch = request.query.gps === 'true'; // GPS search flag
  const latitude = parseFloat(request.query.latitude); // New: GPS latitude
  const longitude = parseFloat(request.query.longitude); // New: GPS longitude
  const gpsOperator = request.query.gpsOperator || 'equals'; // New: GPS operator
  const minSize = parseInt(request.query.minSize) || 0;
  const maxSize = parseInt(request.query.maxSize) || Infinity;
  const minDate = request.query.minDate ? new Date(request.query.minDate) : null;
  const maxDate = request.query.maxDate ? new Date(request.query.maxDate) : null;
  const sortBy = request.query.sortBy || 'title'; // title, size, date
  const sortOrder = request.query.sortOrder || 'asc'; // asc, desc
  
  // If no search query provided but file type filter is active, show all files of that type
  if (!searchQuery || (typeof searchQuery === 'string' && searchQuery.trim() === '')) {
    // If no file type filter, return empty results
    if (!request.query.type) {
      response.json([]);
      return;
    }
    // If file type filter is active, we'll show all files of that type (handled below)
  }

  // Add search query to history (if it's not already there)
  if (searchQuery && typeof searchQuery === 'string' && searchQuery.trim() !== '') {
    const trimmedQuery = searchQuery.trim();
    if (!searchHistory.includes(trimmedQuery)) {
      searchHistory.unshift(trimmedQuery); // Add to beginning
      if (searchHistory.length > MAX_HISTORY_ITEMS) {
        searchHistory = searchHistory.slice(0, MAX_HISTORY_ITEMS); // Keep only latest 10
      }
    }
  }
  
  // Convert search query to lowercase for case-insensitive search
  if (searchQuery && typeof searchQuery === 'string' && searchQuery.trim() !== '') {
    searchQuery = searchQuery.toLowerCase().trim();
  }
  
  // Get ALL metadata from all file types
  let allMetadata = [];
  
  // PROCESS PDF FILES
  try {
    let pdfFiles = fs
      .readdirSync('./frontend/pdfs')
      .filter(x => x.toLowerCase().endsWith('.pdf'));

    for (let file of pdfFiles) {
      let data = await pdfParse(fs.readFileSync('./frontend/pdfs/' + file));
      
      // Extract title from text if PDF title is missing
      let extractedTitle = data.info.Title;
      if (!extractedTitle || extractedTitle.trim() === '') {
        let firstLine = data.text.split('\n')[0];
        extractedTitle = firstLine.trim().replace(/[^\w\s-]/g, '').substring(0, 100);
        if (extractedTitle.length < 10) {
          let firstSentence = data.text.split('.')[0];
          extractedTitle = firstSentence.trim().replace(/[^\w\s-]/g, '').substring(0, 100);
        }
      }
      
      let enhancedAuthor = extractAuthorFromText(data.text, data.info.Author);
      let createdDate = parsePDFDate(data.info.CreationDate);
      let modifiedDate = parsePDFDate(data.info.ModDate);
      
      if (!createdDate) {
        createdDate = extractDateFromFilename(file);
      }
      
      let filePath = './frontend/pdfs/' + file;
      let fileStats = fs.statSync(filePath);
      let fileSizeInBytes = fileStats.size;
      let fileSizeInKB = Math.round(fileSizeInBytes / 1024);
      let fileSizeInMB = Math.round(fileSizeInBytes / (1024 * 1024) * 100) / 100;
      
      let formattedFileSize;
      if (fileSizeInMB >= 1) {
        formattedFileSize = fileSizeInMB + ' MB';
      } else {
        formattedFileSize = fileSizeInKB + ' KB';
      }
      
      let pdfVersion = data.info.PDFFormatVersion || 'Unknown';
      
      // Text summary
      let textSummary = '';
      if (data.text && data.text.trim().length > 0) {
        let cleanText = data.text
          .replace(/\s+/g, ' ')
          .replace(/\n+/g, ' ')
          .trim();
        
        if (cleanText.length > 10) {
          textSummary = cleanText.substring(0, 200) + (cleanText.length > 200 ? '...' : '');
        }
      }
      
      // Keywords extraction
      let keywords = extractKeywords(data.text);
      
      // Language detection
      let language = detectLanguage(data.text);
      
      // Category detection
      let category = categorizeDocument(data.text, data.info.Subject, data.info.Keywords);
      
      let pdfMetadata = {
        filename: file,
        fileType: 'PDF',
        fileSize: formattedFileSize,
        fileSizeBytes: fileSizeInBytes,
        title: extractedTitle,
        author: enhancedAuthor,
        createdDate: createdDate,
        modifiedDate: modifiedDate,
        keywords: keywords,
        language: language,
        category: category,
        numpages: data.numpages,
        numrender: data.numrender,
        info: data.info,
        metadata: data.metadata,
        text: data.text,
        version: data.version,
        extractedTitle: extractedTitle,
        enhancedAuthor: enhancedAuthor,
        fileSize: formattedFileSize,
        fileSizeBytes: fileSizeInBytes,
        pdfVersion: pdfVersion,
        createdDate: createdDate,
        modifiedDate: modifiedDate,
        textSummary: textSummary,
        keywords: keywords,
        language: language,
        category: category
      };
      
      allMetadata.push({ file, metadata: pdfMetadata });
    }
  } catch (error) {
    console.error('Error processing PDF files for search:', error);
  }
  
  // PROCESS JPG FILES
  try {
    let jpgFiles = fs
      .readdirSync('./frontend/jpgs')
      .filter(x => x.toLowerCase().endsWith('.jpg') || x.toLowerCase().endsWith('.jpeg') || x.toLowerCase().endsWith('.png'));

    for (let file of jpgFiles) {
      let jpgMetadata = extractJPGMetadata('./frontend/jpgs/' + file);
      allMetadata.push({ file, metadata: jpgMetadata });
    }
  } catch (error) {
    console.error('Error processing JPG files for search:', error);
  }
  
  // PROCESS MP3 FILES
  try {
    let mp3Files = fs
      .readdirSync('./frontend/mp3s')
      .filter(x => x.toLowerCase().endsWith('.mp3') || x.toLowerCase().endsWith('.wav') || x.toLowerCase().endsWith('.flac'));

    for (let file of mp3Files) {
      let mp3Metadata = await extractMP3Metadata('./frontend/mp3s/' + file);
      allMetadata.push({ file, metadata: mp3Metadata });
    }
  } catch (error) {
    console.error('Error processing MP3 files for search:', error);
  }
  
  // PROCESS PPT FILES
  try {
    let pptFiles = fs
      .readdirSync('./frontend/ppts')
      .filter(x => x.toLowerCase().endsWith('.ppt') || x.toLowerCase().endsWith('.pptx'));

    for (let file of pptFiles) {
      let pptMetadata = extractPPTMetadata('./frontend/ppts/' + file);
      allMetadata.push({ file, metadata: pptMetadata });
    }
  } catch (error) {
    console.error('Error processing PPT files for search:', error);
  }
  
  // Create a new array for search results
  let searchResults = [];

  // Loop through ALL metadata and search in all file types
  for (let item of allMetadata) {
    let file = item.file;
    let metadata = item.metadata;
    
    // ADVANCED SEARCH LOGIC: Check if search query matches any field using operators
    const title = metadata.title || metadata.extractedTitle || '';
    const author = metadata.author || metadata.enhancedAuthor || '';
    const content = metadata.text || metadata.textSummary || '';
    const keywords = (metadata.keywords || []).join(' ');
    const language = metadata.language || '';
    const category = metadata.category || '';
    const fileType = metadata.fileType || '';
    
    // GPS SEARCH LOGIC: Check if GPS coordinates match
    let matchesGPSSearch = true;
      if (isGPSSearch && (metadata.fileType === 'jpg' || metadata.fileType === 'JPG')) {
        let locationData = null;
        try {
          // Try to parse location from JSON string (database format)
          if (metadata.location && typeof metadata.location === 'string') {
            locationData = JSON.parse(metadata.location);
          } else if (metadata.location && typeof metadata.location === 'object') {
            locationData = metadata.location;
          }
        } catch (e) {
          // If parsing fails, try direct access
          locationData = metadata.location;
        }
        
        if (locationData && (latitude || longitude)) {
          const fileLat = locationData.latitude || locationData.lat;
          const fileLon = locationData.longitude || locationData.lon;
          matchesGPSSearch = applyGPSSearchOperator(fileLat, fileLon, latitude, longitude, gpsOperator);
        } else {
          matchesGPSSearch = false; // No GPS data available
        }
      }
    
    // If no search query, match everything (for file type filtering only)
            const matchesSearch = !searchQuery || (typeof searchQuery === 'string' && searchQuery.trim() === '') || 
                         applySearchOperator(title, searchQuery, searchOperator) || 
                         applySearchOperator(author, searchQuery, searchOperator) || 
                         applySearchOperator(content, searchQuery, searchOperator) || 
                         applySearchOperator(keywords, searchQuery, searchOperator) || 
                         applySearchOperator(language, searchQuery, searchOperator) || 
                         applySearchOperator(category, searchQuery, searchOperator) || 
                         applySearchOperator(fileType, searchQuery, searchOperator);
    
    // FILTER LOGIC: Check file type, size and date filters
    const currentFileType = (metadata.fileType || '').toLowerCase();
    const requestedFileType = request.query.type;
    const matchesFileTypeFilter = !requestedFileType || currentFileType === requestedFileType.toLowerCase();
    
    // Debug logging for file type filtering
    if (requestedFileType) {
      console.log(`File: ${file}, Current: ${currentFileType}, Requested: ${requestedFileType}, Matches: ${matchesFileTypeFilter}`);
    }
    
    const fileSizeInKB = metadata.fileSizeBytes ? Math.round(metadata.fileSizeBytes / 1024) : 0;
    const matchesSizeFilter = fileSizeInKB >= minSize && fileSizeInKB <= maxSize;
    
    const matchesDateFilter = !minDate || !maxDate || (metadata.createdDate && metadata.createdDate >= minDate && metadata.createdDate <= maxDate);
    
    if (matchesSearch && matchesGPSSearch && matchesFileTypeFilter && matchesSizeFilter && matchesDateFilter) {
      // Calculate relevance score for this file
      const relevanceScore = calculateRelevanceScore(metadata, searchQuery, searchOperator);
      
      // Add matching file to search results with relevance score
      searchResults.push({ 
        file, 
        metadata: metadata, 
        relevanceScore: relevanceScore 
      });
    }
  }

  // Debug: Log final results count
  
  
  // SORT THE SEARCH RESULTS
  searchResults.sort((a, b) => {
    // If there's a search query, prioritize relevance score
    if (searchQuery && searchQuery.trim() !== '') {
      const aRelevance = a.relevanceScore || 0;
      const bRelevance = b.relevanceScore || 0;
      
      // Sort by relevance score (highest first)
      if (aRelevance !== bRelevance) {
        return bRelevance - aRelevance;
      }
    }
    
    // Fallback to existing sorting logic
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

// === FAVORITES API ENDPOINTS ===

// GET endpoint to retrieve user's favorites
app.get('/api/favorites', async (request, response) => {
  try {
    const userId = request.query.userId || 'default';
    
    // Hämta alla favoriter för användaren med filmetadata
    const favorites = await Favorites.findAll({
      where: { userId: userId },
      include: [{
        model: FileMetadata,
        attributes: ['id', 'filename', 'fileType', 'title', 'author', 'fileSize', 'createdAt']
      }],
      order: [['createdAt', 'DESC']] // Nyaste först
    });
    
    response.json(favorites);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    response.status(500).json({ error: 'Kunde inte hämta favoriter' });
  }
});

// POST endpoint to add a file to favorites
app.post('/api/favorites', async (request, response) => {
  try {
    const { filename, userId = 'default' } = request.body;
    
    if (!filename) {
      return response.status(400).json({ error: 'filename krävs' });
    }
    
    // Hitta filen baserat på filnamn
    const fileExists = await FileMetadata.findOne({
      where: { filename: filename }
    });
    
    if (!fileExists) {
      return response.status(404).json({ error: 'Filen hittades inte' });
    }
    
    // Skapa ny favorit med filens ID
    const favorite = await Favorites.create({
      fileId: fileExists.id,
      userId: userId,
      createdAt: new Date()
    });
    
    response.json({ success: true, favorite: favorite });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      response.status(409).json({ error: 'Filen är redan en favorit' });
    } else {
      console.error('Error adding favorite:', error);
      response.status(500).json({ error: 'Kunde inte lägga till favorit' });
    }
  }
});

// DELETE endpoint to remove a file from favorites
app.delete('/api/favorites/:filename', async (request, response) => {
  try {
    const { filename } = request.params;
    const userId = request.query.userId || 'default';
    
    // Hitta filen baserat på filnamn
    const file = await FileMetadata.findOne({
      where: { filename: filename }
    });
    
    if (!file) {
      return response.status(404).json({ error: 'Filen hittades inte' });
    }
    
    // Ta bort favoriten
    const deleted = await Favorites.destroy({
      where: {
        fileId: file.id,
        userId: userId
      }
    });
    
    if (deleted > 0) {
      response.json({ success: true, message: 'Favorit borttagen' });
    } else {
      response.status(404).json({ error: 'Favorit hittades inte' });
    }
  } catch (error) {
    console.error('Error removing favorite:', error);
    response.status(500).json({ error: 'Kunde inte ta bort favorit' });
  }
});

// Serve all files in the frontend folder
app.use(express.static('frontend'));

// Start the webserver on port 3000
app.listen(3000, async () => {
  console.log('Server listening on http://localhost:3000');
  
  // Synkronisera databasen med nya Favorites-tabellen
  try {
    await syncDatabase();
    console.log('✅ Databas synkroniserad med Favorites-tabellen!');
  } catch (error) {
    console.error('❌ Fel vid databassynkronisering:', error);
  }
});