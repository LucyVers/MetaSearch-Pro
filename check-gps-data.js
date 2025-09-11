import sequelize from './database.js';
import { testConnection } from './database.js';

async function checkGPSData() {
  console.log('🔍 Checking GPS data in database...');
  
  try {
    // Test connection first
    const connected = await testConnection();
    if (!connected) {
      console.log('❌ Could not connect to database');
      return;
    }

    // Check what tables exist first
    console.log('\n📋 Checking what tables exist:');
    const [tables] = await sequelize.query("SHOW TABLES");
    console.table(tables);
    
    if (tables.length === 0) {
      console.log('❌ No tables found in database!');
      return;
    }
    
    // Check if file_metadata table exists (the correct table name)
    const metadataExists = tables.some(table => 
      Object.values(table).includes('file_metadata')
    );
    
    if (!metadataExists) {
      console.log('❌ file_metadata table does not exist!');
      console.log('🔧 This explains why GPS data is null - database needs to be set up');
      return;
    }

    console.log('✅ Found file_metadata table!');

    // Check table structure
    console.log('\n📋 file_metadata table structure:');
    const [results] = await sequelize.query("DESCRIBE file_metadata");
    console.table(results);

    // Check for GPS columns specifically
    const gpsColumns = results.filter(col => 
      col.Field.includes('gps') || col.Field.includes('latitude') || col.Field.includes('longitude')
    );
    
    if (gpsColumns.length > 0) {
      console.log('\n🗺️ GPS-related columns found:');
      console.table(gpsColumns);
      
      // Sample GPS data
      console.log('\n📊 Sample GPS data:');
      const [gpsData] = await sequelize.query(`
        SELECT filename, gpsLatitude, gpsLongitude 
        FROM file_metadata 
        WHERE gpsLatitude IS NOT NULL 
        OR gpsLongitude IS NOT NULL 
        LIMIT 10
      `);
      
      if (gpsData.length > 0) {
        console.table(gpsData);
      } else {
        console.log('❌ No GPS data found in database!');
        
        // Check what data we actually have
        console.log('\n🔍 Checking what data exists:');
        const [allData] = await sequelize.query(`
          SELECT filename, gpsLatitude, gpsLongitude 
          FROM file_metadata 
          LIMIT 5
        `);
        console.table(allData);
      }
      
    } else {
      console.log('❌ No GPS columns found in database!');
    }

  } catch (error) {
    console.error('❌ Error checking GPS data:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkGPSData();