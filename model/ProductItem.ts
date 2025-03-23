import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../lib/db';
import Product from './Product';

interface ProductItemAttributes {
  id: number;
  productId: number;
  color: string;
  price: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProductItemCreationAttributes extends Optional<ProductItemAttributes, 'id'> {}

class ProductItem extends Model<ProductItemAttributes, ProductItemCreationAttributes> implements ProductItemAttributes {
  public id!: number;
  public productId!: number;
  public color!: string;
  public price!: number;
  public createdAt!: Date;
  public updatedAt!: Date;
}

ProductItem.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    productId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id',
      },
    },
    color: {
      type: new DataTypes.STRING(64),
      allowNull: false,
    },
    price: {
      type: DataTypes.FLOAT,
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
    tableName: 'product_items',
    sequelize,
    timestamps: true,
    indexes: [
      {
        fields: ['productId'],
      },
      {
        fields: ['color'],
      },
    ],
  }
);

// Thiết lập mối quan hệ với Product
ProductItem.belongsTo(Product, {
  foreignKey: 'productId',
  as: 'product',
});

export default ProductItem; 