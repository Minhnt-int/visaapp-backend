const { exec } = require('child_process');
const path = require('path');

console.log('🚀 Starting database migration for description fields...');
console.log('📝 This will update all description fields from VARCHAR to TEXT');
console.log('⚠️  Make sure to backup your database before running this migration!');

// Function to run migration
const runMigration = () => {
  return new Promise((resolve, reject) => {
    // Change to the backend directory
    const backendDir = path.resolve(__dirname, '..');
    
    // Run the specific migration
    const migrationFile = '20250113-update-description-fields-to-text.js';
    const command = `cd ${backendDir} && npx sequelize-cli db:migrate --name ${migrationFile}`;
    
    console.log(`📂 Working directory: ${backendDir}`);
    console.log(`🔧 Running command: ${command}`);
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Migration failed:', error);
        reject(error);
        return;
      }
      
      if (stderr) {
        console.warn('⚠️  Warning:', stderr);
      }
      
      console.log('✅ Migration output:', stdout);
      resolve(stdout);
    });
  });
};

// Function to verify migration
const verifyMigration = () => {
  return new Promise((resolve, reject) => {
    const backendDir = path.resolve(__dirname, '..');
    const command = `cd ${backendDir} && npx sequelize-cli db:migrate:status`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Verification failed:', error);
        reject(error);
        return;
      }
      
      console.log('📊 Migration status:', stdout);
      resolve(stdout);
    });
  });
};

// Main execution
const main = async () => {
  try {
    console.log('\n🔍 Checking current migration status...');
    await verifyMigration();
    
    console.log('\n🚀 Running migration...');
    await runMigration();
    
    console.log('\n🔍 Verifying migration completion...');
    await verifyMigration();
    
    console.log('\n✅ Migration completed successfully!');
    console.log('📋 Summary of changes:');
    console.log('   - product_categories.description: VARCHAR(256) → TEXT');
    console.log('   - products.description: VARCHAR(256) → TEXT');
    console.log('   - products.metaDescription: VARCHAR(256) → TEXT');
    console.log('   - blog_posts.metaDescription: VARCHAR(512) → TEXT');
    console.log('   - meta_seo.description: VARCHAR(512) → TEXT');
    console.log('   - meta_seo.og_description: VARCHAR(512) → TEXT');
    console.log('\n🎉 All description fields now support unlimited characters!');
    
  } catch (error) {
    console.error('\n💥 Migration failed with error:', error);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('   1. Make sure your database is running');
    console.log('   2. Check your database connection settings');
    console.log('   3. Ensure you have the necessary permissions');
    console.log('   4. Try running the SQL script manually if needed');
    process.exit(1);
  }
};

// Handle CLI arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log('\n📚 Usage:');
  console.log('   node scripts/run-description-migration.js');
  console.log('\n🎯 Purpose:');
  console.log('   Updates all description fields from VARCHAR to TEXT');
  console.log('   to support unlimited characters.');
  console.log('\n📋 Tables affected:');
  console.log('   - product_categories');
  console.log('   - products');
  console.log('   - blog_posts');
  console.log('   - meta_seo');
  process.exit(0);
}

// Run the migration
main(); 