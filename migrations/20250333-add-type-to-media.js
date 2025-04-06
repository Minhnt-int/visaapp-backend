module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Check if the database type is MySQL
      const dialectName = queryInterface.sequelize.getDialect();
      
      if (dialectName === 'mysql') {
        // For MySQL, we need to create the ENUM type differently
        // First check if the column already exists
        const tableInfo = await queryInterface.describeTable('media');
        if (!tableInfo.type) {
          // Create ENUM type implicitly by adding column
          await queryInterface.addColumn('media', 'type', {
            type: Sequelize.ENUM('image', 'video'),
            allowNull: false,
            defaultValue: 'image',
          });
        }
      } else {
        // For other databases like PostgreSQL
        await queryInterface.addColumn('media', 'type', {
          type: Sequelize.ENUM('image', 'video'),
          allowNull: false,
          defaultValue: 'image',
        });
      }
      
      console.log('Added type column to media table');
      return Promise.resolve();
    } catch (error) {
      console.error('Error adding type column to media table:', error);
      return Promise.reject(error);
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      // Xóa cột type
      await queryInterface.removeColumn('media', 'type');
      
      // For MySQL, dropping ENUM is handled automatically when the last column using it is removed
      const dialectName = queryInterface.sequelize.getDialect();
      if (dialectName !== 'mysql') {
        // For PostgreSQL and other databases that support explicit ENUM types
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_media_type;');
      }
      
      console.log('Removed type column from media table');
      return Promise.resolve();
    } catch (error) {
      console.error('Error removing type column from media table:', error);
      return Promise.reject(error);
    }
  }
}; 