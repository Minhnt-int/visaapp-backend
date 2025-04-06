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

async function checkProductMediaTable() {
  try {
    await sequelize.authenticate();
    console.log('Database connection successful');
    
    // Get table structure
    const [columns] = await sequelize.query('SHOW COLUMNS FROM product_media');
    console.log('ProductMedia table columns:');
    columns.forEach(col => {
      console.log(`${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });
    
    // Check if the table has data
    const [count] = await sequelize.query('SELECT COUNT(*) as count FROM product_media');
    console.log(`ProductMedia row count: ${count[0].count}`);
    
    if (parseInt(count[0].count) > 0) {
      // Get sample data
      const [rows] = await sequelize.query('SELECT * FROM product_media LIMIT 5');
      console.log('Sample data from product_media:');
      console.log(rows);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkProductMediaTable(); 