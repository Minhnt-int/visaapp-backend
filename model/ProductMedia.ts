import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../lib/db';
import Product from './Product';

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
    sequelize, // passing the `sequelize` instance is required
    timestamps: true, // automatically add createdAt and updatedAt fields
  }
);

// // Thiết lập quan hệ
// ProductMedia.belongsTo(Product, {
//   foreignKey: 'productId',
//   as: 'product',
// });

// Product.hasMany(ProductMedia, {
//   sourceKey: 'id',
//   foreignKey: 'productId',
//   as: 'media',
// });

export default ProductMedia;