// Convert CSV to JSON for PowerPoint metadata
import fs from 'fs';

// Read the CSV file with proper encoding
const csvContent = fs.readFileSync('./data/_lcwa_gov_powerpoint_metadata.csv', 'latin1');
const lines = csvContent.split('\n');

// Parse header - clean up the encoding issues
const headerLine = lines[0];
const headers = headerLine.split('\t').map(h => h.replace(/\x00/g, '').trim());

console.log('Headers found:', headers);

// Parse data rows
const results = [];

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  const values = line.split('\t').map(v => v.replace(/\x00/g, '').trim());
  
  // Create object with headers
  const row = {};
  headers.forEach((header, index) => {
    row[header] = values[index] || '';
  });
  
  // Clean up the data
  const cleanData = {
    digest: row.digest || '',
    title: row.title ? row.title.trim() : 'Unknown Title',
    company: row.company ? row.company.trim() : 'Unknown Company',
    creation_date: row.creation_date || '',
    last_modified: row.last_modified || '',
    revision_number: row.revision_number || '',
    slide_count: parseInt(row.slide_count) || 0,
    word_count: parseInt(row.word_count) || 0,
    file_size: parseInt(row.file_size) || 0,
    urlkey: row.urlkey || '',
    mimetype: row.mimetype || ''
  };
  
  results.push(cleanData);
}

console.log(`Converted ${results.length} PowerPoint records to JSON`);

// Save to JSON file
fs.writeFileSync('./data/ppt-metadata.json', JSON.stringify(results, null, 2));
console.log('JSON file saved as: data/ppt-metadata.json');

// Show first few records
console.log('\nFirst 3 records:');
results.slice(0, 3).forEach((record, index) => {
  console.log(`\n${index + 1}. ${record.title}`);
  console.log(`   Company: ${record.company}`);
  console.log(`   Slides: ${record.slide_count}`);
  console.log(`   File: ${record.digest}.ppt`);
});
