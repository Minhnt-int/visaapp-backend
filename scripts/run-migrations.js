const { Sequelize } = require('sequelize');
const migration = require('../migrations/remove-price-from-products');
require('dotenv').config();

// Cấu hình kết nối database với thông tin giống như trong lib/db.ts
const sequelizeConfig = {
  dialect: 'mysql',
  host: '192.168.55.254',
  port: 3306,
  username: 'root',
  password: 'admin',
  database: 'duy',
  logging: console.log,
  timezone: "+07:00"
};

// Tạo instance Sequelize
const sequelize = new Sequelize(sequelizeConfig);

// Tạo đối tượng QueryInterface
const queryInterface = sequelize.getQueryInterface();

// Chạy migration
async function runMigration() {
  try {
    console.log('Kết nối đến database...');
    await sequelize.authenticate();
    console.log('Kết nối thành công!');

    console.log('Running migration to remove price field from products...');
    await migration.up(queryInterface, Sequelize);
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Bắt đầu chạy migration
runMigration(); 