// filepath: /Users/duy/nextjs project/web-qua-tang/lib/db.ts
import { Sequelize } from 'sequelize';

const host = process.env.DB_HOST || 'localhost'
const port = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306;

const sequelize = new Sequelize('duy', 'root', 'admin', {
  host: host,
  port: port,
  dialect: 'mysql',
  dialectOptions: {
    useUTC: false, // for reading from database
  },
  timezone: "+07:00"
});

export const connectToDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    
    // Import các models và thiết lập associations ở đây
    // Đảm bảo import sau khi sequelize đã được khởi tạo
    // nhưng trước khi sync
    const { setupAssociations } = await import('../model/associations');
    setupAssociations();
    
    await sequelize.sync({ alter: true }); // This will update the tables if they do not exist
    console.log('All models were synchronized successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};  

export default sequelize;