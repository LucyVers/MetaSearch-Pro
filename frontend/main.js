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

// Favoriter-funktionalitet
let favoritesSection = null;
let userFavorites = new Set(); // Sparar favorit-fil-ID:n i minnet

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

// === FAVORITER FUNKTIONALITET ===

// SOLID: Single Responsibility - Ladda användarens favoriter
async function loadUserFavorites() {
  try {
    const response = await fetch('/api/favorites');
    const favorites = await response.json();
    
    // Uppdatera lokalt minne
    userFavorites.clear();
    favorites.forEach(fav => {
      userFavorites.add(fav.FileMetadata.filename);
    });
    
    // Uppdatera favoriter-sektionen
    displayFavorites();
  } catch (error) {
    console.error('Error loading favorites:', error);
  }
}

// SOLID: Single Responsibility - Skapa favoriter-knapp
function createFavoriteButton(filename, isFavorite = false) {
  const heartIcon = isFavorite ? '❤️' : '🤍';
  const buttonClass = isFavorite ? 'favorite-button active' : 'favorite-button';
  const title = isFavorite ? 'Ta bort från favoriter' : 'Lägg till i favoriter';
  
  return `
    <button class="${buttonClass}" 
            data-filename="${filename}" 
            title="${title}">
      ${heartIcon}
    </button>
  `;
}

