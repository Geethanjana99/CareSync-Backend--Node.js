const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkQueueStructure() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('📋 Checking queue_status table structure...');
    const [columns] = await connection.execute('DESCRIBE queue_status');
    console.log('\nQueue Status table columns:');
    columns.forEach(col => console.log(`  - ${col.Field} (${col.Type}) - ${col.Default ? 'Default: ' + col.Default : 'No default'}`));
    
    console.log('\n📊 Sample queue_status data:');
    const [rows] = await connection.execute('SELECT * FROM queue_status LIMIT 5');
    console.log(rows);
    
  } finally {
    await connection.end();
  }
}

checkQueueStructure().catch(console.error);
