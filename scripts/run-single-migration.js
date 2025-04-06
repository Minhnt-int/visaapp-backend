const path = require('path');
const fs = require('fs');
const { Sequelize } = require('sequelize');
require('dotenv').config();

// Lấy config database
const dbConfig = {
  dialect: 'mysql',
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
};

// Khởi tạo kết nối Sequelize
const sequelize = new Sequelize(dbConfig);

async function runMigration() {
  try {
    // Lấy tên file migration từ tham số dòng lệnh
    const migrationFile = process.argv[2];
    
    if (!migrationFile) {
      console.error('Vui lòng cung cấp tên file migration. Ví dụ: node run-single-migration.js 20250333-add-type-to-media.js');
      process.exit(1);
    }
    
    // Đường dẫn đầy đủ đến file migration
    const migrationPath = path.join(__dirname, '../migrations', migrationFile);
    
    // Kiểm tra file có tồn tại không
    if (!fs.existsSync(migrationPath)) {
      console.error(`File migration không tồn tại: ${migrationPath}`);
      process.exit(1);
    }
    
    // Import migration
    const migration = require(migrationPath);
    
    // Kiểm tra kết nối database
    await sequelize.authenticate();
    console.log('Kết nối database thành công.');
    
    // Chạy migration
    console.log(`Đang chạy migration: ${migrationFile}`);
    await migration.up(sequelize.getQueryInterface(), Sequelize);
    
    console.log('Migration đã chạy thành công!');
  } catch (error) {
    console.error('Lỗi khi chạy migration:', error);
  } finally {
    // Đóng kết nối
    await sequelize.close();
  }
}

runMigration(); 