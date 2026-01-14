const mysql = require('mysql2/promise');

async function showDatabaseStructure() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'caresync'
    });
    
    console.log('🔍 Current tables in caresync database:');
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`Found ${tables.length} tables:`);
    
    tables.forEach((table, index) => {
      console.log(`${index + 1}. ${Object.values(table)[0]}`);
    });
    
    console.log('\n🔗 Foreign Key Constraints:');
    const [fks] = await connection.execute(`
      SELECT 
        TABLE_NAME,
        COLUMN_NAME,
        CONSTRAINT_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM 
        INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE 
        REFERENCED_TABLE_SCHEMA = 'caresync'
        AND REFERENCED_TABLE_NAME IS NOT NULL
      ORDER BY TABLE_NAME, COLUMN_NAME
    `);
    
    if (fks.length > 0) {
      fks.forEach(fk => {
        console.log(`${fk.TABLE_NAME}.${fk.COLUMN_NAME} -> ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
      });
    } else {
      console.log('No foreign key constraints found');
    }
    
    // Check if tables have data
    console.log('\n📊 Table row counts:');
    for (const table of tables) {
      const tableName = Object.values(table)[0];
      try {
        const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
        console.log(`${tableName}: ${rows[0].count} rows`);
      } catch (error) {
        console.log(`${tableName}: Error counting rows - ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

showDatabaseStructure();