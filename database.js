import { Sequelize } from 'sequelize';
import fs from 'fs';
import path from 'path';

// Läs credentials från JSON-fil
const credentialsPath = path.join(process.cwd(), 'credentials.json');
const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

// Skapa Sequelize-instans
const sequelize = new Sequelize(
  credentials.database,
  credentials.username,
  credentials.password,
  {
    host: credentials.host,
    port: credentials.port,
    dialect: 'mysql',
    logging: false, // Stäng av SQL-loggar i konsolen
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Testa anslutning
export async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Databasanslutning lyckades!');
    return true;
  } catch (error) {
    console.error('❌ Kunde inte ansluta till databasen:', error.message);
    return false;
  }
}

export default sequelize;
