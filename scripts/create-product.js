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

// Định nghĩa enum ProductItemStatus
const ProductItemStatus = {
  AVAILABLE: 'available',
  OUT_OF_STOCK: 'out_of_stock',
  DISCONTINUED: 'discontinued'
};

// Định nghĩa model Product
const Product = sequelize.define('Product', {
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
}, {
  tableName: 'products',
  timestamps: true,
});

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
});

// Định nghĩa model ProductMedia
const ProductMedia = sequelize.define('ProductMedia', {
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
  type: {
    type: DataTypes.ENUM('image', 'video'),
    allowNull: false,
    defaultValue: 'image',
  },
  url: {
    type: new DataTypes.STRING(512),
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
}, {
  tableName: 'product_media',
  timestamps: true,
});

// Thiết lập mối quan hệ
Product.hasMany(ProductItem, { foreignKey: 'productId', as: 'items' });
ProductItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

Product.hasMany(ProductMedia, { foreignKey: 'productId', as: 'media' });
ProductMedia.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// Dữ liệu sản phẩm mẫu
const productData = {
  name: "Quà Tặng Đặc Biệt",
  description: "Sản phẩm quà tặng đặc biệt dành cho các dịp lễ đặc biệt",
  categoryId: 2,
  slug: "qua-tang-dac-biet-" + Date.now(),
  items: [
    {
      name: "Phiên bản đặc biệt",
      color: "Đỏ",
      price: 200000,
      originalPrice: 250000,
      status: "available"
    },
    {
      name: "Phiên bản tiêu chuẩn",
      color: "Xanh",
      price: 150000,
      status: "available"
    }
  ],
  media: [
    {
      type: "image",
      url: "https://example.com/image-main.jpg"
    }
  ],
  metaTitle: "Quà Tặng Đặc Biệt - Shop Quà Tặng",
  metaDescription: "Sản phẩm quà tặng đặc biệt với nhiều phiên bản và màu sắc",
  metaKeywords: "quà tặng, đặc biệt, lễ"
};

// Tạo sản phẩm mới
async function createProduct() {
  try {
    console.log('Kết nối đến database...');
    await sequelize.authenticate();
    console.log('Kết nối thành công!');

    // Tạo transaction để đảm bảo tính toàn vẹn dữ liệu
    const transaction = await sequelize.transaction();

    try {
      // Tạo sản phẩm mới
      console.log('Đang tạo sản phẩm...');
      const product = await Product.create({
        name: productData.name,
        description: productData.description,
        categoryId: productData.categoryId,
        slug: productData.slug,
        metaTitle: productData.metaTitle,
        metaDescription: productData.metaDescription,
        metaKeywords: productData.metaKeywords
      }, { transaction });

      console.log('Sản phẩm đã được tạo, ID:', product.id);

      // Tạo các biến thể sản phẩm
      if (productData.items?.length > 0) {
        console.log('Đang tạo các biến thể sản phẩm...');
        for (const item of productData.items) {
          await ProductItem.create({
            productId: product.id,
            name: item.name,
            color: item.color,
            price: item.price,
            originalPrice: item.originalPrice || item.price,
            status: item.status || 'available'
          }, { transaction });
        }
      }

      // Tạo media cho sản phẩm
      if (productData.media?.length > 0) {
        console.log('Đang tạo media cho sản phẩm...');
        for (const mediaItem of productData.media) {
          await ProductMedia.create({
            productId: product.id,
            type: mediaItem.type,
            url: mediaItem.url
          }, { transaction });
        }
      }

      // Commit transaction nếu mọi thứ OK
      await transaction.commit();
      console.log('Transaction đã được commit thành công!');

      // Lấy sản phẩm với thông tin đầy đủ
      const productWithDetails = await Product.findByPk(product.id, {
        include: [
          { model: ProductItem, as: 'items' },
          { model: ProductMedia, as: 'media' }
        ]
      });

      console.log('Sản phẩm đã được tạo thành công:', JSON.stringify(productWithDetails, null, 2));
      process.exit(0);
    } catch (error) {
      // Rollback transaction nếu có lỗi
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Lỗi khi tạo sản phẩm:', error);
    process.exit(1);
  }
}

// Chạy tạo sản phẩm
createProduct(); 