// filepath: /Users/duy/nextjs project/web-qua-tang/lib/db.ts
import { Sequelize } from 'sequelize';

// Định nghĩa enum ProductItemStatus
const ProductItemStatus = {
  AVAILABLE: 'available',
  OUT_OF_STOCK: 'out_of_stock',
  DISCONTINUED: 'discontinued'
};

// Cấu hình kết nối database
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

export const connectToDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Kết nối database thành công!');

    // Import models từ file index
    require('../model');

    console.log('Đã thiết lập các quan hệ giữa các models!');
  } catch (error) {
    console.error('Lỗi kết nối database:', error);
    throw error;
  }
};

export default sequelize;