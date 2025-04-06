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

async function checkMediaTable() {
  try {
    await sequelize.authenticate();
    console.log('Database connection successful');
    
    // Get media rows count
    const [count] = await sequelize.query('SELECT COUNT(*) as count FROM media');
    console.log(`Media total rows: ${count[0].count}`);
    
    // Get newly created media entries
    const [newMediaEntries] = await sequelize.query(
      'SELECT * FROM media WHERE name LIKE "product_media_%" ORDER BY id DESC LIMIT 10'
    );
    console.log('Recently created media entries:');
    console.log(newMediaEntries);
    
    // Check for product_media referring to these media
    if (newMediaEntries.length > 0) {
      const mediaIds = newMediaEntries.map(m => m.id).join(',');
      const [productMediaEntries] = await sequelize.query(
        `SELECT * FROM product_media WHERE mediaId IN (${mediaIds})`
      );
      console.log('Product media entries using these media:');
      console.log(productMediaEntries);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkMediaTable(); 