#!/usr/bin/env node
/**
 * Check Database Schema for diabetes_predictions table
 */

const { mysqlConnection } = require('./config/mysql');

async function checkDatabaseSchema() {
  try {
    console.log('🔍 Checking diabetes_predictions table schema...\n');
    
    // Initialize connection
    await mysqlConnection.connect();
    
    const query = `DESCRIBE diabetes_predictions`;
    const columns = await mysqlConnection.query(query);
    
    console.log('📋 Current table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Key ? `[${col.Key}]` : ''}`);
    });
    
    console.log('\n✅ Schema check completed');
    
  } catch (error) {
    console.error('❌ Error checking schema:', error.message);
  }
}

if (require.main === module) {
  checkDatabaseSchema().catch(console.error);
}

module.exports = { checkDatabaseSchema };
