// Search functionality
let searchInput = document.getElementById('searchInput');
let fileTypeFilter = document.getElementById('fileTypeFilter');
let searchOperator = document.getElementById('searchOperator');
let gpsSearchControls = document.getElementById('gpsSearchControls');
let latitudeInput = document.getElementById('latitudeInput');
let longitudeInput = document.getElementById('longitudeInput');
let gpsOperator = document.getElementById('gpsOperator');
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

// SOLID: Single Responsibility - Audio player creation
function createAudioPlayer(audioPath, metadata) {
  const audioId = `audio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  let audioMetadata = '';
  if (metadata.duration) {
    const minutes = Math.floor(metadata.duration / 60);
    const seconds = metadata.duration % 60;
    audioMetadata += `Duration: ${minutes}:${seconds.toString().padStart(2, '0')} | `;
  }
  if (metadata.artist) audioMetadata += `Artist: ${metadata.artist} | `;
  if (metadata.album) audioMetadata += `Album: ${metadata.album}`;
  
  return `
    <div class="audio-player-container">
      <div class="audio-info">
        <span class="preview-label">🎵 Audio Preview (30s)</span>
        ${audioMetadata ? `<div class="audio-metadata">${audioMetadata}</div>` : ''}
      </div>
      <audio id="${audioId}" controls preload="metadata" class="custom-audio-player">
        <source src="${audioPath}" type="audio/mpeg">
        Your browser does not support the audio element.
      </audio>
    </div>
  `;
}

// SOLID: Single Responsibility - Handle 30-second preview limitation
function handlePreviewLimitation(audioElement) {
  if (!audioElement) return;
  
  audioElement.addEventListener('loadedmetadata', function() {
    // Ensure we start from beginning
    this.currentTime = 0;
  });
  
  audioElement.addEventListener('timeupdate', function() {
    // Stop at 30 seconds
    if (this.currentTime >= 30) {
      this.pause();
      this.currentTime = 0;
    }
  });
  
  audioElement.addEventListener('play', function() {
    // Always start from beginning for preview
    if (this.currentTime >= 30) {
      this.currentTime = 0;
    }
  });
}

// SOLID: Single Responsibility - Add audio event listeners  
function addAudioEventListeners(articleElement) {
  const audioPlayer = articleElement.querySelector('.custom-audio-player');
  if (audioPlayer) {
    handlePreviewLimitation(audioPlayer);
  }
}

// Function to perform search
async function performSearch(searchTerm) {
  // Get selected file type filter and search operator
  const selectedFileType = fileTypeFilter.value;
  const selectedOperator = searchOperator.value;
  
  // If no search term and no file type filter, show all files
  if (searchTerm.trim() === '' && selectedFileType === 'all') {
    searchResults.innerHTML = '';
    mainContent.style.display = 'block';
    return;
  }
  
  // Show loading animation for any search/filter operation
  searchResults.innerHTML = '<div class="search-loading"><div class="loading"></div>Söker...</div>';
  mainContent.style.display = 'none';
  

  
  try {
    // Call search API with file type filter and search operator
    let url = `/api/search?q=${encodeURIComponent(searchTerm)}`;
    if (selectedFileType !== 'all') {
      url += `&type=${selectedFileType}`;
    }
    if (selectedOperator !== 'contains') {
      url += `&operator=${selectedOperator}`;
    }
    let response = await fetch(url);
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
        
        // Show PPT-specific fields
        if (item.metadata.fileType === 'PPT') {
          if (item.metadata.slides) {
            tableRows.push(`
              <tr>
                <td>Slides:</td>
                <td>${item.metadata.slides}</td>
              </tr>
            `);
          }
          if (item.metadata.wordCount) {
            tableRows.push(`
              <tr>
                <td>Words:</td>
                <td>${item.metadata.wordCount}</td>
              </tr>
            `);
          }
          if (item.metadata.company) {
            tableRows.push(`
              <tr>
                <td>Company:</td>
                <td>${item.metadata.company}</td>
              </tr>
            `);
          }
          if (item.metadata.revisionNumber) {
            tableRows.push(`
              <tr>
                <td>Revision:</td>
                <td>${item.metadata.revisionNumber}</td>
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
        } else if (item.metadata.fileType === 'PPT') {
          fileIcon = '📊';
          downloadText = 'Download PPT';
          downloadPath = `ppts/${item.file}`;
        } else {
          fileIcon = '📄';
          downloadText = 'Download PDF';
          downloadPath = `pdfs/${item.file}`;
        }
        
        // SOLID: Interface Segregation - Different interfaces for different file types
        let downloadSection;
        if (item.metadata.fileType === 'MP3') {
          downloadSection = createAudioPlayer(downloadPath, item.metadata);
        } else {
          downloadSection = `
            <div class="download-section">
              <a href="${downloadPath}" class="download-link">📥 ${downloadText}</a>
            </div>
          `;
        }
        
        article.innerHTML = `
          <h3>${fileIcon} ${fileTitle}</h3>
          <table>
            ${tableRows.join('')}
          </table>
          ${downloadSection}
        `;
        // add the article to the search results
        searchResults.appendChild(article);
        
        // SOLID: Dependency Inversion - Use abstracted audio handling
        if (item.metadata.fileType === 'MP3') {
          addAudioEventListeners(article);
        }
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

