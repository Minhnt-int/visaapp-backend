require('dotenv').config();
const { Sequelize } = require('sequelize');

// Cấu hình kết nối database
const sequelizeConfig = {
  dialect: 'mysql',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  logging: false
};

const sequelize = new Sequelize(sequelizeConfig);

async function checkMediaColumns() {
  try {
    await sequelize.authenticate();
    console.log('Database connection successful');
    
    const [results] = await sequelize.query('SHOW COLUMNS FROM media');
    console.log('Media table columns:');
    results.forEach(col => {
      console.log(`${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkMediaColumns(); 