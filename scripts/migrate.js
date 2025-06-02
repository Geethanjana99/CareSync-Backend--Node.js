#!/usr/bin/env node

const MigrationRunner = require('./migrationRunner');
const logger = require('../config/logger');

// Database configuration from environment variables
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'clinical_appointment_system'
};

const migrationRunner = new MigrationRunner(dbConfig);

async function runMigrations() {
  try {
    console.log('🚀 Starting database migrations...\n');
    
    const result = await migrationRunner.runMigrations();
    
    if (result.executed === 0) {
      console.log('✅ Database is up to date!');
    } else {
      console.log(`✅ Successfully executed ${result.executed} migrations:`);
      result.migrations.forEach(migration => {
        console.log(`   - ${migration}`);
      });
    }
    
    console.log('\n🎉 Migration process completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

async function getMigrationStatus() {
  try {
    console.log('📊 Checking migration status...\n');
    
    const status = await migrationRunner.getMigrationStatus();
    
    if (status.length === 0) {
      console.log('No migrations found.');
      return;
    }
    
    console.log('Migration Status:');
    console.log('================');
    
    status.forEach(migration => {
      const statusIcon = migration.executed ? '✅' : '⏳';
      const statusText = migration.executed ? 'Executed' : 'Pending';
      const timestamp = migration.executedAt ? 
        ` (${migration.executedAt.toISOString()})` : '';
      
      console.log(`${statusIcon} ${migration.name} - ${statusText}${timestamp}`);
    });
    
    const pendingCount = status.filter(m => !m.executed).length;
    const executedCount = status.filter(m => m.executed).length;
    
    console.log(`\n📈 Summary: ${executedCount} executed, ${pendingCount} pending`);
    
  } catch (error) {
    console.error('❌ Failed to get migration status:', error.message);
    process.exit(1);
  }
}

async function rollbackMigration(migrationName) {
  try {
    console.log(`🔄 Rolling back migration: ${migrationName}...\n`);
    
    await migrationRunner.rollbackMigration(migrationName);
    
    console.log(`✅ Successfully rolled back migration: ${migrationName}`);
    console.log('\n⚠️  Remember to manually verify the rollback was successful!');
    
  } catch (error) {
    console.error('❌ Rollback failed:', error.message);
    process.exit(1);
  }
}

async function createMigration(name) {
  try {
    console.log(`📝 Creating new migration: ${name}...\n`);
    
    const migrationFile = await migrationRunner.createMigration(name);
    
    console.log(`✅ Created migration file: ${migrationFile}`);
    console.log(`📁 Location: migrations/${migrationFile}`);
    console.log('\n💡 Edit the file to add your migration SQL, then run:');
    console.log('   npm run migrate');
    
  } catch (error) {
    console.error('❌ Failed to create migration:', error.message);
    process.exit(1);
  }
}

// Parse command line arguments
const command = process.argv[2];
const argument = process.argv[3];

switch (command) {
  case 'run':
  case 'up':
    runMigrations();
    break;
    
  case 'status':
    getMigrationStatus();
    break;
    
  case 'rollback':
    if (!argument) {
      console.error('❌ Please specify the migration file to rollback');
      console.log('Usage: npm run migrate rollback <migration_file>');
      process.exit(1);
    }
    rollbackMigration(argument);
    break;
    
  case 'create':
    if (!argument) {
      console.error('❌ Please specify a name for the migration');
      console.log('Usage: npm run migrate create <migration_name>');
      process.exit(1);
    }
    createMigration(argument);
    break;
    
  default:
    console.log('🗃️  Database Migration Tool');
    console.log('========================\n');
    console.log('Available commands:');
    console.log('  npm run migrate run       - Execute pending migrations');
    console.log('  npm run migrate status    - Show migration status');
    console.log('  npm run migrate create <name> - Create new migration');
    console.log('  npm run migrate rollback <file> - Rollback specific migration');
    console.log('\nExamples:');
    console.log('  npm run migrate create add_user_preferences');
    console.log('  npm run migrate rollback 20250101_add_user_preferences.sql');
    break;
}
