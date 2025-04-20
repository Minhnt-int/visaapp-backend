module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Tạo bảng meta_json mới
      await queryInterface.createTable('meta_json', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        page_key: {
          type: Sequelize.STRING(255),
          allowNull: false,
          unique: true,
          comment: 'Định danh của trang (ví dụ: home, about, contact)',
        },
        meta_data: {
          type: Sequelize.JSON,
          allowNull: false,
          comment: 'Dữ liệu metadata dạng JSON không xác định',
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
      
      console.log('Đã tạo bảng meta_json');
      return Promise.resolve();
    } catch (error) {
      console.error('Lỗi khi tạo bảng meta_json:', error);
      return Promise.reject(error);
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      // Xóa bảng meta_json
      await queryInterface.dropTable('meta_json');
      
      console.log('Đã xóa bảng meta_json');
      return Promise.resolve();
    } catch (error) {
      console.error('Lỗi khi xóa bảng meta_json:', error);
      return Promise.reject(error);
    }
  }
}; 