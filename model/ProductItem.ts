import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../lib/db';

// Định nghĩa các trạng thái của ProductItem
export enum ProductItemStatus {
  AVAILABLE = 'available',
  OUT_OF_STOCK = 'out_of_stock',
  DISCONTINUED = 'discontinued'
}

interface ProductItemAttributes {
  id: number;
  productId: number;
  name: string;
  color: string;
  price: number;
  status: ProductItemStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProductItemCreationAttributes extends Optional<ProductItemAttributes, 'id'> {}

class ProductItem extends Model<ProductItemAttributes, ProductItemCreationAttributes> implements ProductItemAttributes {
  public id!: number;
  public productId!: number;
  public name!: string;
  public color!: string;
  public price!: number;
  public status!: ProductItemStatus;
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
    name: {
      type: new DataTypes.STRING(128),
      allowNull: false,
    },
    color: {
      type: new DataTypes.STRING(64),
      allowNull: false,
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(ProductItemStatus)),
      allowNull: false,
      defaultValue: ProductItemStatus.AVAILABLE,
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
      {
        fields: ['name'],
      },
      {
        fields: ['status'],
      },
    ],
  }
);

export default ProductItem;