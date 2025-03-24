import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../lib/db';
import User from './User';

// Định nghĩa các trạng thái đơn hàng
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  SHIPPING = 'shipping',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

interface OrderAttributes {
  id: number;
  userId?: number | null; // ID người dùng (nếu đăng nhập)
  recipientName: string; // Tên người nhận
  recipientPhone: string; // Số điện thoại người nhận
  recipientAddress: string; // Địa chỉ nhận hàng
  totalAmount: number; // Tổng tiền đơn hàng
  status: OrderStatus; // Trạng thái đơn hàng
  notes?: string; // Ghi chú đơn hàng
  createdAt?: Date;
  updatedAt?: Date;
}

interface OrderCreationAttributes extends Optional<OrderAttributes, 'id'> {}

class Order extends Model<OrderAttributes, OrderCreationAttributes> implements OrderAttributes {
  public id!: number;
  public userId?: number | null;
  public recipientName!: string;
  public recipientPhone!: string;
  public recipientAddress!: string;
  public totalAmount!: number;
  public status!: OrderStatus;
  public notes?: string;
  public createdAt!: Date;
  public updatedAt!: Date;
}

Order.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    recipientName: {
      type: new DataTypes.STRING(128),
      allowNull: false,
    },
    recipientPhone: {
      type: new DataTypes.STRING(20),
      allowNull: false,
    },
    recipientAddress: {
      type: new DataTypes.STRING(256),
      allowNull: false,
    },
    totalAmount: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(OrderStatus)),
      allowNull: false,
      defaultValue: OrderStatus.PENDING,
    },
    notes: {
      type: new DataTypes.STRING(512),
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
    tableName: 'orders',
    sequelize,
    timestamps: true,
    indexes: [
      {
        fields: ['userId'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['createdAt'],
      },
    ],
  }
);

// Thiết lập quan hệ với User
Order.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

User.hasMany(Order, {
  sourceKey: 'id',
  foreignKey: 'userId',
  as: 'orders',
});

export default Order; 