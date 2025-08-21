// Import the file system module
import fs from 'fs';
// Import pdf-parse-fork that lets me extract metadata from PDF files
import pdfParse from 'pdf-parse-fork';
// Import express - that will help me create a web server
import express from 'express';
// Import Fuse.js for fuzzy matching
import Fuse from 'fuse.js';

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
      textSummary: textSummary // Add the new text summary
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
      textSummary: textSummary // Add the new text summary
    };
    
                    // FUZZY SEARCH LOGIC: Use Fuse.js for better matching
                const searchData = [
                  { title: extractedTitle, author: enhancedAuthor || '', content: data.text || '' }
                ];
                
                const fuseOptions = {
                  keys: ['title', 'author', 'content'],
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