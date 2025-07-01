const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkTables() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('📋 Checking existing database structure...');
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('Available tables:', tables.map(t => Object.values(t)[0]));
    
    if (tables.some(t => Object.values(t)[0] === 'doctors')) {
      const [columns] = await connection.execute('DESCRIBE doctors');
      console.log('\nDoctors table columns:');
      columns.forEach(col => console.log(`  - ${col.Field} (${col.Type})`));
    }
  } finally {
    await connection.end();
  }
}

checkTables().catch(console.error);