// Function to perform GPS search
async function performGPSSearch() {
  
  const latitude = latitudeInput.value;
  const longitude = longitudeInput.value;
  const selectedGpsOperator = gpsOperator.value;
  
  
  
  // If no GPS coordinates provided, perform regular search
  if (!latitude && !longitude) {
    
    performSearch(searchInput.value);
    return;
  }
  
  // Show loading animation
  searchResults.innerHTML = '<div class="search-loading"><div class="loading"></div>Söker GPS-koordinater...</div>';
  mainContent.style.display = 'none';
  
  try {
    // Call GPS search API
    let url = `/api/search?type=jpg&gps=true`;
    if (latitude) url += `&latitude=${latitude}`;
    if (longitude) url += `&longitude=${longitude}`;
    if (selectedGpsOperator) url += `&gpsOperator=${selectedGpsOperator}`;
    
    let response = await fetch(url);
    let searchData = await response.json();
    
    // Display GPS search results
    if (searchData.length === 0) {
      searchResults.innerHTML = '<p>Inga JPG-filer hittades för de angivna GPS-koordinaterna</p>';
    } else {
      searchResults.innerHTML = `<h3>GPS-sökresultat (${searchData.length} JPG-filer):</h3>`;
      
      // Display each GPS search result
      for (let item of searchData) {
        // Create article element for GPS search result
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
        
        // Show GPS location if available
        if (item.metadata.location) {
          tableRows.push(`
            <tr>
              <td>Location:</td>
              <td>${item.metadata.location.latitude.toFixed(6)}, ${item.metadata.location.longitude.toFixed(6)}</td>
            </tr>
          `);
        }
        
        // Show other metadata fields
        if (item.metadata.author) {
          tableRows.push(`
            <tr>
              <td>Author:</td>
              <td>${item.metadata.author}</td>
            </tr>
          `);
        }
        
        if (createdDate) {
          tableRows.push(`
            <tr>
              <td>Created:</td>
              <td>${createdDate}</td>
            </tr>
          `);
        }
        
        if (modifiedDate) {
          tableRows.push(`
            <tr>
              <td>Modified:</td>
              <td>${modifiedDate}</td>
            </tr>
          `);
        }
        
        // Get file type icon and download info
        let fileIcon = '🖼️'; // Default for JPG
        let downloadText = 'View Image';
        let downloadPath = `jpgs/${item.file}`;
        
        // Add content to the article
        article.innerHTML = `
          <h3>${fileIcon} ${fileTitle}</h3>
          <table>
            ${tableRows.join('')}
          </table>
          <div class="download-section">
            <a href="${downloadPath}" class="download-link">📥 ${downloadText}</a>
          </div>
        `;
        
        // Add the article to the search results
        searchResults.appendChild(article);
      }
    }
  } catch (error) {
    console.error('Error performing GPS search:', error);
    searchResults.innerHTML = '<p>Fel vid GPS-sökning</p>';
  }
}

// Add event listener for search operator
searchOperator.addEventListener('change', function() {
  // Always perform search when operator changes, even if search term is empty
  performSearch(searchInput.value);
});