// SOLID: Single Responsibility - Växla favorit-status
async function toggleFavorite(filename) {
  try {
    const isFavorite = userFavorites.has(filename);
    
    if (isFavorite) {
      // Ta bort från favoriter
      const response = await fetch(`/api/favorites/${encodeURIComponent(filename)}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        userFavorites.delete(filename);
        updateFavoriteButton(filename, false);
        displayFavorites(); // Uppdatera favoriter-sektionen
      }
    } else {
      // Lägg till i favoriter
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ filename: filename })
      });
      
      if (response.ok) {
        userFavorites.add(filename);
        updateFavoriteButton(filename, true);
        displayFavorites(); // Uppdatera favoriter-sektionen
      }
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
  }
}

// SOLID: Single Responsibility - Lägg till event listeners för favoriter-knappar
function addFavoriteEventListeners(articleElement) {
  const favoriteButton = articleElement.querySelector('.favorite-button');
  if (favoriteButton) {
    favoriteButton.addEventListener('click', function() {
      const filename = this.getAttribute('data-filename');
      toggleFavorite(filename);
    });
  }
}

// SOLID: Single Responsibility - Uppdatera favoriter-knapp
function updateFavoriteButton(filename, isFavorite) {
  const button = document.querySelector(`[data-filename="${filename}"]`);
  if (button) {
    const heartIcon = isFavorite ? '❤️' : '🤍';
    const buttonClass = isFavorite ? 'favorite-button active' : 'favorite-button';
    const title = isFavorite ? 'Ta bort från favoriter' : 'Lägg till i favoriter';
    
    button.innerHTML = heartIcon;
    button.className = buttonClass;
    button.title = title;
  }
}

// SOLID: Single Responsibility - Visa favoriter-sektion
function displayFavorites() {
  if (!favoritesSection) {
    // Skapa favoriter-sektion om den inte finns
    favoritesSection = document.createElement('section');
    favoritesSection.className = 'favorites-section';
    favoritesSection.innerHTML = '<h3>❤️ Mina Favoriter</h3>';
    
    // Lägg till efter sökresultaten
    const searchContainer = document.querySelector('.search-container');
    if (searchContainer) {
      searchContainer.appendChild(favoritesSection);
    }
  }
  
  // Hämta favoriter från API
  fetch('/api/favorites')
    .then(response => response.json())
    .then(favorites => {
      if (favorites.length === 0) {
        favoritesSection.innerHTML = '<h3>❤️ Mina Favoriter</h3><p>Inga favoriter än. Klicka på hjärtat bredvid en fil för att lägga till den.</p>';
        return;
      }
      
      let favoritesHTML = '<h3>❤️ Mina Favoriter</h3><div class="favorites-grid">';
      
      favorites.forEach(fav => {
        const file = fav.FileMetadata;
        favoritesHTML += `
          <div class="favorite-item">
            <div class="favorite-header">
              <span class="favorite-icon">❤️</span>
              <span class="favorite-title">${file.title || file.filename}</span>
              <button class="remove-favorite" data-filename="${file.filename}" title="Ta bort från favoriter">❌</button>
            </div>
            <div class="favorite-details">
              <span class="file-type">${file.fileType}</span>
              <span class="file-size">${file.fileSize}</span>
              <span class="file-date">${file.createdAt ? new Date(file.createdAt).toLocaleDateString('sv-SE') : 'Okänd'}</span>
            </div>
          </div>
        `;
      });
      
      favoritesHTML += '</div>';
      favoritesSection.innerHTML = favoritesHTML;
      
      // Lägg till event listeners för ta bort-knapparna
      const removeButtons = favoritesSection.querySelectorAll('.remove-favorite');
      removeButtons.forEach(button => {
        button.addEventListener('click', function() {
          const filename = this.getAttribute('data-filename');
          toggleFavorite(filename);
        });
      });
    })
    .catch(error => {
      console.error('Error displaying favorites:', error);
    });
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

// === PDF PREVIEW FUNCTIONALITY ===

// SOLID: Single Responsibility - PDF rendering logic
async function renderPDFThumbnail(pdfPath, canvasId) {
  try {
    // Set PDF.js worker path
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    
    // Load PDF document
    const pdf = await pdfjsLib.getDocument(pdfPath).promise;
    
    // Get first page
    const page = await pdf.getPage(1);
    
    // Get canvas and context
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    
    // Calculate scale for thumbnail (max 200px width)
    const viewport = page.getViewport({ scale: 1 });
    const scale = Math.min(200 / viewport.width, 150 / viewport.height);
    const scaledViewport = page.getViewport({ scale });
    
    // Set canvas dimensions
    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;
    
    // Render page
    const renderContext = {
      canvasContext: ctx,
      viewport: scaledViewport
    };
    
    await page.render(renderContext).promise;
    
    // Clean up PDF resources
    pdf.destroy();
    
    return true;
  } catch (error) {
    console.error('PDF rendering failed:', error);
    return false;
  }
}

// SOLID: Single Responsibility - Create PDF preview HTML
function createPDFPreview(pdfPath, metadata) {
  const uniqueId = `pdf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const canvasId = `canvas-${uniqueId}`;
  
  // Determine appropriate title for the PDF
  let pdfTitle = 'PDF Preview';
  if (metadata.title || metadata.extractedTitle) {
    const title = metadata.title || metadata.extractedTitle;
    // If title looks like a Word document, show it as converted PDF
    if (title.toLowerCase().includes('.doc')) {
      pdfTitle = `Converted PDF (from ${title.split('\\').pop().split('/').pop()})`;
    } else {
      pdfTitle = `PDF: ${title}`;
    }
  }
  
  return `
    <div class="pdf-preview-container">
      <div class="pdf-info">
        <h4>📄 ${pdfTitle}</h4>
        <div class="pdf-metadata">
          ${metadata.numpages ? `<span class="metadata-item">📑 ${metadata.numpages} sidor</span>` : ''}
          ${metadata.fileSize ? `<span class="metadata-item">📏 ${metadata.fileSize}</span>` : ''}
          ${metadata.pdfVersion && metadata.pdfVersion !== 'Unknown' ? `<span class="metadata-item">📋 PDF ${metadata.pdfVersion}</span>` : ''}
        </div>
      </div>
      <div class="pdf-thumbnail">
        <canvas id="${canvasId}" class="pdf-canvas"></canvas>
        <div class="pdf-loading" id="loading-${uniqueId}">
          <div class="loading-spinner"></div>
          <span>Laddar förhandsvisning...</span>
        </div>
      </div>
      <div class="pdf-actions">
        <button class="open-pdf-viewer" data-pdf-path="${pdfPath}" data-metadata='${JSON.stringify(metadata).replace(/'/g, "&apos;")}'>
          📖 Öppna PDF Viewer
        </button>
        <a href="${pdfPath}" class="download-pdf-link" download>📥 Ladda ner PDF</a>
      </div>
    </div>
  `;
}

// SOLID: Open/Closed - PDF viewer can be extended with more features
function openPDFViewer(pdfPath, metadata) {
  const viewerId = `pdf-viewer-${Date.now()}`;
  const canvasId = `viewer-canvas-${viewerId}`;
  
  const overlay = document.createElement('div');
  overlay.className = 'pdf-viewer-overlay';
  overlay.innerHTML = `
    <div class="pdf-viewer-container">
      <div class="pdf-viewer-header">
        <h3>📄 ${metadata.title || metadata.extractedTitle || 'PDF Document'}</h3>
        <div class="pdf-viewer-controls">
          <div class="pdf-page-navigation">
            <button class="pdf-prev-page" title="Föregående sida" disabled>◀</button>
            <span class="pdf-page-info">Sida 1 av --</span>
            <button class="pdf-next-page" title="Nästa sida" disabled>▶</button>
          </div>
          <div class="pdf-zoom-controls">
            <button class="pdf-zoom-out" title="Zoom ut">🔍-</button>
            <span class="pdf-zoom-level">100%</span>
            <button class="pdf-zoom-in" title="Zoom in">🔍+</button>
          </div>
          <button class="pdf-viewer-close" aria-label="Stäng PDF viewer">&times;</button>
        </div>
      </div>
      <div class="pdf-viewer-content">
        <canvas id="${canvasId}" class="pdf-viewer-canvas"></canvas>
        <div class="pdf-viewer-loading" id="viewer-loading-${viewerId}">
          <div class="loading-spinner"></div>
          <span>Laddar PDF...</span>
        </div>
      </div>
      <div class="pdf-viewer-footer">
        <div class="pdf-info-row">
          ${metadata.numpages ? `<span>📑 ${metadata.numpages} sidor</span>` : ''}
          ${metadata.fileSize ? `<span>📏 ${metadata.fileSize}</span>` : ''}
          ${metadata.author || metadata.enhancedAuthor ? `<span>👤 ${metadata.author || metadata.enhancedAuthor}</span>` : ''}
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  // Setup event listeners (which will handle the initial PDF loading)
  setupPDFViewerEventListeners(overlay, pdfPath, canvasId, viewerId);
}

// SOLID: Interface Segregation - Separate event handling
function setupPDFViewerEventListeners(overlay, pdfPath, canvasId, viewerId) {
  let currentZoom = 1;
  let currentPage = 1;
  let totalPages = 1;
  let pdfDocument = null;
  
  // Close viewer
  const closeBtn = overlay.querySelector('.pdf-viewer-close');
  closeBtn.addEventListener('click', () => closePDFViewer(overlay));
  
  // Close on ESC key and cleanup event listeners
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      closePDFViewer(overlay);
      document.removeEventListener('keydown', escHandler);
      document.removeEventListener('keydown', keyHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
  
  // Close on overlay click (but not content)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closePDFViewer(overlay);
    }
  });
  
  // Zoom controls
  const zoomIn = overlay.querySelector('.pdf-zoom-in');
  const zoomOut = overlay.querySelector('.pdf-zoom-out');
  const zoomLevel = overlay.querySelector('.pdf-zoom-level');
  
  zoomIn.addEventListener('click', () => {
    currentZoom = Math.min(currentZoom + 0.25, 3);
    zoomLevel.textContent = Math.round(currentZoom * 100) + '%';
    renderPDFPageInViewer(pdfDocument, currentPage, canvasId, viewerId, currentZoom);
  });
  
  zoomOut.addEventListener('click', () => {
    currentZoom = Math.max(currentZoom - 0.25, 0.5);
    zoomLevel.textContent = Math.round(currentZoom * 100) + '%';
    renderPDFPageInViewer(pdfDocument, currentPage, canvasId, viewerId, currentZoom);
  });
  
  // Page navigation controls
  const prevPageBtn = overlay.querySelector('.pdf-prev-page');
  const nextPageBtn = overlay.querySelector('.pdf-next-page');
  const pageInfo = overlay.querySelector('.pdf-page-info');
  
  // Function to update page navigation state
  function updatePageNavigation() {
    prevPageBtn.disabled = currentPage <= 1;
    nextPageBtn.disabled = currentPage >= totalPages;
    pageInfo.textContent = `Sida ${currentPage} av ${totalPages}`;
  }
  
  prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      renderPDFPageInViewer(pdfDocument, currentPage, canvasId, viewerId, currentZoom);
      updatePageNavigation();
    }
  });
  
  nextPageBtn.addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderPDFPageInViewer(pdfDocument, currentPage, canvasId, viewerId, currentZoom);
      updatePageNavigation();
    }
  });
  
  // Keyboard navigation (arrow keys)
  const keyHandler = (e) => {
    if (e.key === 'ArrowLeft' && currentPage > 1) {
      currentPage--;
      renderPDFPageInViewer(pdfDocument, currentPage, canvasId, viewerId, currentZoom);
      updatePageNavigation();
    } else if (e.key === 'ArrowRight' && currentPage < totalPages) {
      currentPage++;
      renderPDFPageInViewer(pdfDocument, currentPage, canvasId, viewerId, currentZoom);
      updatePageNavigation();
    }
  };
  document.addEventListener('keydown', keyHandler);
  
  // Load PDF document and setup pages
  pdfjsLib.getDocument(pdfPath).promise.then(pdf => {
    pdfDocument = pdf;
    totalPages = pdf.numPages;
    updatePageNavigation();
    renderPDFPageInViewer(pdfDocument, currentPage, canvasId, viewerId, currentZoom);
  }).catch(error => {
    console.error('Error loading PDF:', error);
    const loadingElement = document.getElementById(`viewer-loading-${viewerId}`);
    if (loadingElement) {
      loadingElement.innerHTML = '<span style="color: red;">❌ Kunde inte ladda PDF</span>';
    }
  });
  

}

// SOLID: Single Responsibility - PDF page rendering
async function renderPDFPageInViewer(pdfDocument, pageNumber, canvasId, viewerId, zoom = 1) {
  const canvas = document.getElementById(canvasId);
  const context = canvas.getContext('2d');
  const loadingElement = document.getElementById(`viewer-loading-${viewerId}`);
  
  if (!pdfDocument || !canvas) return;
  
  try {
    if (loadingElement) loadingElement.style.display = 'flex';
    
    const page = await pdfDocument.getPage(pageNumber);
    const viewport = page.getViewport({ scale: zoom });
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };
    
    await page.render(renderContext).promise;
    
    if (loadingElement) loadingElement.style.display = 'none';
  } catch (error) {
    console.error('Error rendering PDF page:', error);
    console.error('Page number:', pageNumber, 'Document:', pdfDocument);
    if (loadingElement) {
      loadingElement.style.display = 'flex';
      loadingElement.innerHTML = '<span style="color: red;">❌ Kunde inte rendera sidan</span>';
      
      // Hide error after 2 seconds and try again
      setTimeout(() => {
        if (loadingElement) {
          loadingElement.style.display = 'none';
        }
      }, 2000);
    }
  }
}

// SOLID: Single Responsibility - Initial PDF viewer setup
async function renderPDFInViewer(pdfPath, canvasId, viewerId, zoom = 1) {
  try {
    const loadingElement = document.getElementById(`viewer-loading-${viewerId}`);
    if (loadingElement) loadingElement.style.display = 'flex';
    
    // Load PDF document
    const pdf = await pdfjsLib.getDocument(pdfPath).promise;
    
    // Get first page
    const page = await pdf.getPage(1);
    
    // Get canvas and context
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    
    // Calculate viewport with zoom
    const viewport = page.getViewport({ scale: zoom });
    
    // Set canvas dimensions
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    // Render page
    const renderContext = {
      canvasContext: ctx,
      viewport: viewport
    };
    
    await page.render(renderContext).promise;
    
    // Hide loading
    if (loadingElement) loadingElement.style.display = 'none';
    
    // Clean up PDF resources
    pdf.destroy();
    
  } catch (error) {
    console.error('PDF viewer rendering failed:', error);
    const loadingElement = document.getElementById(`viewer-loading-${viewerId}`);
    if (loadingElement) {
      loadingElement.innerHTML = '<span style="color: red;">❌ Kunde inte ladda PDF</span>';
    }
  }
}

// SOLID: Dependency Inversion - Clean resource management
function closePDFViewer(overlay) {
  // Add fade out animation
  overlay.style.animation = 'lightboxFadeOut 0.3s ease';
  setTimeout(() => {
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
  }, 300);
}

// SOLID: Interface Segregation - PDF event listeners
function addPDFEventListeners(articleElement) {
  const pdfButtons = articleElement.querySelectorAll('.open-pdf-viewer');
  
  pdfButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('PDF Viewer button clicked!'); // Debug log
      console.log('pdfjsLib available:', typeof pdfjsLib !== 'undefined'); // Debug log
      
      // Check if PDF.js is loaded
      if (typeof pdfjsLib === 'undefined') {
        console.error('PDF.js library is not loaded!');
        console.error('Available global objects:', Object.keys(window).filter(key => key.toLowerCase().includes('pdf')));
        alert('PDF viewer inte tillgänglig. Ladda om sidan och försök igen.');
        return;
      }
      
      const pdfPath = button.dataset.pdfPath;
      console.log('Raw metadata string:', button.dataset.metadata); // Debug log
      
      let metadata;
      try {
        // Unescape HTML entities before parsing
        const unescapedMetadata = button.dataset.metadata.replace(/&apos;/g, "'");
        metadata = JSON.parse(unescapedMetadata);
      } catch (error) {
        console.error('JSON parse error:', error);
        console.error('Problematic JSON string:', button.dataset.metadata);
        alert('Fel vid laddning av PDF metadata. Försök igen.');
        return;
      }
      
      console.log('Opening PDF:', pdfPath, metadata); // Debug log
      openPDFViewer(pdfPath, metadata);
    });
  });
  
  // Guard: ensure no stray extracted text/content is rendered inside the preview
  // Some PDFs include very large extracted text in metadata on certain records.
  // Strictly keep only the expected blocks and remove any text nodes or unknown elements.
  const containers = articleElement.querySelectorAll('.pdf-preview-container');
  containers.forEach(container => {
    const allowed = new Set(['pdf-info', 'pdf-thumbnail', 'pdf-actions']);
    Array.from(container.childNodes).forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        node.remove();
        return;
      }
      if (node.nodeType === Node.ELEMENT_NODE) {
        const firstClass = node.classList && node.classList[0];
        if (!firstClass || !allowed.has(firstClass)) {
          node.remove();
        }
      }
    });
  });

  // Extra cleanup: Remove any large text nodes anywhere in the article for PDF files
  // This handles cases where extracted PDF text leaks outside the container
  const walker = document.createTreeWalker(
    articleElement,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        // Skip text inside our allowed PDF elements
        const parent = node.parentElement;
        if (parent && (
          parent.classList.contains('pdf-info') ||
          parent.classList.contains('pdf-actions') ||
          parent.tagName === 'H3' ||
          parent.tagName === 'TD' ||
          parent.tagName === 'TH' ||
          parent.tagName === 'BUTTON'
        )) {
          return NodeFilter.FILTER_REJECT;
        }
        
        // Remove very large text nodes (likely leaked PDF content)
        if (node.textContent.trim().length > 50) {
          return NodeFilter.FILTER_ACCEPT;
        }
        
        return NodeFilter.FILTER_REJECT;
      }
    }
  );
  
  const textNodesToRemove = [];
  let node;
  while (node = walker.nextNode()) {
    textNodesToRemove.push(node);
  }
  
  textNodesToRemove.forEach(node => {
    if (node.parentNode) {
      node.parentNode.removeChild(node);
    }
  });

  // Render thumbnails after a short delay to avoid blocking UI
  setTimeout(() => {
    const canvases = articleElement.querySelectorAll('.pdf-canvas');
    canvases.forEach(canvas => {
      const container = canvas.closest('.pdf-preview-container');
      const button = container.querySelector('.open-pdf-viewer');
      const pdfPath = button.dataset.pdfPath;
      const loadingElement = container.querySelector('.pdf-loading');
      
      renderPDFThumbnail(pdfPath, canvas.id).then(success => {
        if (loadingElement) {
          loadingElement.style.display = success ? 'none' : 'flex';
          if (!success) {
            loadingElement.innerHTML = '<span style="color: red;">❌ Förhandsvisning misslyckades</span>';
          }
        }
      });
    });
  }, 100);
}

// SOLID: Single Responsibility - Image gallery creation
function createImageGallery(imagePath, metadata, allImages, currentIndex) {
  console.log('createImageGallery called:', { imagePath, metadata, allImagesCount: allImages?.length, currentIndex });
  
  // Fallback if allImages is undefined or empty
  if (!allImages || allImages.length === 0) {
    allImages = [{ file: imagePath.split('/').pop(), metadata: metadata }];
    currentIndex = 0;
  }
  
  const galleryId = `gallery-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  let imageMetadata = '';
  if (metadata.dimensions) imageMetadata += `Dimensions: ${metadata.dimensions} | `;
  if (metadata.camera) imageMetadata += `Camera: ${metadata.camera} | `;
  if (metadata.createdDate) {
    const photoDate = new Date(metadata.createdDate).toLocaleDateString('sv-SE');
    imageMetadata += `Photo Date: ${photoDate}`;
  }
  
  return `
    <div class="image-gallery-container">
      <div class="image-info">
        <span class="gallery-label">🖼️ Image Gallery</span>
        ${imageMetadata ? `<div class="image-metadata">${imageMetadata}</div>` : ''}
      </div>
      <div class="image-preview">
        <img src="${imagePath}" alt="${metadata.title || metadata.filename}" class="gallery-thumbnail" loading="lazy">
        <button class="open-lightbox-btn" data-gallery-id="${galleryId}" data-image-index="${currentIndex}">
          📸 Open in Gallery
        </button>
      </div>
    </div>
  `;
}

// SOLID: Single Responsibility - Handle lightbox functionality
function handleLightboxEvents(articleElement, allImages, currentIndex) {
  const openBtn = articleElement.querySelector('.open-lightbox-btn');
  if (openBtn) {
    openBtn.addEventListener('click', function() {
      openLightbox(allImages, currentIndex);
    });
  }
}

// SOLID: Single Responsibility - Open lightbox with navigation
function openLightbox(allImages, startIndex) {
  // Create lightbox overlay
  const lightbox = document.createElement('div');
  lightbox.className = 'lightbox-overlay';
  lightbox.innerHTML = `
    <div class="lightbox-container">
      <button class="lightbox-close" aria-label="Close gallery">&times;</button>
      <button class="lightbox-prev" aria-label="Previous image">&#8249;</button>
      <button class="lightbox-next" aria-label="Next image">&#8250;</button>
      <div class="lightbox-counter">
        <span class="current-image">1</span> / <span class="total-images">${allImages.length}</span>
      </div>
      <div class="lightbox-content">
        <img class="lightbox-image" src="" alt="" loading="lazy">
        <div class="lightbox-metadata">
          <div class="metadata-content"></div>
          <button class="metadata-toggle">Show Details</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(lightbox);
  document.body.style.overflow = 'hidden'; // Prevent background scrolling
  
  let currentImageIndex = startIndex;
  
  // Load current image
  loadLightboxImage(lightbox, allImages, currentImageIndex);
  
  // Event listeners
  setupLightboxEventListeners(lightbox, allImages, currentImageIndex);
}

// SOLID: Single Responsibility - Load image in lightbox
function loadLightboxImage(lightbox, allImages, index) {
  const image = lightbox.querySelector('.lightbox-image');
  const metadataContent = lightbox.querySelector('.metadata-content');
  const currentSpan = lightbox.querySelector('.current-image');
  
  const currentImage = allImages[index];
  const imagePath = `jpgs/${currentImage.file}`;
  
  // Update image
  image.src = imagePath;
  image.alt = currentImage.metadata.title || currentImage.metadata.filename;
  
  // Update counter
  currentSpan.textContent = index + 1;
  
  // Update metadata
  let metadataHTML = `<h3>${currentImage.metadata.filename}</h3>`;
  if (currentImage.metadata.dimensions) metadataHTML += `<p><strong>Dimensions:</strong> <span class="metadata-value">${currentImage.metadata.dimensions}</span></p>`;
  if (currentImage.metadata.camera) metadataHTML += `<p><strong>Camera:</strong> <span class="metadata-value">${currentImage.metadata.camera}</span></p>`;
  if (currentImage.metadata.fileSize) metadataHTML += `<p><strong>File Size:</strong> <span class="metadata-value">${currentImage.metadata.fileSize}</span></p>`;
  if (currentImage.metadata.createdDate) {
    const photoDate = new Date(currentImage.metadata.createdDate).toLocaleString('sv-SE');
    metadataHTML += `<p><strong>Photo Date:</strong> <span class="metadata-value">${photoDate}</span></p>`;
  }
  if (currentImage.metadata.location) {
    metadataHTML += `<p><strong>GPS Location:</strong> <span class="metadata-value">${currentImage.metadata.location.latitude.toFixed(6)}, ${currentImage.metadata.location.longitude.toFixed(6)}</span></p>`;
  }
  
  metadataContent.innerHTML = metadataHTML;
}

// SOLID: Single Responsibility - Setup lightbox event listeners
function setupLightboxEventListeners(lightbox, allImages, startIndex) {
  let currentIndex = startIndex;
  
  // Close lightbox
  const closeBtn = lightbox.querySelector('.lightbox-close');
  closeBtn.addEventListener('click', closeLightbox);
  
  // Click outside to close
  lightbox.addEventListener('click', function(e) {
    if (e.target === lightbox) closeLightbox();
  });
  
  // Previous/Next navigation
  const prevBtn = lightbox.querySelector('.lightbox-prev');
  const nextBtn = lightbox.querySelector('.lightbox-next');
  
  prevBtn.addEventListener('click', function() {
    currentIndex = (currentIndex - 1 + allImages.length) % allImages.length;
    loadLightboxImage(lightbox, allImages, currentIndex);
  });
  
  nextBtn.addEventListener('click', function() {
    currentIndex = (currentIndex + 1) % allImages.length;
    loadLightboxImage(lightbox, allImages, currentIndex);
  });
  
  // Metadata toggle
  const metadataToggle = lightbox.querySelector('.metadata-toggle');
  const metadataContent = lightbox.querySelector('.metadata-content');
  
  metadataToggle.addEventListener('click', function() {
    metadataContent.classList.toggle('visible');
    metadataToggle.textContent = metadataContent.classList.contains('visible') ? 'Hide Details' : 'Show Details';
  });
  
  // Keyboard navigation
  function handleKeyboard(e) {
    switch(e.key) {
      case 'Escape':
        closeLightbox();
        break;
      case 'ArrowLeft':
        prevBtn.click();
        break;
      case 'ArrowRight':
        nextBtn.click();
        break;
    }
  }
  
  document.addEventListener('keydown', handleKeyboard);
  
  // Store cleanup function
  lightbox.cleanup = function() {
    document.removeEventListener('keydown', handleKeyboard);
  };
}

// SOLID: Single Responsibility - Close lightbox
function closeLightbox() {
  const lightbox = document.querySelector('.lightbox-overlay');
  if (lightbox) {
    if (lightbox.cleanup) lightbox.cleanup();
    document.body.style.overflow = ''; // Restore scrolling
    lightbox.remove();
  }
}

// Helper function to clear search results while preserving favorites section
function clearSearchResultsPreservingFavorites() {
  const favoritesSectionElement = document.querySelector('.favorites-section');
  if (favoritesSectionElement) {
    // Remove favorites temporarily to preserve it
    const favoritesParent = favoritesSectionElement.parentNode;
    favoritesParent.removeChild(favoritesSectionElement);
    
    // Clear search results
    searchResults.innerHTML = '';
    
    // Add favorites back
    searchResults.appendChild(favoritesSectionElement);
  } else {
    // No favorites section exists, safe to clear everything
    searchResults.innerHTML = '';
  }
}

// Function to perform search
async function performSearch(searchTerm) {
  // Get selected file type filter and search operator
  const selectedFileType = fileTypeFilter.value;
  const selectedOperator = searchOperator.value;
  
  // If no search term and no file type filter, show all files
  if (searchTerm.trim() === '' && selectedFileType === 'all') {
    clearSearchResultsPreservingFavorites();
    mainContent.style.display = 'block';
    return;
  }
  
  // Show loading animation for any search/filter operation - preserve favorites
  clearSearchResultsPreservingFavorites();
  searchResults.innerHTML += '<div class="search-loading"><div class="loading"></div>Söker...</div>';
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
    
    // Display search results - preserve favorites
    if (searchData.length === 0) {
      clearSearchResultsPreservingFavorites();
      searchResults.innerHTML += '<p>Inga filer hittades för "' + searchTerm + '"</p>';
    } else {
      // Anpassa rubriken baserat på om det är sökning eller filtrering
      let headerText;
      if (searchTerm.trim() === '') {
        // Om ingen sökterm, visa bara filtyp
        const fileTypeName = selectedFileType === 'all' ? 'filer' : 
                           selectedFileType === 'ppt' ? 'PowerPoint-filer' :
                           selectedFileType === 'pdf' ? 'PDF-filer' :
                           selectedFileType === 'jpg' ? 'bilder' :
                           selectedFileType === 'mp3' ? 'ljudfiler' : 'filer';
        headerText = `<h3>Visar ${searchData.length} ${fileTypeName}</h3>`;
      } else {
        // Om sökning, visa sökresultat
        headerText = `<h3>Sökresultat för "${searchTerm}" (${searchData.length} filer)</h3>`;
      }
      clearSearchResultsPreservingFavorites();
      searchResults.innerHTML += headerText;
      
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
        
        // FOR PDF FILES: Block the massive 'text' field that causes display issues
        // Certain PDFs contain enormous extracted text content that leaks into the layout
        if ((item.metadata.fileType === 'PDF' || item.file.toLowerCase().endsWith('.pdf')) && item.metadata.text) {
          // Completely remove the problematic text field for clean PDF display
          delete item.metadata.text;
        }
        
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
        
        // Don't show textSummary for PDFs in search results to avoid hiding preview
        // Text summary available in PDF viewer if needed

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
        } else if (item.metadata.fileType === 'JPG') {
          // Get all JPG images for gallery navigation from the search results
          const allImages = searchData.filter(img => img.metadata.fileType === 'JPG');
          const currentIndex = allImages.findIndex(img => img.file === item.file);
          console.log('JPG Gallery Debug:', { allImages: allImages.length, currentIndex, filename: item.file });
          downloadSection = createImageGallery(downloadPath, item.metadata, allImages, currentIndex);
        } else if (item.metadata.fileType === 'PDF' || item.file.toLowerCase().endsWith('.pdf')) {
          downloadSection = createPDFPreview(downloadPath, item.metadata);
        } else {
          downloadSection = `
            <div class="download-section">
              <a href="${downloadPath}" class="download-link">📥 ${downloadText}</a>
            </div>
          `;
        }
        
        // Skapa favoriter-knapp - använd filnamnet som identifierare
        const favoriteButton = createFavoriteButton(item.file, userFavorites.has(item.file));
        
        article.innerHTML = `
          <div class="file-header">
            <h3>${fileIcon} ${fileTitle}</h3>
            ${favoriteButton}
          </div>
          <table>
            ${tableRows.join('')}
          </table>
          ${downloadSection}
        `;
        // add the article to the search results
        searchResults.appendChild(article);
        
        // SOLID: Dependency Inversion - Use abstracted media handling
        if (item.metadata.fileType === 'MP3') {
          addAudioEventListeners(article);
        } else if (item.metadata.fileType === 'JPG') {
          const allImages = searchData.filter(img => img.metadata.fileType === 'JPG');
          const currentIndex = allImages.findIndex(img => img.file === item.file);
          handleLightboxEvents(article, allImages, currentIndex);
        } else if (item.metadata.fileType === 'PDF' || (!item.metadata.fileType && item.file.toLowerCase().endsWith('.pdf'))) {
          addPDFEventListeners(article);
        }
        
        // Lägg till event listeners för favoriter-knapp
        addFavoriteEventListeners(article);
      }
    }
  } catch (error) {
    console.error('Search error:', error);
    searchResults.innerHTML = `<p>Ett fel uppstod vid sökning: ${error.message}</p>`;
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
        
        // FOR PDF FILES: Block the massive 'text' field that causes display issues
        // Certain PDFs contain enormous extracted text content that leaks into the layout
        if ((item.metadata.fileType === 'PDF' || item.file.toLowerCase().endsWith('.pdf')) && item.metadata.text) {
          // Completely remove the problematic text field for clean PDF display
          delete item.metadata.text;
        }
        
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

// Add event listener for favorites navigation link
document.getElementById('favoritesNavLink').addEventListener('click', function(e) {
  e.preventDefault(); // Prevent default link behavior
  
  const favoritesSection = document.querySelector('.favorites-section');
  if (favoritesSection) {
    // Scroll to favorites section smoothly
    favoritesSection.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
  } else {
    // If no favorites exist yet, show message
    alert('Inga favoriter ännu. Klicka på hjärtat bredvid filer för att lägga till dem som favoriter!');
  }
});

// Load search history when page loads
loadSearchHistory();
loadUserFavorites(); // Ladda användarens favoriter

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
  
  // Don't show textSummary for PDFs in main display to avoid hiding preview
  // Text summary available in PDF viewer if needed

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
  } else if (item.metadata.fileType === 'JPG') {
    // Get all JPG images for gallery navigation  
    const allImages = metadata.filter(img => img.metadata.fileType === 'JPG');
    const currentIndex = allImages.findIndex(img => img.file === item.file);
    console.log('Main JPG Gallery Debug:', { allImages: allImages.length, currentIndex, filename: item.file });
    downloadSection = createImageGallery(downloadPath, item.metadata, allImages, currentIndex);
  } else if (item.metadata.fileType === 'PDF' || item.file.toLowerCase().endsWith('.pdf')) {
    downloadSection = createPDFPreview(downloadPath, item.metadata);
  } else {
    downloadSection = `
      <div class="download-section">
        <a href="${downloadPath}" class="download-link">📥 ${downloadText}</a>
      </div>
    `;
  }
  
  // Skapa favoriter-knapp - använd filnamnet som identifierare
  const favoriteButton = createFavoriteButton(item.file, userFavorites.has(item.file));
  
  // add content to the article
  article.innerHTML = `
    <div class="file-header">
      <h3>${fileIcon} ${fileTitle}</h3>
      ${favoriteButton}
    </div>
    <table>
      ${tableRows.join('')}
    </table>
    ${downloadSection}
  `;
  // add the article to the main element
  document.querySelector('main').append(article);
  
  // SOLID: Dependency Inversion - Use abstracted media handling
  if (item.metadata.fileType === 'MP3') {
    addAudioEventListeners(article);
  } else if (item.metadata.fileType === 'JPG') {
    const allImages = metadata.filter(img => img.metadata.fileType === 'JPG');
    const currentIndex = allImages.findIndex(img => img.file === item.file);
    handleLightboxEvents(article, allImages, currentIndex);
  } else if (item.metadata.fileType === 'PDF' || (!item.metadata.fileType && item.file.toLowerCase().endsWith('.pdf'))) {
    addPDFEventListeners(article);
  }
  
  // Lägg till event listeners för favoriter-knapp
  addFavoriteEventListeners(article);
}