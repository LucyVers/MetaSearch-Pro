import { DataTypes } from 'sequelize';
import sequelize from './database.js';

// Gemensam modell för alla filtyper
const FileMetadata = sequelize.define('FileMetadata', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  filename: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  filepath: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  fileType: {
    type: DataTypes.ENUM('pdf', 'jpg', 'mp3', 'ppt'),
    allowNull: false
  },
  fileSize: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  author: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  creationDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  modificationDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  keywords: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  language: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  
  // PDF-specifika fält
  pdfVersion: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  pageCount: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  
  // JPG-specifika fält
  dimensions: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  camera: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  photoDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  photographer: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  location: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  gpsLatitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true
  },
  gpsLongitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true
  },
  
  // MP3-specifika fält
  artist: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  album: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  duration: {
    type: DataTypes.INTEGER, // i sekunder
    allowNull: true
  },
  genre: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  
  // PPT-specifika fält
  slideCount: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  wordCount: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  company: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  revision: {
    type: DataTypes.STRING(50),
    allowNull: true
  }
}, {
  tableName: 'file_metadata',
  timestamps: true, // Lägger till createdAt och updatedAt
  indexes: [
    {
      fields: ['fileType']
    },
    {
      fields: ['title']
    },
    {
      fields: ['author']
    },
    {
      fields: ['category']
    }
  ]
});

// Skapa tabeller i databasen
export async function syncDatabase() {
  try {
    await sequelize.sync({ force: false }); // force: false = skapa bara om de inte finns
    console.log('✅ Databastabeller synkroniserade!');
    return true;
  } catch (error) {
    console.error('❌ Fel vid synkronisering av databas:', error.message);
    return false;
  }
}

export default FileMetadata;
