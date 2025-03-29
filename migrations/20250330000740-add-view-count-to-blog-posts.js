'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Thêm cột viewCount vào bảng blog_posts
     */
    return queryInterface.addColumn(
      'blog_posts',
      'viewCount',
      {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        after: 'publishedAt'
      }
    );
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Xóa cột viewCount khỏi bảng blog_posts
     */
    return queryInterface.removeColumn('blog_posts', 'viewCount');
  }
}; 