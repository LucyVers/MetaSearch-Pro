import { Sequelize } from 'sequelize';
import fs from 'fs';
import path from 'path';

// Read credentials from JSON file
const credentialsPath = path.join(process.cwd(), 'credentials.json');
const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

const sequelize = new Sequelize(
  credentials.database,
  credentials.username,
  credentials.password,
  {
    host: credentials.host,
    port: credentials.port,
    dialect: 'mysql',
    logging: false, // Turn off SQL logs in console
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
    return true;
  } catch (error) {
    console.error('❌ Kunde inte ansluta till databasen:', error.message);
    return false;
  }
}

export default sequelize;
