// filepath: /Users/duy/nextjs project/web-qua-tang/lib/db.ts
import { Sequelize } from 'sequelize';

const sequelize = new Sequelize('duy', 'root', 'admin', {
  host: '192.168.102.5',
  port: 3306,
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
    await sequelize.sync({ alter: true }); // This will update the tables if they do not exist
    console.log('All models were synchronized successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

export default sequelize;