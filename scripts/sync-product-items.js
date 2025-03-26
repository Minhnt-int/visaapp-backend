const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

// Cấu hình kết nối database giống như trong lib/db.ts
const sequelizeConfig = {
  dialect: 'mysql',
  host: '192.168.55.254',
  port: 3306,
  username: 'root',
  password: 'admin',
  database: 'duy',
  logging: console.log,
  timezone: "+07:00"
};

// Tạo instance Sequelize
const sequelize = new Sequelize(sequelizeConfig);

// Định nghĩa enum ProductItemStatus
const ProductItemStatus = {
  AVAILABLE: 'available',
  OUT_OF_STOCK: 'out_of_stock',
  DISCONTINUED: 'discontinued'
};

// Định nghĩa model ProductItem
const ProductItem = sequelize.define('ProductItem', {
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
  originalPrice: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
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
}, {
  tableName: 'product_items',
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
});

// Đồng bộ hóa model với cơ sở dữ liệu
async function syncProductItems() {
  try {
    console.log('Kết nối đến database...');
    await sequelize.authenticate();
    console.log('Kết nối thành công!');

    console.log('Đồng bộ hóa model ProductItem...');
    await ProductItem.sync({ force: true }); // force: true sẽ xóa bảng cũ nếu tồn tại và tạo mới
    console.log('Đã đồng bộ hóa ProductItem thành công!');
    process.exit(0);
  } catch (error) {
    console.error('Đồng bộ hóa thất bại:', error);
    process.exit(1);
  }
}

// Chạy đồng bộ hóa
syncProductItems(); 