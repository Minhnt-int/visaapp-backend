import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../lib/db';
import Order from './Order';
import Product from './Product';
import ProductItem, { ProductItemStatus } from './ProductItem';

interface OrderItemAttributes {
  id: number;
  orderId: number; // ID đơn hàng
  productId: number; // ID sản phẩm
  productItemId: number; // ID của ProductItem (để lưu thông tin về màu sắc và giá)
  quantity: number; // Số lượng sản phẩm
  price: number; // Giá tại thời điểm đặt hàng
  originalPrice: number; // Giá gốc tại thời điểm đặt hàng
  color: string; // Màu sắc tại thời điểm đặt hàng
  productName: string; // Tên sản phẩm tại thời điểm đặt hàng
  itemName: string; // Tên biến thể sản phẩm tại thời điểm đặt hàng
  itemStatus: ProductItemStatus; // Trạng thái của ProductItem tại thời điểm đặt hàng
  subtotal: number; // Thành tiền (price * quantity)
  createdAt?: Date;
  updatedAt?: Date;
}

interface OrderItemCreationAttributes extends Optional<OrderItemAttributes, 'id' | 'subtotal'> {}

class OrderItem extends Model<OrderItemAttributes, OrderItemCreationAttributes> implements OrderItemAttributes {
  public id!: number;
  public orderId!: number;
  public productId!: number;
  public productItemId!: number;
  public quantity!: number;
  public price!: number;
  public originalPrice!: number;
  public color!: string;
  public productName!: string;
  public itemName!: string;
  public itemStatus!: ProductItemStatus;
  public subtotal!: number;
  public createdAt!: Date;
  public updatedAt!: Date;
}

OrderItem.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'orders',
        key: 'id',
      },
    },
    productId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id',
      },
    },
    productItemId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'product_items',
        key: 'id',
      },
    },
    quantity: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    originalPrice: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    color: {
      type: new DataTypes.STRING(64),
      allowNull: false,
    },
    productName: {
      type: new DataTypes.STRING(128),
      allowNull: false,
    },
    itemName: {
      type: new DataTypes.STRING(128),
      allowNull: false,
    },
    itemStatus: {
      type: DataTypes.ENUM(...Object.values(ProductItemStatus)),
      allowNull: false,
      defaultValue: ProductItemStatus.AVAILABLE,
    },
    subtotal: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
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
    tableName: 'order_items',
    sequelize,
    timestamps: true,
    indexes: [
      {
        fields: ['orderId'],
      },
      {
        fields: ['productId'],
      },
      {
        fields: ['productItemId'],
      },
    ],
    hooks: {
      beforeCreate: (orderItem: OrderItem) => {
        // Tự động tính toán subtotal khi tạo mới
        orderItem.subtotal = orderItem.price * orderItem.quantity;
      },
      beforeUpdate: (orderItem: OrderItem) => {
        // Tự động tính toán subtotal khi cập nhật
        orderItem.subtotal = orderItem.price * orderItem.quantity;
      },
    },
  }
);

// Thiết lập quan hệ với Order
OrderItem.belongsTo(Order, {
  foreignKey: 'orderId',
  as: 'order',
});

Order.hasMany(OrderItem, {
  sourceKey: 'id',
  foreignKey: 'orderId',
  as: 'items',
});

// Thiết lập quan hệ với Product
OrderItem.belongsTo(Product, {
  foreignKey: 'productId',
  as: 'product',
});

// Thiết lập quan hệ với ProductItem
OrderItem.belongsTo(ProductItem, {
  foreignKey: 'productItemId',
  as: 'productItem',
});

export default OrderItem; 