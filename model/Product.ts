import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../lib/db';
import ProductCategory from './ProductCategory';
import ProductMedia from './ProductMedia';
import ProductItem from './ProductItem';

interface ProductAttributes {
  id: number;
  name: string;
  description: string;
  categoryId: number;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProductCreationAttributes extends Optional<ProductAttributes, 'id'> {}

class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
  public id!: number;
  public name!: string;
  public description!: string;
  public categoryId!: number;
  public slug!: string;
  public metaTitle!: string;
  public metaDescription!: string;
  public metaKeywords!: string;
  public createdAt!: Date;
  public updatedAt!: Date;
}

Product.init(
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
    description: {
      type: new DataTypes.STRING(256),
      allowNull: true,
    },
    categoryId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    slug: {
      type: new DataTypes.STRING(128),
      allowNull: false,
      unique: true,
    },
    metaTitle: {
      type: new DataTypes.STRING(128),
      allowNull: true,
    },
    metaDescription: {
      type: new DataTypes.STRING(256),
      allowNull: true,
    },
    metaKeywords: {
      type: new DataTypes.STRING(256),
      allowNull: true,
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
    tableName: 'products',
    sequelize, // passing the `sequelize` instance is required
    timestamps: true, // automatically add createdAt and updatedAt fields
    indexes: [
      {
        fields: ['name'], // Add index for the 'name' column
      },
      {
        fields: ['categoryId'], // Add index for the 'categoryId' column
      },
    ],
  }
);

// Thiết lập quan hệ
Product.belongsTo(ProductCategory, {
  foreignKey: 'categoryId',
  as: 'category',
});

ProductCategory.hasMany(Product, {
  sourceKey: 'id',
  foreignKey: 'categoryId',
  as: 'products',
});

Product.hasMany(ProductMedia, {
  sourceKey: 'id',
  foreignKey: 'productId',
  as: 'media',
});

// Thêm quan hệ với ProductItem
Product.hasMany(ProductItem, {
  sourceKey: 'id',
  foreignKey: 'productId',
  as: 'items',
});

export default Product;