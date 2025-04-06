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

async function checkMediaQuery() {
  try {
    await sequelize.authenticate();
    console.log('Database connection successful');
    
    // Test the exact query we're using in the API
    const [results] = await sequelize.query(
      `SELECT id, name, path, type, alt_text AS altText, created_at AS createdAt, updated_at AS updatedAt 
       FROM media 
       ORDER BY created_at DESC 
       LIMIT 5`,
      { 
        type: 'SELECT',
        raw: true,
        nest: false
      }
    );
    
    // Try an alternative approach
    const alternativeResults = await sequelize.query(
      `SELECT id, name, path, type, alt_text AS altText, created_at AS createdAt, updated_at AS updatedAt 
       FROM media 
       ORDER BY created_at DESC 
       LIMIT 5`,
      { 
        raw: true,
        nest: false,
        plain: false
      }
    );
    
    console.log('Query results:');
    console.log(JSON.stringify(results, null, 2));
    console.log('Results type:', typeof results);
    console.log('Is array:', Array.isArray(results));
    console.log('Results length:', results ? (Array.isArray(results) ? results.length : 1) : 0);

    console.log('Alternative query results type:', typeof alternativeResults);
    if (Array.isArray(alternativeResults)) {
      console.log('Alternative results first dimension length:', alternativeResults.length);
      if (alternativeResults.length > 0 && Array.isArray(alternativeResults[0])) {
        console.log('Alternative results second dimension length:', alternativeResults[0].length);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkMediaQuery(); 