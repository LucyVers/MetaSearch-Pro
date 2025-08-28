import { testConnection } from './database.js';
import { syncDatabase } from './models.js';

async function testDatabase() {
  console.log('🧪 Testar databasanslutning...\n');
  
  // Testa anslutning
  const connectionOk = await testConnection();
  if (!connectionOk) {
    console.log('❌ Avbryter - kan inte ansluta till databasen');
    process.exit(1);
  }
  
  console.log('\n📋 Synkroniserar databastabeller...');
  
  // Skapa tabeller
  const syncOk = await syncDatabase();
  if (!syncOk) {
    console.log('❌ Avbryter - kan inte skapa tabeller');
    process.exit(1);
  }
  
  console.log('\n🎉 Allt fungerar perfekt! Databasen är redo!');
  process.exit(0);
}

testDatabase().catch(error => {
  console.error('❌ Oväntat fel:', error);
  process.exit(1);
});
