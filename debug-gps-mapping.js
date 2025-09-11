import sequelize from './database.js';
import { testConnection } from './database.js';
import { FileMetadata } from './models.js';

async function debugGPSMapping() {
  console.log('🔍 Debug GPS mapping from database...');
  
  try {
    // Test connection
    const connected = await testConnection();
    if (!connected) {
      console.log('❌ Could not connect to database');
      return;
    }

    // Get one file that should have GPS data (yellow-leaves.jpg)
    console.log('\n📊 Testing yellow-leaves.jpg specifically:');
    const yellowLeaves = await FileMetadata.findOne({
      where: { filename: 'yellow-leaves.jpg' }
    });
    
    if (yellowLeaves) {
      console.log('✅ Found yellow-leaves.jpg in database');
      
      // Convert to JSON to see raw data
      const rawData = yellowLeaves.toJSON();
      console.log('\n🔍 Raw database data:');
      console.log('gpsLatitude:', rawData.gpsLatitude, typeof rawData.gpsLatitude);
      console.log('gpsLongitude:', rawData.gpsLongitude, typeof rawData.gpsLongitude);
      
      // Test the mapping logic
      const location = rawData.gpsLatitude && rawData.gpsLongitude ? {
        latitude: parseFloat(rawData.gpsLatitude),
        longitude: parseFloat(rawData.gpsLongitude)
      } : null;
      
      console.log('\n🗺️ Mapped location object:');
      console.log(location);
      
      // Test API-style query for comparison
      console.log('\n📋 Testing API-style query:');
      const apiResult = await FileMetadata.findAll({
        where: { filename: 'yellow-leaves.jpg' }
      });
      
      if (apiResult.length > 0) {
        const apiData = apiResult[0].toJSON();
        console.log('API query result:');
        console.log('gpsLatitude:', apiData.gpsLatitude, typeof apiData.gpsLatitude);
        console.log('gpsLongitude:', apiData.gpsLongitude, typeof apiData.gpsLongitude);
      }
      
    } else {
      console.log('❌ yellow-leaves.jpg not found in database');
      
      // List available JPG files
      const jpgFiles = await FileMetadata.findAll({
        where: { fileType: 'jpg' },
        limit: 5
      });
      
      console.log(`\n📋 Found ${jpgFiles.length} JPG files:`);
      jpgFiles.forEach(file => {
        const data = file.toJSON();
        console.log(`- ${data.filename}: GPS(${data.gpsLatitude}, ${data.gpsLongitude})`);
      });
    }

  } catch (error) {
    console.error('❌ Error debugging GPS mapping:', error.message);
  } finally {
    await sequelize.close();
  }
}

debugGPSMapping();