// Script thêm cột status vào bảng product_categories
const { Sequelize, QueryTypes } = require('sequelize');
require('dotenv').config();

// Khởi tạo kết nối database
const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  logging: console.log,
  timezone: process.env.DB_TIMEZONE || "+07:00"
});

async function runMigration() {
  try {
    // Kiểm tra kết nối database
    await sequelize.authenticate();
    console.log('Kết nối database thành công!');
    
    console.log('Bắt đầu thêm cột status vào bảng product_categories...');
    
    // Kiểm tra xem cột status đã tồn tại chưa
    const checkColumnQuery = `
      SELECT COUNT(*) as count
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'product_categories'
      AND COLUMN_NAME = 'status'
    `;
    
    const [result] = await sequelize.query(checkColumnQuery, {
      type: QueryTypes.SELECT
    });
    
    if (result.count > 0) {
      console.log('Cột status đã tồn tại trong bảng product_categories.');
      return;
    }
    
    // Thêm cột status
    const addColumnQuery = `
      ALTER TABLE product_categories 
      ADD COLUMN status ENUM('active', 'deleted') NOT NULL DEFAULT 'active'
    `;
    
    await sequelize.query(addColumnQuery, {
      type: QueryTypes.RAW
    });
    
    console.log('Đã thêm cột status vào bảng product_categories thành công.');
    
    // Cập nhật giá trị mặc định cho các bản ghi hiện có
    const updateQuery = `
      UPDATE product_categories 
      SET status = 'active' 
      WHERE status IS NULL
    `;
    
    await sequelize.query(updateQuery, {
      type: QueryTypes.UPDATE
    });
    
    console.log('Đã cập nhật status cho các bản ghi hiện có thành công.');
    
    console.log('Hoàn tất migration!');
  } catch (error) {
    console.error('Lỗi khi thực hiện migration:', error);
  } finally {
    // Đóng kết nối
    await sequelize.close();
  }
}

// Chạy migration
runMigration(); 