// Add event listener for file type filter to show/hide GPS search and perform search
fileTypeFilter.addEventListener('change', function() {
  const selectedFileType = fileTypeFilter.value;
  
  // Show GPS search controls only for JPG files
  if (selectedFileType === 'jpg') {
    gpsSearchControls.style.display = 'flex';
    
    // Always perform regular search first when JPG is selected
    performSearch(searchInput.value);
  } else {
    gpsSearchControls.style.display = 'none';
    performSearch(searchInput.value);
  }
});

// Add event listeners for GPS inputs
latitudeInput.addEventListener('input', function() {
  console.log('Latitude input changed:', this.value);
  if (fileTypeFilter.value === 'jpg' && (this.value || longitudeInput.value)) {
    
    performGPSSearch();
  }
});

longitudeInput.addEventListener('input', function() {
  console.log('Longitude input changed:', this.value);
  if (fileTypeFilter.value === 'jpg' && (this.value || latitudeInput.value)) {
    
    performGPSSearch();
  }
});

gpsOperator.addEventListener('change', function() {
  console.log('GPS operator changed:', this.value);
  if (fileTypeFilter.value === 'jpg' && (latitudeInput.value || longitudeInput.value)) {
    
    performGPSSearch();
  }
});

// Load search history when page loads
loadSearchHistory();

// Read data from the API metadata
let metadataRaw = await fetch('/api/metadata');
// Convert from json to a js data structure
let metadata = await metadataRaw.json();

// loop through every file in metadata (PDF, JPG, MP3, PPT)
for (let item of metadata) {
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
  
  // Show PDF version if available and not "Unknown"
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
  
  // Show text summary if available (PDF only)
  if (item.metadata.textSummary && item.metadata.textSummary.trim() !== '') {
    tableRows.push(`
      <tr>
        <td>Summary:</td>
        <td>${item.metadata.textSummary}</td>
      </tr>
    `);
  }

  // Show keywords if available
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

  // Show language if available
  if (item.metadata.language && item.metadata.language !== 'Unknown') {
    tableRows.push(`
      <tr>
        <td>Language:</td>
        <td><span class="language-badge">${item.metadata.language}</span></td>
      </tr>
    `);
  }

  // Show category if available
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
  
  // Show PPT-specific fields
  if (item.metadata.fileType === 'PPT') {
    if (item.metadata.slides) {
      tableRows.push(`
        <tr>
          <td>Slides:</td>
          <td>${item.metadata.slides}</td>
        </tr>
      `);
    }
    if (item.metadata.wordCount) {
      tableRows.push(`
        <tr>
          <td>Words:</td>
          <td>${item.metadata.wordCount}</td>
        </tr>
      `);
    }
    if (item.metadata.company) {
      tableRows.push(`
        <tr>
          <td>Company:</td>
          <td>${item.metadata.company}</td>
        </tr>
      `);
    }
    if (item.metadata.revisionNumber) {
      tableRows.push(`
        <tr>
          <td>Revision:</td>
          <td>${item.metadata.revisionNumber}</td>
        </tr>
      `);
    }
  }
  
  // Get file type icon and download info
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
  } else if (item.metadata.fileType === 'PPT') {
    fileIcon = '📊';
    downloadText = 'Download PPT';
    downloadPath = `ppts/${item.file}`;
  } else {
    fileIcon = '📄';
    downloadText = 'Download PDF';
    downloadPath = `pdfs/${item.file}`;
  }
  
  // SOLID: Interface Segregation - Different interfaces for different file types  
  let downloadSection;
  if (item.metadata.fileType === 'MP3') {
    downloadSection = createAudioPlayer(downloadPath, item.metadata);
  } else {
    downloadSection = `
      <div class="download-section">
        <a href="${downloadPath}" class="download-link">📥 ${downloadText}</a>
      </div>
    `;
  }
  
  // add content to the article
  article.innerHTML = `
    <h3>${fileIcon} ${fileTitle}</h3>
    <table>
      ${tableRows.join('')}
    </table>
    ${downloadSection}
  `;
  // add the article to the main element
  document.querySelector('main').append(article);
  
  // SOLID: Dependency Inversion - Use abstracted audio handling
  if (item.metadata.fileType === 'MP3') {
    addAudioEventListeners(article);
  }
}