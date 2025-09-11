import sequelize from './database.js';
import { testConnection } from './database.js';
import { FileMetadata } from './models.js';
import ExifParser from 'exif-parser';
import fs from 'fs';

async function updateGPSData() {
  console.log('🔍 Updating GPS data for existing files...');
  
  try {
    // Test connection
    const connected = await testConnection();
    if (!connected) {
      console.log('❌ Could not connect to database');
      return;
    }

    // Get all JPG files that have NULL GPS data
    const jpgFiles = await FileMetadata.findAll({
      where: {
        fileType: 'jpg',
        gpsLatitude: null
      }
    });
    
    console.log(`📋 Found ${jpgFiles.length} JPG files without GPS data`);
    
    if (jpgFiles.length === 0) {
      console.log('✅ No files need GPS updates');
      return;
    }

    let updated = 0;
    let errors = 0;

    for (const file of jpgFiles) {
      try {
        const filePath = file.filepath;
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
          console.log(`⚠️ File not found: ${filePath}`);
          continue;
        }
        
        // Read EXIF data
        const imageBuffer = fs.readFileSync(filePath);
        const exifData = ExifParser.create(imageBuffer).parse();
        
        // Extract GPS coordinates
        if (exifData.tags && exifData.tags.GPSLatitude && exifData.tags.GPSLongitude) {
          const latitude = exifData.tags.GPSLatitude;
          const longitude = exifData.tags.GPSLongitude;
          
          // Update database record
          await file.update({
            gpsLatitude: latitude,
            gpsLongitude: longitude
          });
          
          console.log(`✅ Updated GPS for ${file.filename}: (${latitude}, ${longitude})`);
          updated++;
          
        } else {
          console.log(`ℹ️ No GPS data in ${file.filename}`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing ${file.filename}:`, error.message);
        errors++;
      }
    }
    
    console.log(`\n📊 Update summary:`);
    console.log(`- Files updated: ${updated}`);
    console.log(`- Errors: ${errors}`);
    console.log(`- Total processed: ${jpgFiles.length}`);

  } catch (error) {
    console.error('❌ Error updating GPS data:', error.message);
  } finally {
    await sequelize.close();
  }
}

updateGPSData();