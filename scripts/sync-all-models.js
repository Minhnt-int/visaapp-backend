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

// Định nghĩa các models

// 1. Product model
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

// 2. ProductCategory model
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
  slug: {
    type: new DataTypes.STRING(128),
    allowNull: false,
    unique: true,
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

// 3. ProductItem model
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

// 4. ProductMedia model
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

// Thiết lập quan hệ giữa các models
// Product - ProductCategory
Product.belongsTo(ProductCategory, {
  foreignKey: 'categoryId',
  as: 'category',
});

ProductCategory.hasMany(Product, {
  sourceKey: 'id',
  foreignKey: 'categoryId',
  as: 'products',
});

// Product - ProductItem
Product.hasMany(ProductItem, {
  sourceKey: 'id',
  foreignKey: 'productId',
  as: 'items',
});

ProductItem.belongsTo(Product, {
  foreignKey: 'productId',
  as: 'product',
});

// Product - ProductMedia
Product.hasMany(ProductMedia, {
  sourceKey: 'id',
  foreignKey: 'productId',
  as: 'media',
});

ProductMedia.belongsTo(Product, {
  foreignKey: 'productId',
  as: 'product',
});

// ProductCategory - Self (Parent/Child)
ProductCategory.belongsTo(ProductCategory, {
  foreignKey: 'parentId',
  as: 'parent',
});

ProductCategory.hasMany(ProductCategory, {
  sourceKey: 'id',
  foreignKey: 'parentId',
  as: 'children',
});

// Hàm tạo dữ liệu mẫu
async function createSampleData() {
  try {
    console.log('Tạo dữ liệu mẫu...');

    // 1. Tạo danh mục sản phẩm
    const categories = await ProductCategory.bulkCreate([
      {
        name: 'Đồ chơi',
        slug: 'do-choi',
        description: 'Các loại đồ chơi cho trẻ em',
      },
      {
        name: 'Sách',
        slug: 'sach',
        description: 'Sách truyện và sách học tập',
      },
      {
        name: 'Quần áo',
        slug: 'quan-ao',
        description: 'Quần áo trẻ em',
      },
    ]);

    // 2. Tạo sản phẩm
    const products = await Product.bulkCreate([
      {
        name: 'Búp bê Barbie',
        slug: 'bup-be-barbie',
        description: 'Búp bê Barbie cao cấp',
        categoryId: categories[0].id,
        metaTitle: 'Búp bê Barbie - Đồ chơi trẻ em',
        metaDescription: 'Búp bê Barbie cao cấp cho trẻ em',
        metaKeywords: 'bup be, barbie, do choi tre em',
      },
      {
        name: 'Truyện cổ tích',
        slug: 'truyen-co-tich',
        description: 'Tuyển tập truyện cổ tích Việt Nam',
        categoryId: categories[1].id,
        metaTitle: 'Truyện cổ tích Việt Nam',
        metaDescription: 'Tuyển tập truyện cổ tích Việt Nam',
        metaKeywords: 'truyen co tich, sach tre em',
      },
      {
        name: 'Áo thun nam',
        slug: 'ao-thun-nam',
        description: 'Áo thun nam trẻ em',
        categoryId: categories[2].id,
        metaTitle: 'Áo thun nam trẻ em',
        metaDescription: 'Áo thun nam trẻ em chất lượng cao',
        metaKeywords: 'ao thun, quan ao tre em',
      },
    ]);

    // 3. Tạo biến thể sản phẩm
    await ProductItem.bulkCreate([
      {
        productId: products[0].id,
        name: 'Barbie Classic',
        color: 'Hồng',
        price: 299000,
        originalPrice: 399000,
        status: ProductItemStatus.AVAILABLE,
      },
      {
        productId: products[0].id,
        name: 'Barbie Princess',
        color: 'Tím',
        price: 349000,
        originalPrice: 449000,
        status: ProductItemStatus.AVAILABLE,
      },
      {
        productId: products[1].id,
        name: 'Truyện cổ tích - Bản đặc biệt',
        color: 'Nhiều màu',
        price: 199000,
        originalPrice: 249000,
        status: ProductItemStatus.AVAILABLE,
      },
      {
        productId: products[2].id,
        name: 'Áo thun nam - Size S',
        color: 'Xanh',
        price: 159000,
        originalPrice: 199000,
        status: ProductItemStatus.AVAILABLE,
      },
      {
        productId: products[2].id,
        name: 'Áo thun nam - Size M',
        color: 'Xanh',
        price: 159000,
        originalPrice: 199000,
        status: ProductItemStatus.AVAILABLE,
      },
    ]);

    // 4. Tạo media cho sản phẩm
    await ProductMedia.bulkCreate([
      {
        productId: products[0].id,
        type: 'image',
        url: 'https://example.com/images/barbie-classic.jpg',
      },
      {
        productId: products[0].id,
        type: 'image',
        url: 'https://example.com/images/barbie-princess.jpg',
      },
      {
        productId: products[1].id,
        type: 'image',
        url: 'https://example.com/images/truyen-co-tich.jpg',
      },
      {
        productId: products[2].id,
        type: 'image',
        url: 'https://example.com/images/ao-thun-nam.jpg',
      },
    ]);

    console.log('Đã tạo dữ liệu mẫu thành công!');
  } catch (error) {
    console.error('Lỗi khi tạo dữ liệu mẫu:', error);
    throw error;
  }
}

// Đồng bộ hóa models với cơ sở dữ liệu
async function syncAllModels() {
  try {
    console.log('Kết nối đến database...');
    await sequelize.authenticate();
    console.log('Kết nối thành công!');

    console.log('Đồng bộ hóa tất cả models...');
    
    // Đồng bộ hóa lần lượt từng model theo thứ tự để đảm bảo quan hệ khóa ngoại
    console.log('1. Đồng bộ hóa ProductCategory...');
    await ProductCategory.sync({ alter: true });
    
    console.log('2. Đồng bộ hóa Product...');
    await Product.sync({ alter: true });
    
    console.log('3. Đồng bộ hóa ProductItem...');
    await ProductItem.sync({ alter: true });
    
    console.log('4. Đồng bộ hóa ProductMedia...');
    await ProductMedia.sync({ alter: true });
    
    console.log('Đã đồng bộ hóa tất cả models thành công!');

    // Tạo dữ liệu mẫu sau khi đồng bộ hóa
    await createSampleData();

    process.exit(0);
  } catch (error) {
    console.error('Đồng bộ hóa thất bại:', error);
    process.exit(1);
  }
}

// Chạy đồng bộ hóa
syncAllModels(); 