// Search functionality
let searchInput = document.getElementById('searchInput');
let searchResults = document.getElementById('searchResults');
let searchHistory = document.getElementById('searchHistory');
let mainContent = document.querySelector('main');

// Function to load and display search history
async function loadSearchHistory() {
  try {
    const response = await fetch('/api/search-history');
    const history = await response.json();
    
    if (history.length > 0) {
      searchHistory.innerHTML = '<h4>Tidigare sökningar:</h4>';
      history.forEach(term => {
        const historyItem = document.createElement('span');
        historyItem.className = 'search-history-item';
        historyItem.textContent = term;
        historyItem.onclick = () => {
          searchInput.value = term;
          performSearch(term);
        };
        searchHistory.appendChild(historyItem);
      });
      searchHistory.style.display = 'block';
    } else {
      searchHistory.style.display = 'none';
    }
  } catch (error) {
    console.error('Error loading search history:', error);
  }
}

// Function to perform search
async function performSearch(searchTerm) {
  if (searchTerm.trim() === '') {
    // If search is empty, show all PDFs
    searchResults.innerHTML = '';
    mainContent.style.display = 'block';
    return;
  }
  
  // Show loading animation
  searchResults.innerHTML = '<div class="search-loading"><div class="loading"></div>Söker...</div>';
  mainContent.style.display = 'none';
  
  try {
    // Call search API
    let response = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}`);
    let searchData = await response.json();
    
    // Hide main content and show search results
    mainContent.style.display = 'none';
    
    // Display search results
    if (searchData.length === 0) {
      searchResults.innerHTML = '<p>Inga PDF-filer hittades för "' + searchTerm + '"</p>';
    } else {
      searchResults.innerHTML = '<h3>Sökresultat för "' + searchTerm + '" (' + searchData.length + ' filer):</h3>';
      
      // Display each search result
      for (let pdf of searchData) {
        // create an article element (tag)
        let article = document.createElement('article');
        
        // Get enhanced PDF title (extracted title or original title or filename as fallback)
        let pdfTitle = pdf.metadata.extractedTitle || pdf.metadata.info.Title || pdf.file;
        
        // Format dates properly
        let createdDate = pdf.metadata.createdDate ? 
          new Date(pdf.metadata.createdDate).toLocaleString('sv-SE') : null;
        let modifiedDate = pdf.metadata.modifiedDate ? 
          new Date(pdf.metadata.modifiedDate).toLocaleString('sv-SE') : null;
        
        // Build table rows dynamically based on available data
        let tableRows = [];
        
        // Always show file information
        tableRows.push(`
          <tr>
            <td>File:</td>
            <td>${pdf.file}</td>
          </tr>
        `);
        
        // Show size if available
        if (pdf.metadata.fileSize) {
          tableRows.push(`
            <tr>
              <td>Size:</td>
              <td>${pdf.metadata.fileSize}</td>
            </tr>
          `);
        }
        
        // Show pages if available
        if (pdf.metadata.numpages) {
          tableRows.push(`
            <tr>
              <td>Pages:</td>
              <td>${pdf.metadata.numpages}</td>
            </tr>
          `);
        }
        
        // Show PDF version if available and not "Unknown"
        if (pdf.metadata.pdfVersion && pdf.metadata.pdfVersion !== 'Unknown') {
          tableRows.push(`
            <tr>
              <td>PDF Version:</td>
              <td>${pdf.metadata.pdfVersion}</td>
            </tr>
          `);
        }
        
        // Show enhanced author if available
        if (pdf.metadata.enhancedAuthor) {
          tableRows.push(`
            <tr>
              <td>Author:</td>
              <td>${pdf.metadata.enhancedAuthor}</td>
            </tr>
          `);
        }
        
        // Show creator if available and not empty
        if (pdf.metadata.info.Creator && pdf.metadata.info.Creator.trim() !== '') {
          tableRows.push(`
            <tr>
              <td>Creator:</td>
              <td>${pdf.metadata.info.Creator}</td>
            </tr>
          `);
        }
        
        // Show created date if available
        if (createdDate) {
          tableRows.push(`
            <tr>
              <td>Created:</td>
              <td>${createdDate}</td>
            </tr>
          `);
        }
        
        // Show modified date if available
        if (modifiedDate) {
          tableRows.push(`
            <tr>
              <td>Modified:</td>
              <td>${modifiedDate}</td>
            </tr>
          `);
        }
        
        // Show text summary if available (NEW FEATURE)
        if (pdf.metadata.textSummary && pdf.metadata.textSummary.trim() !== '') {
          tableRows.push(`
            <tr>
              <td>Summary:</td>
              <td>${pdf.metadata.textSummary}</td>
            </tr>
          `);
        }
        
        // add content to the article
        article.innerHTML = `
          <h3>📄 ${pdfTitle}</h3>
          <table>
            ${tableRows.join('')}
          </table>
          <div class="download-section">
            <a href="pdfs/${pdf.file}" class="download-link">📥 Download PDF</a>
          </div>
        `;
        // add the article to the search results
        searchResults.appendChild(article);
      }
    }
  } catch (error) {
    searchResults.innerHTML = '<p>Ett fel uppstod vid sökning</p>';
  }
}

// Add event listener for search input
searchInput.addEventListener('input', function() {
  performSearch(this.value);
});

// Load search history when page loads
loadSearchHistory();

// Read data from the API metadata
let metadataRaw = await fetch('/api/metadata');
// Convert from json to a js data structure
let metadata = await metadataRaw.json();

// loop through every PDF in metadata
for (let pdf of metadata) {
  // create an article element (tag)
  let article = document.createElement('article');
  
  // Get enhanced PDF title (extracted title or original title or filename as fallback)
  let pdfTitle = pdf.metadata.extractedTitle || pdf.metadata.info.Title || pdf.file;
  
  // Format dates properly
  let createdDate = pdf.metadata.createdDate ? 
    new Date(pdf.metadata.createdDate).toLocaleString('sv-SE') : null;
  let modifiedDate = pdf.metadata.modifiedDate ? 
    new Date(pdf.metadata.modifiedDate).toLocaleString('sv-SE') : null;
  
  // Build table rows dynamically based on available data
  let tableRows = [];
  
  // Always show file information
  tableRows.push(`
    <tr>
      <td>File:</td>
      <td>${pdf.file}</td>
    </tr>
  `);
  
  // Show size if available
  if (pdf.metadata.fileSize) {
    tableRows.push(`
      <tr>
        <td>Size:</td>
        <td>${pdf.metadata.fileSize}</td>
      </tr>
    `);
  }
  
  // Show pages if available
  if (pdf.metadata.numpages) {
    tableRows.push(`
      <tr>
        <td>Pages:</td>
        <td>${pdf.metadata.numpages}</td>
      </tr>
    `);
  }
  
  // Show PDF version if available and not "Unknown"
  if (pdf.metadata.pdfVersion && pdf.metadata.pdfVersion !== 'Unknown') {
    tableRows.push(`
      <tr>
        <td>PDF Version:</td>
        <td>${pdf.metadata.pdfVersion}</td>
      </tr>
    `);
  }
  
  // Show enhanced author if available
  if (pdf.metadata.enhancedAuthor) {
    tableRows.push(`
      <tr>
        <td>Author:</td>
        <td>${pdf.metadata.enhancedAuthor}</td>
      </tr>
    `);
  }
  
  // Show creator if available and not empty
  if (pdf.metadata.info.Creator && pdf.metadata.info.Creator.trim() !== '') {
    tableRows.push(`
      <tr>
        <td>Creator:</td>
        <td>${pdf.metadata.info.Creator}</td>
      </tr>
    `);
  }
  
  // Show created date if available
  if (createdDate) {
    tableRows.push(`
      <tr>
        <td>Created:</td>
        <td>${createdDate}</td>
      </tr>
    `);
  }
  
  // Show modified date if available
  if (modifiedDate) {
    tableRows.push(`
      <tr>
        <td>Modified:</td>
        <td>${modifiedDate}</td>
      </tr>
    `);
  }
  
  // Show text summary if available (NEW FEATURE)
  if (pdf.metadata.textSummary && pdf.metadata.textSummary.trim() !== '') {
    tableRows.push(`
      <tr>
        <td>Summary:</td>
        <td>${pdf.metadata.textSummary}</td>
      </tr>
    `);
  }
  
  // add content to the article
  article.innerHTML = `
    <h3>📄 ${pdfTitle}</h3>
    <table>
      ${tableRows.join('')}
    </table>
    <div class="download-section">
      <a href="pdfs/${pdf.file}" class="download-link">📥 Download PDF</a>
    </div>
  `;
  // add the article to the main element
  document.querySelector('main').append(article);
}