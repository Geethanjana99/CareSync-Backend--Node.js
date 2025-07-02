// Get detailed table structures from the database
require('dotenv').config();
const { mysqlConnection } = require('./config/mysql');

async function getTableStructures() {
  console.log('📊 Getting Table Structures from CareSync Database...\n');
  
  try {
    await mysqlConnection.connect();
    const pool = mysqlConnection.getPool();

    // Get all tables
    console.log('📋 Getting all tables...');
    const [tables] = await pool.execute(`
      SELECT TABLE_NAME, TABLE_COMMENT, TABLE_ROWS, DATA_LENGTH
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ?
      ORDER BY TABLE_NAME
    `, [process.env.MYSQL_DATABASE || 'caresync']);

    console.log(`\n✅ Found ${tables.length} tables:\n`);
    
    for (const table of tables) {
      console.log(`\n🏗️  TABLE: ${table.TABLE_NAME}`);
      console.log(`   Comment: ${table.TABLE_COMMENT || 'No comment'}`);
      console.log(`   Rows: ${table.TABLE_ROWS || 0}`);
      console.log(`   Size: ${Math.round(table.DATA_LENGTH / 1024)} KB`);

      // Get column details
      const [columns] = await pool.execute(`
        SELECT 
          COLUMN_NAME,
          DATA_TYPE,
          IS_NULLABLE,
          COLUMN_DEFAULT,
          COLUMN_KEY,
          EXTRA,
          COLUMN_COMMENT
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION
      `, [process.env.MYSQL_DATABASE || 'caresync', table.TABLE_NAME]);

      console.log('   📝 Columns:');
      columns.forEach(col => {
        const key = col.COLUMN_KEY ? ` [${col.COLUMN_KEY}]` : '';
        const nullable = col.IS_NULLABLE === 'YES' ? ' NULL' : ' NOT NULL';
        const extra = col.EXTRA ? ` ${col.EXTRA}` : '';
        const defaultVal = col.COLUMN_DEFAULT ? ` DEFAULT '${col.COLUMN_DEFAULT}'` : '';
        console.log(`      - ${col.COLUMN_NAME}: ${col.DATA_TYPE}${nullable}${defaultVal}${extra}${key}`);
        if (col.COLUMN_COMMENT) {
          console.log(`        Comment: ${col.COLUMN_COMMENT}`);
        }
      });

      // Get foreign keys
      const [foreignKeys] = await pool.execute(`
        SELECT 
          COLUMN_NAME,
          REFERENCED_TABLE_NAME,
          REFERENCED_COLUMN_NAME
        FROM information_schema.KEY_COLUMN_USAGE 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL
      `, [process.env.MYSQL_DATABASE || 'caresync', table.TABLE_NAME]);

      if (foreignKeys.length > 0) {
        console.log('   🔗 Foreign Keys:');
        foreignKeys.forEach(fk => {
          console.log(`      - ${fk.COLUMN_NAME} → ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
        });
      }

      // Get indexes
      const [indexes] = await pool.execute(`
        SELECT 
          INDEX_NAME,
          COLUMN_NAME,
          NON_UNIQUE
        FROM information_schema.STATISTICS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
        ORDER BY INDEX_NAME, SEQ_IN_INDEX
      `, [process.env.MYSQL_DATABASE || 'caresync', table.TABLE_NAME]);

      if (indexes.length > 0) {
        console.log('   📚 Indexes:');
        const indexGroups = indexes.reduce((acc, idx) => {
          if (!acc[idx.INDEX_NAME]) acc[idx.INDEX_NAME] = [];
          acc[idx.INDEX_NAME].push(idx);
          return acc;
        }, {});

        Object.entries(indexGroups).forEach(([indexName, cols]) => {
          const unique = cols[0].NON_UNIQUE === 0 ? ' (UNIQUE)' : '';
          const columns = cols.map(c => c.COLUMN_NAME).join(', ');
          console.log(`      - ${indexName}: (${columns})${unique}`);
        });
      }

      console.log('   ' + '─'.repeat(60));
    }

    await mysqlConnection.close();
    console.log('\n✅ Table structure analysis complete!');

  } catch (error) {
    console.error('❌ Error getting table structures:', error.message);
    throw error;
  }
}

getTableStructures().catch(console.error);
