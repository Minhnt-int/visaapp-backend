module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // First, check if the table has the mediaId column
      const [columns] = await queryInterface.sequelize.query('SHOW COLUMNS FROM product_media');
      const hasMediaId = columns.some(col => col.Field === 'mediaId');
      const hasUrl = columns.some(col => col.Field === 'url');
      const hasIsAvatar = columns.some(col => col.Field === 'isAvatar');
      
      // Create default media records for each product_media row if they don't exist
      const [productMediaRecords] = await queryInterface.sequelize.query(
        'SELECT id, productId, type FROM product_media WHERE mediaId IS NULL'
      );
      
      console.log(`Found ${productMediaRecords.length} product media records to migrate`);
      
      // Create default media entries
      for (const record of productMediaRecords) {
        // Create a Media record with default values
        const [mediaInsertResult] = await queryInterface.sequelize.query(
          'INSERT INTO media (name, path, type, alt_text, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
          { 
            replacements: [
              `product_media_${record.id}`, 
              `/uploads/product_${record.productId}_media_${record.id}.jpg`,
              record.type,
              `Product ${record.productId} media ${record.id}`
            ]
          }
        );
        
        const mediaId = mediaInsertResult;
        
        // Update the product_media record with the new mediaId
        await queryInterface.sequelize.query(
          'UPDATE product_media SET mediaId = ? WHERE id = ?',
          { replacements: [mediaId, record.id] }
        );
      }
      
      // Make mediaId NOT NULL
      await queryInterface.changeColumn('product_media', 'mediaId', {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false
      });
      
      // Add foreign key if it doesn't exist yet
      await queryInterface.addConstraint('product_media', {
        fields: ['mediaId'],
        type: 'foreign key',
        name: 'product_media_mediaId_fk',
        references: {
          table: 'media',
          field: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });
      
      // If the old columns still exist, remove them
      if (hasUrl) {
        await queryInterface.removeColumn('product_media', 'url');
      }
      
      if (hasIsAvatar) {
        await queryInterface.removeColumn('product_media', 'isAvatar');
      }
      
      console.log('Modified product_media table: added mediaId with foreign key constraint');
      return Promise.resolve();
    } catch (error) {
      console.error('Error modifying product_media table:', error);
      return Promise.reject(error);
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      // Check if the columns exist before trying to add them
      const [columns] = await queryInterface.sequelize.query('SHOW COLUMNS FROM product_media');
      const hasUrl = columns.some(col => col.Field === 'url');
      const hasIsAvatar = columns.some(col => col.Field === 'isAvatar');
      
      // Add back url and isAvatar columns if they don't exist
      if (!hasUrl) {
        await queryInterface.addColumn('product_media', 'url', {
          type: new Sequelize.STRING(512),
          allowNull: true
        });
      }
      
      if (!hasIsAvatar) {
        await queryInterface.addColumn('product_media', 'isAvatar', {
          type: Sequelize.BOOLEAN,
          allowNull: true
        });
      }
      
      // Retrieve media info and populate url and isAvatar fields
      await queryInterface.sequelize.query(
        `UPDATE product_media pm 
         JOIN media m ON pm.mediaId = m.id 
         SET pm.url = m.path`
      );
      
      // Set all isAvatar to false initially
      await queryInterface.sequelize.query(
        'UPDATE product_media SET isAvatar = false'
      );
      
      // Set the first image for each product as avatar
      await queryInterface.sequelize.query(
        `UPDATE product_media pm1
         JOIN (
           SELECT MIN(id) AS id, productId 
           FROM product_media 
           GROUP BY productId
         ) pm2 ON pm1.id = pm2.id
         SET pm1.isAvatar = true`
      );
      
      // Make url and isAvatar not nullable
      if (!hasUrl) {
        await queryInterface.changeColumn('product_media', 'url', {
          type: new Sequelize.STRING(512),
          allowNull: false
        });
      }
      
      if (!hasIsAvatar) {
        await queryInterface.changeColumn('product_media', 'isAvatar', {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
        });
      }
      
      // Remove foreign key constraint
      await queryInterface.removeConstraint('product_media', 'product_media_mediaId_fk');
      
      // Remove mediaId column
      await queryInterface.removeColumn('product_media', 'mediaId');
      
      console.log('Reverted changes to product_media table');
      return Promise.resolve();
    } catch (error) {
      console.error('Error reverting product_media table modifications:', error);
      return Promise.reject(error);
    }
  }
}; 