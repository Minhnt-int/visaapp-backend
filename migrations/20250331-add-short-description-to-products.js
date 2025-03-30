module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Thêm cột shortDescription vào bảng products
      await queryInterface.addColumn('products', 'shortDescription', {
        type: Sequelize.STRING(512),
        allowNull: true,
      });
      
      console.log('Added shortDescription column to products table');
      return Promise.resolve();
    } catch (error) {
      console.error('Error adding shortDescription column:', error);
      return Promise.reject(error);
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      // Xóa cột shortDescription khỏi bảng products
      await queryInterface.removeColumn('products', 'shortDescription');
      
      console.log('Removed shortDescription column from products table');
      return Promise.resolve();
    } catch (error) {
      console.error('Error removing shortDescription column:', error);
      return Promise.reject(error);
    }
  }
}; 