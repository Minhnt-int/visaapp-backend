module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.createTable('meta_seo', {
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
        page_url: {
          type: Sequelize.STRING(512),
          allowNull: true,
          comment: 'URL của trang nếu có (ví dụ: /about, /contact)',
        },
        title: {
          type: Sequelize.STRING(255),
          allowNull: false,
          comment: 'Meta title cho SEO',
        },
        description: {
          type: Sequelize.STRING(512),
          allowNull: true,
          comment: 'Meta description cho SEO',
        },
        keywords: {
          type: Sequelize.STRING(512),
          allowNull: true,
          comment: 'Meta keywords cho SEO',
        },
        og_title: {
          type: Sequelize.STRING(255),
          allowNull: true,
          comment: 'Open Graph title',
        },
        og_description: {
          type: Sequelize.STRING(512),
          allowNull: true,
          comment: 'Open Graph description',
        },
        og_image: {
          type: Sequelize.STRING(512),
          allowNull: true,
          comment: 'Open Graph image URL',
        },
        custom_head: {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'Các thẻ HTML tùy chỉnh để thêm vào head',
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

      // Thêm index cho cột page_key để tìm kiếm nhanh hơn
      await queryInterface.addIndex('meta_seo', ['page_key']);
      
      console.log('Created meta_seo table');
      return Promise.resolve();
    } catch (error) {
      console.error('Error creating meta_seo table:', error);
      return Promise.reject(error);
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.dropTable('meta_seo');
      
      console.log('Dropped meta_seo table');
      return Promise.resolve();
    } catch (error) {
      console.error('Error dropping meta_seo table:', error);
      return Promise.reject(error);
    }
  }
}; 