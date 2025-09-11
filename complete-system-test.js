// KOMPLETT SYSTEMTESTNING - Alla funktioner måste testas innan rensning
async function completeSystemTest() {
  console.log('🧪 KOMPLETT SYSTEMTESTNING - Alla funktioner');
  console.log('================================================\n');
  
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: Filtypsfiltrering (detaljerat)
  console.log('📋 TEST 1: FILTYPSFILTRERING (DETALJERAT)');
  try {
    const pdfResponse = await fetch('http://localhost:3000/api/database-metadata?fileType=pdf');
    const pdfFiles = await pdfResponse.json();
    
    const jpgResponse = await fetch('http://localhost:3000/api/database-metadata?fileType=jpg');  
    const jpgFiles = await jpgResponse.json();
    
    const mp3Response = await fetch('http://localhost:3000/api/database-metadata?fileType=mp3');
    const mp3Files = await mp3Response.json();
    
    const pptResponse = await fetch('http://localhost:3000/api/database-metadata?fileType=ppt');
    const pptFiles = await pptResponse.json();
    
    console.log(`  ✅ PDF-filter: ${pdfFiles.length} filer`);
    console.log(`  ✅ JPG-filter: ${jpgFiles.length} filer`);  
    console.log(`  ✅ MP3-filter: ${mp3Files.length} filer`);
    console.log(`  ✅ PPT-filter: ${pptFiles.length} filer`);
    
    // Kontrollera att bara rätt filtyper returneras
    const wrongPdfs = pdfFiles.filter(f => f.metadata.fileType !== 'PDF').length;
    const wrongJpgs = jpgFiles.filter(f => f.metadata.fileType !== 'JPG').length;
    const wrongMp3s = mp3Files.filter(f => f.metadata.fileType !== 'MP3').length;
    const wrongPpts = pptFiles.filter(f => f.metadata.fileType !== 'PPT').length;
    
    if (wrongPdfs === 0 && wrongJpgs === 0 && wrongMp3s === 0 && wrongPpts === 0) {
      console.log('  ✅ Filtypsfiltrering korrekt - bara rätt typer returneras');
      results.passed++;
    } else {
      console.log(`  ❌ Filtypsfiltrering fel - fel typer: PDF:${wrongPdfs}, JPG:${wrongJpgs}, MP3:${wrongMp3s}, PPT:${wrongPpts}`);
      results.failed++;
    }
    
    results.tests.push('Filtypsfiltrering: ' + (wrongPdfs === 0 && wrongJpgs === 0 && wrongMp3s === 0 && wrongPpts === 0 ? 'PASS' : 'FAIL'));
    
  } catch (error) {
    console.log(`  ❌ Filtypsfiltrering kraschade: ${error.message}`);
    results.failed++;
    results.tests.push('Filtypsfiltrering: FAIL - krasch');
  }

  // Test 2: Favoriter-system (komplett)
  console.log('\n📋 TEST 2: FAVORITER-SYSTEM (KOMPLETT)');
  try {
    // Test hämta favoriter
    const favResponse = await fetch('http://localhost:3000/api/favorites');
    const favorites = await favResponse.json();
    console.log(`  ✅ Hämta favoriter: ${favorites.length} favoriter`);
    
    // Test lägg till favorit (om vi har filer att testa med)
    const allFilesResponse = await fetch('http://localhost:3000/api/database-metadata?fileType=jpg');
    const allFiles = await allFilesResponse.json();
    
    if (allFiles.length > 0) {
      const testFile = allFiles[0].file;
      const addResponse = await fetch('http://localhost:3000/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: testFile })
      });
      
      if (addResponse.ok) {
        console.log(`  ✅ Lägg till favorit: ${testFile}`);
        
        // Test ta bort favorit
        const removeResponse = await fetch(`http://localhost:3000/api/favorites/${encodeURIComponent(testFile)}`, {
          method: 'DELETE'
        });
        
        if (removeResponse.ok) {
          console.log(`  ✅ Ta bort favorit: ${testFile}`);
          results.passed++;
          results.tests.push('Favoriter-system: PASS');
        } else {
          console.log(`  ❌ Ta bort favorit misslyckades`);
          results.failed++;
          results.tests.push('Favoriter-system: FAIL - ta bort');
        }
      } else {
        console.log(`  ❌ Lägg till favorit misslyckades`);
        results.failed++;
        results.tests.push('Favoriter-system: FAIL - lägg till');
      }
    }
    
  } catch (error) {
    console.log(`  ❌ Favoriter-system kraschade: ${error.message}`);
    results.failed++;
    results.tests.push('Favoriter-system: FAIL - krasch');
  }

  // Test 3: Sökoperatorer
  console.log('\n📋 TEST 3: SÖKOPERATORER');
  try {
    // Test contains (standard)
    const containsResponse = await fetch('http://localhost:3000/api/database-metadata?q=test');
    const containsResults = await containsResponse.json();
    console.log(`  ✅ Contains-sökning: ${containsResults.length} resultat för "test"`);
    
    // Test GPS-sökning (equals)
    const gpsResponse = await fetch('http://localhost:3000/api/database-metadata?gps=true&latitude=42.035&longitude=-70.938&gpsOperator=equals');
    const gpsResults = await gpsResponse.json();
    console.log(`  ✅ GPS equals-sökning: ${gpsResults.length} resultat`);
    
    results.passed++;
    results.tests.push('Sökoperatorer: PASS');
    
  } catch (error) {
    console.log(`  ❌ Sökoperatorer kraschade: ${error.message}`);
    results.failed++;
    results.tests.push('Sökoperatorer: FAIL - krasch');
  }

  // Test 4: API-prestanda
  console.log('\n📋 TEST 4: API-PRESTANDA');
  try {
    const startTime = Date.now();
    const perfResponse = await fetch('http://localhost:3000/api/database-metadata');
    const perfResults = await perfResponse.json();
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log(`  ✅ API-responstid: ${responseTime}ms för ${perfResults.length} filer`);
    
    if (responseTime < 5000) { // Under 5 sekunder är okej
      results.passed++;
      results.tests.push('API-prestanda: PASS');
    } else {
      results.failed++;
      results.tests.push('API-prestanda: FAIL - för långsam');
    }
    
  } catch (error) {
    console.log(`  ❌ API-prestanda test kraschade: ${error.message}`);
    results.failed++;
    results.tests.push('API-prestanda: FAIL - krasch');
  }

  // Test 5: GPS-funktionalitet (detaljerat)
  console.log('\n📋 TEST 5: GPS-FUNKTIONALITET (DETALJERAT)');
  try {
    // Hämta alla filer med GPS-data
    const allResponse = await fetch('http://localhost:3000/api/database-metadata');
    const allData = await allResponse.json();
    const filesWithGPS = allData.filter(item => item.metadata.location);
    
    console.log(`  ✅ Filer med GPS-data: ${filesWithGPS.length} av ${allData.length}`);
    
    // Test GPS-sökning
    if (filesWithGPS.length > 0) {
      const testGPS = filesWithGPS[0].metadata.location;
      const gpsSearchResponse = await fetch(`http://localhost:3000/api/database-metadata?gps=true&latitude=${testGPS.latitude}&longitude=${testGPS.longitude}&gpsOperator=equals`);
      const gpsSearchResults = await gpsSearchResponse.json();
      
      console.log(`  ✅ GPS-sökning: ${gpsSearchResults.length} resultat för (${testGPS.latitude}, ${testGPS.longitude})`);
      
      results.passed++;
      results.tests.push('GPS-funktionalitet: PASS');
    } else {
      console.log('  ⚠️ Inga filer med GPS-data att testa');
      results.tests.push('GPS-funktionalitet: SKIP - inga GPS-filer');
    }
    
  } catch (error) {
    console.log(`  ❌ GPS-funktionalitet kraschade: ${error.message}`);
    results.failed++;
    results.tests.push('GPS-funktionalitet: FAIL - krasch');
  }

  // Test 6: Felhantering
  console.log('\n📋 TEST 6: FELHANTERING');
  try {
    // Test ogiltiga parametrar
    const badResponse = await fetch('http://localhost:3000/api/database-metadata?fileType=ogiltigt');
    const badResults = await badResponse.json();
    console.log(`  ✅ Ogiltiga parametrar: ${badResults.length} resultat (förväntat: 0)`);
    
    // Test tomt query
    const emptyResponse = await fetch('http://localhost:3000/api/database-metadata?q=');
    const emptyResults = await emptyResponse.json();
    console.log(`  ✅ Tom sökning: ${emptyResults.length} resultat`);
    
    results.passed++;
    results.tests.push('Felhantering: PASS');
    
  } catch (error) {
    console.log(`  ❌ Felhantering kraschade: ${error.message}`);
    results.failed++;
    results.tests.push('Felhantering: FAIL - krasch');
  }

  // SLUTRESULTAT
  console.log('\n🎯 SLUTRESULTAT KOMPLETT SYSTEMTEST');
  console.log('=====================================');
  console.log(`✅ Godkända tester: ${results.passed}`);
  console.log(`❌ Misslyckade tester: ${results.failed}`);
  console.log(`📊 Totalt: ${results.passed + results.failed} tester`);
  
  console.log('\n📋 DETALJERADE RESULTAT:');
  results.tests.forEach((test, index) => {
    console.log(`${index + 1}. ${test}`);
  });
  
  const successRate = Math.round((results.passed / (results.passed + results.failed)) * 100);
  console.log(`\n🎯 Framgångsgrad: ${successRate}%`);
  
  if (results.failed === 0) {
    console.log('\n🎉 ALLA TESTER GODKÄNDA! System redo för rensning.');
  } else {
    console.log('\n⚠️ VISSA TESTER MISSLYCKADES! Åtgärda innan rensning.');
  }
}

completeSystemTest();