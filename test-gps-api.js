// Test GPS functionality in new database API
async function testGPSAPI() {
  console.log('🧪 Testing GPS functionality in new database API...');
  
  try {
    // Test 1: Get yellow-leaves.jpg data
    console.log('\n📋 Test 1: yellow-leaves.jpg location data');
    const response1 = await fetch('http://localhost:3000/api/database-metadata');
    const data1 = await response1.json();
    
    const yellowLeaves = data1.find(item => item.file === 'yellow-leaves.jpg');
    if (yellowLeaves) {
      console.log('✅ Found yellow-leaves.jpg');
      console.log('📍 Location:', yellowLeaves.metadata.location);
    } else {
      console.log('❌ yellow-leaves.jpg not found');
    }
    
    // Test 2: GPS search near yellow-leaves coordinates
    console.log('\n📋 Test 2: GPS search near yellow-leaves coordinates');
    const lat = 42.035;
    const lon = -70.938;
    const gpsURL = `http://localhost:3000/api/database-metadata?gps=true&latitude=${lat}&longitude=${lon}&gpsOperator=within&distance=1000`;
    
    console.log('🔍 GPS Search URL:', gpsURL);
    const response2 = await fetch(gpsURL);
    const gpsResults = await response2.json();
    
    console.log(`📊 Found ${gpsResults.length} files near coordinates (${lat}, ${lon})`);
    
    if (gpsResults.length > 0) {
      console.log('\n📋 GPS search results:');
      gpsResults.forEach(item => {
        console.log(`- ${item.file}: ${item.metadata.location ? 
          `(${item.metadata.location.latitude}, ${item.metadata.location.longitude})` : 
          'No location'}`);
      });
    }
    
    // Test 3: Compare with old API
    console.log('\n📋 Test 3: Compare with old API');
    const oldResponse = await fetch('http://localhost:3000/api/search');
    const oldData = await oldResponse.json();
    
    const oldYellowLeaves = oldData.find(item => item.file === 'yellow-leaves.jpg');
    if (oldYellowLeaves) {
      console.log('📍 Old API location:', oldYellowLeaves.metadata.location);
      console.log('📍 New API location:', yellowLeaves?.metadata.location);
      
      if (JSON.stringify(oldYellowLeaves.metadata.location) === JSON.stringify(yellowLeaves?.metadata.location)) {
        console.log('✅ GPS data matches between old and new API!');
      } else {
        console.log('❌ GPS data mismatch between APIs');
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing GPS API:', error.message);
  }
}

testGPSAPI();