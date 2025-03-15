// filepath: /Users/duy/nextjs project/web-qua-tang/lib/db.ts
import { Sequelize } from 'sequelize';
import logger from './logger';

const sequelize = new Sequelize('duy', 'root', 'admin', {
  host: '192.168.102.5',
  port: 3306,
  dialect: 'mysql',
  dialectOptions: {
    useUTC: false, // for reading from database
  },
  timezone: "+07:00",
  logging: (msg) => logger.debug('Sequelize:', msg)
});

export const connectToDatabase = async () => {
  try {
    logger.info('Attempting to connect to database...', {
      host: '192.168.102.5',
      port: 3306,
      database: 'duy'
    });

    await sequelize.authenticate();
    logger.info('Database connection established successfully');

    logger.info('Synchronizing database models...');
    await sequelize.sync({ alter: true });
    logger.info('Database models synchronized successfully');

  } catch (error) {
    logger.error('Database connection error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error; // Re-throw to handle it in the API layer
  }
};

// Add event listeners for connection issues
sequelize.addHook('beforeConnect', () => {
  logger.debug('Attempting database connection...');
});

sequelize.addHook('afterConnect', () => {
  logger.debug('Database connection successful');
});

sequelize.addHook('beforeDisconnect', () => {
  logger.debug('Closing database connection...');
});

sequelize.addHook('afterDisconnect', () => {
  logger.debug('Database connection closed');
});

export default sequelize;