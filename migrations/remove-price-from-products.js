const { Sequelize } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Loại bỏ trường price khỏi bảng products
      await queryInterface.removeColumn('products', 'price');
      
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Khôi phục lại trường price nếu cần
      await queryInterface.addColumn('products', 'price', {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0
      });
      
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  }
}; 