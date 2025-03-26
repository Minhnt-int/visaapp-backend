const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

// Cấu hình kết nối database
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

// Định nghĩa model ProductCategory
const ProductCategory = sequelize.define('ProductCategory', {
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
  parentId: {
    type: DataTypes.INTEGER.UNSIGNED,
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
}, {
  tableName: 'product_categories',
  timestamps: true,
});

// Tạo danh mục sản phẩm
async function createCategory() {
  try {
    console.log('Kết nối đến database...');
    await sequelize.authenticate();
    console.log('Kết nối thành công!');

    // Tạo danh mục sản phẩm mới
    const category = await ProductCategory.create({
      name: 'Danh mục quà tặng',
      description: 'Danh mục các sản phẩm quà tặng độc đáo',
    });

    console.log('Danh mục đã được tạo:', category.toJSON());
    process.exit(0);
  } catch (error) {
    console.error('Lỗi khi tạo danh mục:', error);
    process.exit(1);
  }
}

// Chạy tạo danh mục
createCategory(); 