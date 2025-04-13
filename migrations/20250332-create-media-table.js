module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.createTable('media', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        name: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        path: {
          type: Sequelize.STRING(512),
          allowNull: false,
        },
        alt_text: {
          type: Sequelize.STRING(512),
          allowNull: true,
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
        },
      });

      // Thêm index cho cột name để tìm kiếm nhanh hơn
      await queryInterface.addIndex('media', ['name']);
      
      console.log('Created media table');
      return Promise.resolve();
    } catch (error) {
      console.error('Error creating media table:', error);
      return Promise.reject(error);
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.dropTable('media');
      
      console.log('Dropped media table');
      return Promise.resolve();
    } catch (error) {
      console.error('Error dropping media table:', error);
      return Promise.reject(error);
    }
  }
}; 