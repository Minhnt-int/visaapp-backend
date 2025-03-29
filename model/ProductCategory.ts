import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../lib/db';
import logger from '../lib/logger';

export interface ProductCategoryAttributes {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parentId?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProductCategoryCreationAttributes extends Optional<ProductCategoryAttributes, 'id'> {}

class ProductCategory extends Model<ProductCategoryAttributes, ProductCategoryCreationAttributes> implements ProductCategoryAttributes {
  public id!: number;
  public name!: string;
  public slug!: string;
  public description!: string;
  public parentId?: number | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Add logging hooks
  static async findByPkWithLogging(id: number) {
    logger.debug('Finding product category by ID', { id });
    const category = await this.findByPk(id);
    if (category) {
      logger.debug('Product category found', { id, name: category.name });
    } else {
      logger.debug('Product category not found', { id });
    }
    return category;
  }

  static async findAllWithLogging(options?: any) {
    logger.debug('Finding all product categories', { options });
    const categories = await this.findAll(options);
    logger.debug('Product categories found', { count: categories.length });
    return categories;
  }
}

ProductCategory.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: new DataTypes.STRING(128),
      allowNull: false,
    },
    slug: {
      type: new DataTypes.STRING(128),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    parentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'product_categories',
        key: 'id',
      },
    },
  },
  {
    tableName: 'product_categories',
    sequelize,
    timestamps: true,
    indexes: [
      {
        fields: ['name'],
      },
      {
        fields: ['parentId'],
      },
    ],
    hooks: {
      beforeCreate: (category: ProductCategory) => {
        logger.debug('Creating new product category', {
          name: category.name,
          parentId: category.parentId
        });
      },
      afterCreate: (category: ProductCategory) => {
        logger.info('Product category created', {
          id: category.id,
          name: category.name,
          parentId: category.parentId
        });
      },
      beforeUpdate: (category: ProductCategory) => {
        logger.debug('Updating product category', {
          id: category.id,
          name: category.name,
          parentId: category.parentId
        });
      },
      afterUpdate: (category: ProductCategory) => {
        logger.info('Product category updated', {
          id: category.id,
          name: category.name,
          parentId: category.parentId
        });
      },
      beforeDestroy: (category: ProductCategory) => {
        logger.warn('Deleting product category', {
          id: category.id,
          name: category.name
        });
      },
      afterDestroy: (category: ProductCategory) => {
        logger.info('Product category deleted', {
          id: category.id,
          name: category.name
        });
      }
    }
  }
);

// Self-referential relationships
ProductCategory.hasMany(ProductCategory, {
  foreignKey: 'parentId',
  as: 'subcategories',
  hooks: true,
  onDelete: 'CASCADE',
});

ProductCategory.belongsTo(ProductCategory, {
  foreignKey: 'parentId',
  as: 'parent',
});

// Add logging for relationship operations
ProductCategory.afterFind((instancesOrInstance: ProductCategory | readonly ProductCategory[] | null) => {
  if (Array.isArray(instancesOrInstance)) {
    logger.debug('Retrieved multiple categories', {
      count: instancesOrInstance.length,
      ids: instancesOrInstance.map(c => c.id)
    });
  } else if (instancesOrInstance instanceof ProductCategory) {
    logger.debug('Retrieved single category', {
      id: instancesOrInstance.id,
      name: instancesOrInstance.name
    });
  }
});

export default ProductCategory;