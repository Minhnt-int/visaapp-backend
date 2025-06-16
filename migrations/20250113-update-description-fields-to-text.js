module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      console.log('Starting migration: Update description fields to TEXT...');
      
      // 1. Update ProductCategory description
      await queryInterface.changeColumn('product_categories', 'description', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
      console.log('✓ Updated product_categories.description to TEXT');

      // 2. Update Product description
      await queryInterface.changeColumn('products', 'description', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
      console.log('✓ Updated products.description to TEXT');

      // 3. Update Product metaDescription
      await queryInterface.changeColumn('products', 'metaDescription', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
      console.log('✓ Updated products.metaDescription to TEXT');

      // 4. Update BlogPost metaDescription
      await queryInterface.changeColumn('blog_posts', 'metaDescription', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
      console.log('✓ Updated blog_posts.metaDescription to TEXT');

      // 5. Update MetaSEO description
      await queryInterface.changeColumn('meta_seo', 'description', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
      console.log('✓ Updated meta_seo.description to TEXT');

      // 6. Update MetaSEO og_description
      await queryInterface.changeColumn('meta_seo', 'og_description', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
      console.log('✓ Updated meta_seo.og_description to TEXT');

      console.log('Migration completed successfully!');
      return Promise.resolve();
    } catch (error) {
      console.error('Error updating description fields:', error);
      return Promise.reject(error);
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      console.log('Starting rollback: Revert description fields to VARCHAR...');
      
      // Rollback - change back to original VARCHAR lengths
      // Note: This might cause data loss if any descriptions exceed the original limits
      
      // 1. Revert ProductCategory description
      await queryInterface.changeColumn('product_categories', 'description', {
        type: Sequelize.STRING(256),
        allowNull: true,
      });
      console.log('✓ Reverted product_categories.description to VARCHAR(256)');

      // 2. Revert Product description
      await queryInterface.changeColumn('products', 'description', {
        type: Sequelize.STRING(256),
        allowNull: true,
      });
      console.log('✓ Reverted products.description to VARCHAR(256)');

      // 3. Revert Product metaDescription
      await queryInterface.changeColumn('products', 'metaDescription', {
        type: Sequelize.STRING(256),
        allowNull: true,
      });
      console.log('✓ Reverted products.metaDescription to VARCHAR(256)');

      // 4. Revert BlogPost metaDescription
      await queryInterface.changeColumn('blog_posts', 'metaDescription', {
        type: Sequelize.STRING(512),
        allowNull: true,
      });
      console.log('✓ Reverted blog_posts.metaDescription to VARCHAR(512)');

      // 5. Revert MetaSEO description
      await queryInterface.changeColumn('meta_seo', 'description', {
        type: Sequelize.STRING(512),
        allowNull: true,
      });
      console.log('✓ Reverted meta_seo.description to VARCHAR(512)');

      // 6. Revert MetaSEO og_description
      await queryInterface.changeColumn('meta_seo', 'og_description', {
        type: Sequelize.STRING(512),
        allowNull: true,
      });
      console.log('✓ Reverted meta_seo.og_description to VARCHAR(512)');

      console.log('Rollback completed successfully!');
      return Promise.resolve();
    } catch (error) {
      console.error('Error reverting description fields:', error);
      return Promise.reject(error);
    }
  }
}; 