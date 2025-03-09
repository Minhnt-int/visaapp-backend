import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../lib/db';
import ProductCategory from './ProductCategory';
import ProductMedia from './ProductMedia';

interface ProductAttributes {
  id: number;
  name: string;
  price: number;
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
  public price!: number;
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
      type: DataTypes.UUID,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: new DataTypes.STRING(128),
      allowNull: false,
    },
    price: {
      type: DataTypes.FLOAT,
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

export default Product;