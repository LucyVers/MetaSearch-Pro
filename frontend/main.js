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
      searchResults.innerHTML = '<p>Inga filer hittades för "' + searchTerm + '"</p>';
    } else {
      searchResults.innerHTML = '<h3>Sökresultat för "' + searchTerm + '" (' + searchData.length + ' filer):</h3>';
      
      // Display each search result
      for (let item of searchData) {
        // create an article element (tag)
        let article = document.createElement('article');
        
        // Get title for any file type
        let fileTitle = item.metadata.title || item.metadata.extractedTitle || item.metadata.info?.Title || item.file;
        
        // Format dates properly
        let createdDate = item.metadata.createdDate ? 
          new Date(item.metadata.createdDate).toLocaleString('sv-SE') : null;
        let modifiedDate = item.metadata.modifiedDate ? 
          new Date(item.metadata.modifiedDate).toLocaleString('sv-SE') : null;
        
        // Build table rows dynamically based on available data
        let tableRows = [];
        
        // Always show file information
        tableRows.push(`
          <tr>
            <td>File:</td>
            <td>${item.file}</td>
          </tr>
        `);
        
        // Show size if available
        if (item.metadata.fileSize) {
          tableRows.push(`
            <tr>
              <td>Size:</td>
              <td>${item.metadata.fileSize}</td>
            </tr>
          `);
        }
        
        // Show pages if available (PDF only)
        if (item.metadata.numpages) {
          tableRows.push(`
            <tr>
              <td>Pages:</td>
              <td>${item.metadata.numpages}</td>
            </tr>
          `);
        }
        
        // Show PDF version if available and not "Unknown" (PDF only)
        if (item.metadata.pdfVersion && item.metadata.pdfVersion !== 'Unknown') {
          tableRows.push(`
            <tr>
              <td>PDF Version:</td>
              <td>${item.metadata.pdfVersion}</td>
            </tr>
          `);
        }
        
        // Show author if available
        if (item.metadata.author || item.metadata.enhancedAuthor) {
          tableRows.push(`
            <tr>
              <td>Author:</td>
              <td>${item.metadata.author || item.metadata.enhancedAuthor}</td>
            </tr>
          `);
        }
        
        // Show creator if available and not empty (PDF only)
        if (item.metadata.info?.Creator && item.metadata.info.Creator.trim() !== '') {
          tableRows.push(`
            <tr>
              <td>Creator:</td>
              <td>${item.metadata.info.Creator}</td>
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
        if (item.metadata.textSummary && item.metadata.textSummary.trim() !== '') {
          tableRows.push(`
            <tr>
              <td>Summary:</td>
              <td>${item.metadata.textSummary}</td>
            </tr>
          `);
        }

        // Show keywords if available (NEW FEATURE - STEP 2)
        if (item.metadata.keywords && item.metadata.keywords.length > 0) {
          const keywordTags = item.metadata.keywords.map(keyword => 
            `<span class="keyword-tag">${keyword}</span>`
          ).join(' ');
          tableRows.push(`
            <tr>
              <td>Keywords:</td>
              <td>${keywordTags}</td>
            </tr>
          `);
        }

        // Show language if available (NEW FEATURE - STEP 3)
        if (item.metadata.language && item.metadata.language !== 'Unknown') {
          tableRows.push(`
            <tr>
              <td>Language:</td>
              <td><span class="language-badge">${item.metadata.language}</span></td>
            </tr>
          `);
        }

        // Show category if available (NEW FEATURE - STEP 4)
        if (item.metadata.category && item.metadata.category !== 'Unknown') {
          tableRows.push(`
            <tr>
              <td>Category:</td>
              <td><span class="category-badge">${item.metadata.category}</span></td>
            </tr>
          `);
        }
        
        // Show MP3-specific fields
        if (item.metadata.fileType === 'MP3') {
          if (item.metadata.artist) {
            tableRows.push(`
              <tr>
                <td>Artist:</td>
                <td>${item.metadata.artist}</td>
              </tr>
            `);
          }
          if (item.metadata.album) {
            tableRows.push(`
              <tr>
                <td>Album:</td>
                <td>${item.metadata.album}</td>
              </tr>
            `);
          }
          if (item.metadata.duration) {
            tableRows.push(`
              <tr>
                <td>Duration:</td>
                <td>${item.metadata.duration} seconds</td>
              </tr>
            `);
          }
          if (item.metadata.genre) {
            tableRows.push(`
              <tr>
                <td>Genre:</td>
                <td>${item.metadata.genre}</td>
              </tr>
            `);
          }
        }
        
        // Show JPG-specific fields
        if (item.metadata.fileType === 'JPG') {
          if (item.metadata.dimensions) {
            tableRows.push(`
              <tr>
                <td>Dimensions:</td>
                <td>${item.metadata.dimensions}</td>
              </tr>
            `);
          }
          if (item.metadata.camera) {
            tableRows.push(`
              <tr>
                <td>Camera:</td>
                <td>${item.metadata.camera}</td>
              </tr>
            `);
          }
          if (item.metadata.createdDate) {
            tableRows.push(`
              <tr>
                <td>Photo Date:</td>
                <td>${new Date(item.metadata.createdDate).toLocaleString('sv-SE')}</td>
              </tr>
            `);
          }
          if (item.metadata.author) {
            tableRows.push(`
              <tr>
                <td>Photographer:</td>
                <td>${item.metadata.author}</td>
              </tr>
            `);
          }
          if (item.metadata.location) {
            tableRows.push(`
              <tr>
                <td>Location:</td>
                <td>${item.metadata.location.latitude.toFixed(6)}, ${item.metadata.location.longitude.toFixed(6)}</td>
              </tr>
            `);
          }
        }
        
        // add content to the article
        // Get file type icon
        let fileIcon = '📄'; // Default
        let downloadText = 'Download';
        let downloadPath = '';
        
        if (item.metadata.fileType === 'JPG') {
          fileIcon = '🖼️';
          downloadText = 'View Image';
          downloadPath = `jpgs/${item.file}`;
        } else if (item.metadata.fileType === 'MP3') {
          fileIcon = '🎵';
          downloadText = 'Play Audio';
          downloadPath = `mp3s/${item.file}`;
        } else {
          fileIcon = '📄';
          downloadText = 'Download PDF';
          downloadPath = `pdfs/${item.file}`;
        }
        
        article.innerHTML = `
          <h3>${fileIcon} ${fileTitle}</h3>
          <table>
            ${tableRows.join('')}
          </table>
          <div class="download-section">
            <a href="${downloadPath}" class="download-link">📥 ${downloadText}</a>
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

// Add event listener for search input with debounce
let searchTimeout;
searchInput.addEventListener('input', function() {
  clearTimeout(searchTimeout);
  
  // Show typing indicator
  if (this.value.trim() !== '') {
    searchResults.innerHTML = '<div class="search-loading"><div class="loading"></div>Skriver...</div>';
    mainContent.style.display = 'none';
  }
  
  searchTimeout = setTimeout(() => {
    performSearch(this.value);
  }, 1000); // Wait 1000ms (1 second) after user stops typing
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

  // Show keywords if available (NEW FEATURE - STEP 2)
  if (pdf.metadata.keywords && pdf.metadata.keywords.length > 0) {
    const keywordTags = pdf.metadata.keywords.map(keyword => 
      `<span class="keyword-tag">${keyword}</span>`
    ).join(' ');
    tableRows.push(`
      <tr>
        <td>Keywords:</td>
        <td>${keywordTags}</td>
      </tr>
    `);
  }

  // Show language if available (NEW FEATURE - STEP 3)
  if (pdf.metadata.language && pdf.metadata.language !== 'Unknown') {
    tableRows.push(`
      <tr>
        <td>Language:</td>
        <td><span class="language-badge">${pdf.metadata.language}</span></td>
      </tr>
    `);
  }

  // Show category if available (NEW FEATURE - STEP 4)
  if (pdf.metadata.category && pdf.metadata.category !== 'Unknown') {
    tableRows.push(`
      <tr>
        <td>Category:</td>
        <td><span class="category-badge">${pdf.metadata.category}</span></td>
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