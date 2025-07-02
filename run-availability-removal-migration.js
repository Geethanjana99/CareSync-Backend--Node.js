const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function runMigration() {
  let connection;
  
  try {
    console.log('Connecting to database...');
    
    // Create connection
    connection = await mysql.createConnection({
      host: 'caresyncdb-caresync.e.aivencloud.com',
      port: 16006,
      user: 'avnadmin',
      password: 'AVNS_6xeaVpCVApextDTAKfU',
      database: 'caresync',
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    console.log('Connected to database successfully!');
    console.log('Running migration to remove availability system...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', '011_remove_availability_system.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('/*') && !stmt.startsWith('--'));
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        console.log(`Executing statement ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`);
        try {
          // Use query() instead of execute() for DDL statements that don't support prepared statements
          if (statement.toLowerCase().includes('drop procedure') || 
              statement.toLowerCase().includes('drop view') || 
              statement.toLowerCase().includes('drop trigger')) {
            await connection.query(statement);
          } else {
            await connection.execute(statement);
          }
          console.log(`✓ Statement ${i + 1} completed successfully`);
        } catch (error) {
          // Some statements might fail if objects don't exist, which is okay
          if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY' || 
              error.code === 'ER_BAD_FIELD_ERROR' ||
              error.code === 'ER_BAD_TABLE_ERROR' ||
              error.code === 'ER_SP_DOES_NOT_EXIST' ||
              error.code === 'ER_NO_SUCH_TABLE') {
            console.log(`⚠ Statement ${i + 1} skipped (object doesn't exist): ${error.message}`);
          } else {
            console.error(`✗ Statement ${i + 1} failed:`, error.message);
            throw error;
          }
        }
      }
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('All availability-related database objects have been removed.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed.');
    }
  }
}

// Run the migration
runMigration()
  .then(() => {
    console.log('Migration script completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
