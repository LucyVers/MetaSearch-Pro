// Import the file system module
import fs from 'fs';
// Import pdf-parse-fork that lets me extract metadata from PDF files
import pdfParse from 'pdf-parse-fork';
// Import express - that will help me create a web server
import express from 'express';

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
    
    // Create enhanced metadata with all new fields
    let enhancedMetadata = {
      ...data,
      extractedTitle: extractedTitle,
      enhancedAuthor: enhancedAuthor,
      fileSize: formattedFileSize,
      fileSizeBytes: fileSizeInBytes,
      pdfVersion: pdfVersion,
      createdDate: createdDate,
      modifiedDate: modifiedDate
    };
    
    // Add the filename and the enhanced metadata to our meta data list
    metadataList.push({ file, metadata: enhancedMetadata });
  }

  // Send the meta data as a response to the request
  // (to our web browser)
  response.json(metadataList);

});

// Serve all files in the frontend folder
app.use(express.static('frontend'));

// Start the webserver on port 3000
app.listen(3000, () => {
  console.log('Server listening on http://localhost:3000');
});