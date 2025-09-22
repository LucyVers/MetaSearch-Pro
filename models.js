import { DataTypes } from 'sequelize';
import sequelize from './database.js';

// Common model for all file types
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
  
  // PDF-specific fields
  pdfVersion: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  pageCount: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  
  // JPG-specific fields
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
  
  // MP3-specific fields
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
  
  // PPT-specific fields
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
  timestamps: true, // Adds createdAt and updatedAt
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

async function syncDatabase() {
  try {
    await sequelize.sync({ force: false }); // force: false = skapa bara om de inte finns
    return true;
  } catch (error) {
    console.error('❌ Fel vid synkronisering av databas:', error.message);
    return false;
  }
}

// Favorites model to save user favorite files
const Favorites = sequelize.define('Favorites', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  fileId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'file_metadata',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'default' // For future multi-user support
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'favorites',
  timestamps: false, // Vi hanterar createdAt manuellt
  indexes: [
    {
      fields: ['fileId']
    },
    {
      fields: ['userId']
    },
    {
      fields: ['fileId', 'userId'],
      unique: true // One user can only have one favorite per file
    }
  ]
});

// Definiera relation mellan FileMetadata och Favorites
FileMetadata.hasMany(Favorites, { foreignKey: 'fileId' });
Favorites.belongsTo(FileMetadata, { foreignKey: 'fileId' });

export { FileMetadata, Favorites, syncDatabase };
