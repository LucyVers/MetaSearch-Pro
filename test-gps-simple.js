// Simple GPS test
async function simpleGPSTest() {
  console.log('🧪 Simple GPS test...');
  
  try {
    // Test GPS search with equals operator using yellow-leaves exact coordinates  
    const lat = 42.03503833333333;
    const lon = -70.93802;
    const gpsURL = `http://localhost:3000/api/database-metadata?gps=true&latitude=${lat}&longitude=${lon}&gpsOperator=equals`;
    
    console.log('🔍 GPS Search URL:', gpsURL);
    const response = await fetch(gpsURL);
    const results = await response.json();
    
    console.log(`📊 Found ${results.length} files with exact coordinates (${lat}, ${lon})`);
    
    if (results.length > 0) {
      results.forEach(item => {
        console.log(`✅ ${item.file}: (${item.metadata.location.latitude}, ${item.metadata.location.longitude})`);
      });
    } else {
      console.log('❌ No files found with GPS search');
      
      // Debug: Get all files and check their GPS data
      console.log('\n🔍 Debug: All files with location data:');
      const allResponse = await fetch('http://localhost:3000/api/database-metadata');
      const allData = await allResponse.json();
      
      const filesWithGPS = allData.filter(item => item.metadata.location);
      console.log(`Found ${filesWithGPS.length} files with GPS data:`);
      filesWithGPS.slice(0, 5).forEach(item => {
        console.log(`- ${item.file}: (${item.metadata.location.latitude}, ${item.metadata.location.longitude})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

simpleGPSTest();