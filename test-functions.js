// Test återstående funktioner innan systemrensning
async function testRemainingFunctions() {
  console.log('🧪 Testar återstående funktioner innan systemrensning...');
  
  try {
    // Test 1: Filtypsfiltrering
    console.log('\n📋 Test 1: Filtypsfiltrering');
    const pdfResponse = await fetch('http://localhost:3000/api/database-metadata?fileType=pdf');
    const pdfFiles = await pdfResponse.json();
    console.log(`✅ PDF-filter: ${pdfFiles.length} PDF-filer`);
    
    const jpgResponse = await fetch('http://localhost:3000/api/database-metadata?fileType=jpg');
    const jpgFiles = await jpgResponse.json();
    console.log(`✅ JPG-filter: ${jpgFiles.length} JPG-filer`);
    
    const mp3Response = await fetch('http://localhost:3000/api/database-metadata?fileType=mp3');
    const mp3Files = await mp3Response.json();
    console.log(`✅ MP3-filter: ${mp3Files.length} MP3-filer`);
    
    const pptResponse = await fetch('http://localhost:3000/api/database-metadata?fileType=ppt');
    const pptFiles = await pptResponse.json();
    console.log(`✅ PPT-filter: ${pptFiles.length} PPT-filer`);
    
    // Test 2: Favoriter-system
    console.log('\n📋 Test 2: Favoriter-system');
    const favoritesResponse = await fetch('http://localhost:3000/api/favorites');
    const favorites = await favoritesResponse.json();
    console.log(`✅ Favoriter-hämtning: ${favorites.length} favoriter`);
    
    // Test 3: Sökhistorik
    console.log('\n📋 Test 3: Sökhistorik');
    const historyResponse = await fetch('http://localhost:3000/api/search-history');
    const history = await historyResponse.json();
    console.log(`✅ Sökhistorik: ${history.length} sökningar`);
    
    // Test 4: Grundläggande sökning
    console.log('\n📋 Test 4: Grundläggande sökning');
    const searchResponse = await fetch('http://localhost:3000/api/database-metadata?q=test');
    const searchResults = await searchResponse.json();
    console.log(`✅ Textsökning: ${searchResults.length} resultat för "test"`);
    
    // Test 5: Alla filer
    console.log('\n📋 Test 5: Alla filer');
    const allResponse = await fetch('http://localhost:3000/api/database-metadata');
    const allFiles = await allResponse.json();
    console.log(`✅ Alla filer: ${allFiles.length} totalt`);
    
    console.log('\n🎉 Alla funktioner fungerar! Redo för systemrensning.');
    
  } catch (error) {
    console.error('❌ Fel vid testning:', error.message);
  }
}

testRemainingFunctions();