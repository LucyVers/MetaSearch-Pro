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