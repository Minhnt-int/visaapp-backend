import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../lib/db';
import logger from '../lib/logger';

interface ProductMediaAttributes {
  id: number;
  productId: number;
  type: 'image' | 'video';
  url: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProductMediaCreationAttributes extends Optional<ProductMediaAttributes, 'id'> { }

class ProductMedia extends Model<ProductMediaAttributes, ProductMediaCreationAttributes> implements ProductMediaAttributes {
  public id!: number;
  public productId!: number;
  public type!: 'image' | 'video';
  public url!: string;
  public createdAt!: Date;
  public updatedAt!: Date;

  // Add logging utility methods
  static async findByProductIdWithLogging(productId: number) {
    logger.debug('Finding media for product', { productId });
    const media = await this.findAll({ where: { productId } });
    logger.debug('Product media found', { 
      productId, 
      count: media.length,
      types: media.map(m => m.type)
    });
    return media;
  }

  static async bulkCreateWithLogging(mediaItems: ProductMediaCreationAttributes[]) {
    logger.debug('Creating multiple media items', { 
      count: mediaItems.length,
      productId: mediaItems[0]?.productId 
    });
    const created = await this.bulkCreate(mediaItems);
    logger.info('Media items created', {
      count: created.length,
      productId: created[0]?.productId,
      ids: created.map(m => m.id)
    });
    return created;
  }
}

ProductMedia.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    productId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('image', 'video'),
      allowNull: false,
    },
    url: {
      type: new DataTypes.STRING(256),
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'product_media',
    sequelize,
    timestamps: true,
    indexes: [
      {
        fields: ['productId'],
      },
    ],
    hooks: {
      beforeCreate: (media: ProductMedia) => {
        logger.debug('Creating new product media', {
          productId: media.productId,
          type: media.type,
          url: media.url
        });
      },
      afterCreate: (media: ProductMedia) => {
        logger.info('Product media created', {
          id: media.id,
          productId: media.productId,
          type: media.type
        });
      },
      beforeBulkCreate: (medias: ProductMedia[]) => {
        logger.debug('Creating multiple media items', {
          count: medias.length,
          productId: medias[0]?.productId,
          types: medias.map(m => m.type)
        });
      },
      afterBulkCreate: (medias: ProductMedia[]) => {
        logger.info('Multiple media items created', {
          count: medias.length,
          productId: medias[0]?.productId,
          ids: medias.map(m => m.id)
        });
      },
      beforeDestroy: (media: ProductMedia) => {
        logger.warn('Deleting product media', {
          id: media.id,
          productId: media.productId,
          type: media.type
        });
      },
      afterDestroy: (media: ProductMedia) => {
        logger.info('Product media deleted', {
          id: media.id,
          productId: media.productId,
          type: media.type
        });
      }
    }
  }
);

// Add logging for find operations
ProductMedia.afterFind((instancesOrInstance: ProductMedia | readonly ProductMedia[] | null) => {
  if (Array.isArray(instancesOrInstance)) {
    const uniqueProductIds = Array.from(new Set(instancesOrInstance.map(m => m.productId)));
    logger.debug('Retrieved multiple media items', {
      count: instancesOrInstance.length,
      ids: instancesOrInstance.map(m => m.id),
      productIds: uniqueProductIds
    });
  } else if (instancesOrInstance instanceof ProductMedia) {
    logger.debug('Retrieved single media item', {
      id: instancesOrInstance.id,
      productId: instancesOrInstance.productId,
      type: instancesOrInstance.type
    });
  }
});

export default ProductMedia;