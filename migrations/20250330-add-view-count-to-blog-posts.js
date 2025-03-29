module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Thêm cột viewCount vào bảng blog_posts
      await queryInterface.addColumn('blog_posts', 'viewCount', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
      });
      
      console.log('Added viewCount column to blog_posts table');
      return Promise.resolve();
    } catch (error) {
      console.error('Error adding viewCount column:', error);
      return Promise.reject(error);
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      // Xóa cột viewCount khỏi bảng blog_posts
      await queryInterface.removeColumn('blog_posts', 'viewCount');
      
      console.log('Removed viewCount column from blog_posts table');
      return Promise.resolve();
    } catch (error) {
      console.error('Error removing viewCount column:', error);
      return Promise.reject(error);
    }
  }
}; 