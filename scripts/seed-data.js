const { Sequelize, DataTypes, Op } = require('sequelize');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const moment = require('moment');

// Đọc tham số từ dòng lệnh
const args = process.argv.slice(2);
const helpMode = args.includes('--help') || args.includes('-h');

// Hiển thị hướng dẫn sử dụng
if (helpMode) {
  console.log(`
  Usage: node scripts/seed-data.js [OPTIONS]
  
  Options:
    -h, --help     Hiển thị hướng dẫn sử dụng này
  
  Chạy script này để tạo dữ liệu mẫu cho tất cả các bảng trong database.
  `);
  process.exit(0);
}

// Cấu hình kết nối database
const sequelizeConfig = {
  dialect: 'mysql',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  logging: console.log,
  timezone: process.env.DB_TIMEZONE || "+07:00"
};

// Kiểm tra các biến môi trường bắt buộc
const requiredEnvVars = ['DB_HOST', 'DB_USERNAME', 'DB_PASSWORD', 'DB_DATABASE'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Lỗi: Thiếu các biến môi trường bắt buộc:', missingEnvVars.join(', '));
  process.exit(1);
}

// Tạo instance Sequelize
const sequelize = new Sequelize(sequelizeConfig);

// Định nghĩa enum ProductItemStatus
const ProductItemStatus = {
  AVAILABLE: 'available',
  OUT_OF_STOCK: 'out_of_stock',
  DISCONTINUED: 'discontinued'
};

// Định nghĩa enum OrderStatus
const OrderStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};

// Định nghĩa ProductStatus
const ProductStatus = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  DELETED: 'deleted'
};

// Định nghĩa BlogStatus
const BlogStatus = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  DELETED: 'deleted'
};

// Định nghĩa User model
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: new DataTypes.STRING(128),
    allowNull: false,
  },
  email: {
    type: new DataTypes.STRING(128),
    allowNull: false,
    unique: true,
  },
  password: {
    type: new DataTypes.STRING(256),
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    allowNull: false,
    defaultValue: 'user',
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
  tableName: 'users',
  timestamps: true,
});

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
  shortDescription: {
    type: new DataTypes.STRING(512),
    allowNull: true,
  },
  categoryId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
  avatarUrl: {
    type: new DataTypes.STRING(512),
    allowNull: true,
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
  avatarUrl: {
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
  },
  url: {
    type: new DataTypes.STRING(512),
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('image', 'video'),
    allowNull: false,
    defaultValue: 'image',
  },
  altText: {
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
}, {
  tableName: 'product_media',
  timestamps: true,
});

// 5. BlogCategory model
const BlogCategory = sequelize.define('BlogCategory', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: new DataTypes.STRING(256),
    allowNull: false,
  },
  slug: {
    type: new DataTypes.STRING(256),
    allowNull: false,
    unique: true,
  },
  avatarUrl: {
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
}, {
  tableName: 'blog_categories',
  timestamps: true,
  indexes: [
    {
      fields: ['name'],
    },
    {
      fields: ['slug'],
      unique: true,
    },
  ],
});

// 6. BlogPost model
const BlogPost = sequelize.define('BlogPost', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: new DataTypes.STRING(256),
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  slug: {
    type: new DataTypes.STRING(256),
    allowNull: false,
    unique: true,
  },
  metaTitle: {
    type: new DataTypes.STRING(256),
    allowNull: true,
  },
  metaDescription: {
    type: new DataTypes.STRING(512),
    allowNull: true,
  },
  metaKeywords: {
    type: new DataTypes.STRING(256),
    allowNull: true,
  },
  author: {
    type: new DataTypes.STRING(128),
    allowNull: false,
  },
  publishedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  viewCount: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  blogCategoryId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
  avatarUrl: {
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
}, {
  tableName: 'blog_posts',
  timestamps: true,
  indexes: [
    {
      fields: ['slug'],
    },
    {
      fields: ['title'],
    },
    {
      fields: ['blogCategoryId'],
    },
  ],
});

// 7. Media model (mới)
const Media = sequelize.define('Media', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: new DataTypes.STRING(255),
    allowNull: false,
  },
  url: {
    type: new DataTypes.STRING(512),
    allowNull: false,
  },
  altText: {
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
  }
}, {
  tableName: 'media',
  timestamps: true,
  underscored: true,
});

// 8. Order model
const Order = sequelize.define('Order', {
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
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM(...Object.values(OrderStatus)),
    allowNull: false,
    defaultValue: OrderStatus.PENDING,
  },
  totalAmount: {
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
}, {
  tableName: 'orders',
  timestamps: true,
});

// 9. OrderItem model
const OrderItem = sequelize.define('OrderItem', {
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
    type: DataTypes.INTEGER,
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
  },
  color: {
    type: DataTypes.STRING(64),
    allowNull: false,
  },
  productName: {
    type: DataTypes.STRING(128),
    allowNull: false,
  },
  itemName: {
    type: DataTypes.STRING(128),
    allowNull: false,
  },
  itemStatus: {
    type: DataTypes.STRING(64),
    allowNull: false,
  },
  subtotal: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.getDataValue('price') * this.getDataValue('quantity');
    },
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
  tableName: 'order_items',
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

// BlogPost - BlogCategory
BlogPost.belongsTo(BlogCategory, {
  foreignKey: 'blogCategoryId',
  as: 'category',
});

BlogCategory.hasMany(BlogPost, {
  sourceKey: 'id',
  foreignKey: 'blogCategoryId',
  as: 'posts',
});

// Order - User
Order.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

User.hasMany(Order, {
  sourceKey: 'id',
  foreignKey: 'userId',
  as: 'orders',
});

// Order - OrderItem
Order.hasMany(OrderItem, {
  sourceKey: 'id',
  foreignKey: 'orderId',
  as: 'items',
});

OrderItem.belongsTo(Order, {
  foreignKey: 'orderId',
  as: 'order',
});

// OrderItem - Product
OrderItem.belongsTo(Product, {
  foreignKey: 'productId',
  as: 'product',
});

// OrderItem - ProductItem
OrderItem.belongsTo(ProductItem, {
  foreignKey: 'productItemId',
  as: 'productItem',
});

// Hàm tạo dữ liệu mẫu
async function seedData() {
  try {
    await sequelize.authenticate();
    console.log('Kết nối database thành công.');

    // Đảm bảo thư mục uploads tồn tại
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('Đã tạo thư mục uploads');
    }

    // Kiểm tra dữ liệu đã tồn tại trước khi tạo mới
    const existingCategories = await ProductCategory.findAll();
    if (existingCategories.length > 0) {
      console.log('Dữ liệu danh mục sản phẩm đã tồn tại. Bỏ qua việc tạo dữ liệu mẫu cho danh mục.');
      var categories = existingCategories;
    } else {
      console.log('Tạo danh mục sản phẩm cấp 1...');
      // 1. Tạo danh mục sản phẩm cấp 1 (parent categories)
      categories = await ProductCategory.bulkCreate([
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
        {
          name: 'Đồ điện tử',
          slug: 'do-dien-tu',
          description: 'Các sản phẩm điện tử giải trí cho trẻ',
        },
      ]);

      console.log('Tạo danh mục sản phẩm cấp 2...');
      // 2. Tạo danh mục sản phẩm cấp 2 (subcategories)
      var subCategories = await ProductCategory.bulkCreate([
        {
          name: 'Búp bê',
          slug: 'bup-be',
          description: 'Các loại búp bê thời trang',
          parentId: categories[0].id, // Thuộc Đồ chơi
        },
        {
          name: 'Đồ chơi mô hình',
          slug: 'do-choi-mo-hinh',
          description: 'Các loại đồ chơi mô hình',
          parentId: categories[0].id, // Thuộc Đồ chơi
        },
        {
          name: 'Sách thiếu nhi',
          slug: 'sach-thieu-nhi',
          description: 'Sách dành cho trẻ em',
          parentId: categories[1].id, // Thuộc Sách
        },
        {
          name: 'Truyện tranh',
          slug: 'truyen-tranh',
          description: 'Các loại truyện tranh',
          parentId: categories[1].id, // Thuộc Sách
        },
        {
          name: 'Áo',
          slug: 'ao',
          description: 'Các loại áo cho trẻ em',
          parentId: categories[2].id, // Thuộc Quần áo
        },
        {
          name: 'Quần',
          slug: 'quan',
          description: 'Các loại quần cho trẻ em',
          parentId: categories[2].id, // Thuộc Quần áo
        },
        {
          name: 'Máy chơi game',
          slug: 'may-choi-game',
          description: 'Các loại máy chơi game',
          parentId: categories[3].id, // Thuộc Đồ điện tử
        },
        {
          name: 'Đồ chơi điện tử thông minh',
          slug: 'do-choi-dien-tu-thong-minh',
          description: 'Các loại đồ chơi điện tử thông minh',
          parentId: categories[3].id, // Thuộc Đồ điện tử
        },
      ]);
    }

    // Kiểm tra sản phẩm đã tồn tại
    const existingProducts = await Product.findAll();
    if (existingProducts.length > 0) {
      console.log('Dữ liệu sản phẩm đã tồn tại. Bỏ qua việc tạo dữ liệu mẫu cho sản phẩm.');
      var products = existingProducts;
    } else {
      // Nếu chưa có subcategories (trong trường hợp categories đã tồn tại), lấy subcategories từ database
      if (!subCategories) {
        const existingSubCategories = await ProductCategory.findAll({
          where: {
            parentId: {
              [Op.ne]: null
            }
          }
        });
        
        if (existingSubCategories.length === 0) {
          console.log('Không tìm thấy danh mục cấp 2. Bỏ qua việc tạo sản phẩm.');
          return;
        }
        
        subCategories = existingSubCategories;
      }
      
      // 3. Tạo sản phẩm với categoryId từ danh mục cấp 2
      console.log('Tạo sản phẩm mẫu với danh mục cấp 2...');
      products = await Product.bulkCreate([
        {
          name: 'Búp bê Barbie',
          slug: 'bup-be-barbie',
          description: 'Búp bê Barbie cao cấp',
          shortDescription: 'Búp bê Barbie phiên bản mới nhất 2024',
          categoryId: subCategories[0].id, // Búp bê
          metaTitle: 'Búp bê Barbie - Đồ chơi trẻ em',
          metaDescription: 'Búp bê Barbie cao cấp cho trẻ em',
          metaKeywords: 'bup be, barbie, do choi tre em',
          status: ProductStatus.ACTIVE,
        },
        {
          name: 'Truyện cổ tích',
          slug: 'truyen-co-tich',
          description: 'Tuyển tập truyện cổ tích Việt Nam',
          shortDescription: 'Bộ sưu tập các câu chuyện cổ tích Việt Nam hay nhất',
          categoryId: subCategories[2].id, // Sách thiếu nhi
          metaTitle: 'Truyện cổ tích Việt Nam',
          metaDescription: 'Tuyển tập truyện cổ tích Việt Nam',
          metaKeywords: 'truyen co tich, sach tre em',
          status: ProductStatus.ACTIVE,
        },
        {
          name: 'Áo thun nam',
          slug: 'ao-thun-nam',
          description: 'Áo thun nam trẻ em',
          shortDescription: 'Áo thun nam trẻ em chất liệu cotton thoáng mát',
          categoryId: subCategories[4].id, // Áo
          metaTitle: 'Áo thun nam trẻ em',
          metaDescription: 'Áo thun nam trẻ em chất lượng cao',
          metaKeywords: 'ao thun, quan ao tre em',
          status: ProductStatus.ACTIVE,
        },
        {
          name: 'Máy chơi game cầm tay',
          slug: 'may-choi-game-cam-tay',
          description: 'Máy chơi game cầm tay mini với hơn 400 trò chơi',
          shortDescription: 'Máy chơi game cầm tay phù hợp cho trẻ từ 6 tuổi trở lên',
          categoryId: subCategories[6].id, // Máy chơi game
          metaTitle: 'Máy chơi game cầm tay mini',
          metaDescription: 'Máy chơi game cầm tay mini với hơn 400 trò chơi cổ điển',
          metaKeywords: 'game, máy chơi game, đồ điện tử trẻ em',
          status: ProductStatus.DRAFT,
        },
      ]);
    }

    // Kiểm tra biến thể sản phẩm đã tồn tại
    const existingProductItems = await ProductItem.findAll();
    if (existingProductItems.length > 0) {
      console.log('Dữ liệu biến thể sản phẩm đã tồn tại. Bỏ qua việc tạo dữ liệu mẫu cho biến thể sản phẩm.');
      var productItems = existingProductItems;
    } else {
      // 3. Tạo biến thể sản phẩm
      productItems = await ProductItem.bulkCreate([
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
        {
          productId: products[3].id,
          name: 'Máy chơi game mini - Màu xanh',
          color: 'Xanh',
          price: 499000, 
          originalPrice: 599000,
          status: ProductItemStatus.AVAILABLE,
        },
        {
          productId: products[3].id,
          name: 'Máy chơi game mini - Màu đỏ',
          color: 'Đỏ',
          price: 499000,
          originalPrice: 599000,
          status: ProductItemStatus.AVAILABLE,
        },
      ]);
    }

    // Kiểm tra media đã tồn tại
    const existingMedia = await Media.findAll();
    if (existingMedia.length > 0) {
      console.log('Dữ liệu media đã tồn tại. Bỏ qua việc tạo dữ liệu mẫu cho media.');
      var mediaEntries = existingMedia;
    } else {
      console.log('Tạo dữ liệu Media mẫu...');
      // Tạo dữ liệu Media mẫu
      mediaEntries = await Media.bulkCreate([
        {
          name: 'product_media_1',
          url: '/uploads/product_1_media_1.jpg',
          altText: 'Product 1 media 1',
          type: 'image',
        },
        {
          name: 'product_media_2',
          url: '/uploads/product_1_media_2.jpg',
          altText: 'Product 1 media 2',
          type: 'image',
        },
        {
          name: 'product_media_3',
          url: '/uploads/product_2_media_3.jpg',
          altText: 'Product 2 media 3',
          type: 'image',
        },
        {
          name: 'product_media_4',
          url: '/uploads/product_3_media_4.jpg',
          altText: 'Product 3 media 4',
          type: 'image',
        },
        {
          name: 'product_media_5',
          url: '/uploads/product_4_media_5.jpg',
          altText: 'Product 4 media 5',
          type: 'image',
        },
        {
          name: 'product_media_6',
          url: '/uploads/product_4_media_6.jpg',
          altText: 'Product 4 media 6',
          type: 'video',
        },
        {
          name: 'product_category_1',
          url: '/uploads/category_toys.jpg',
          altText: 'Danh mục đồ chơi',
          type: 'image',
        },
        {
          name: 'product_category_2',
          url: '/uploads/category_books.jpg',
          altText: 'Danh mục sách',
          type: 'image',
        },
        {
          name: 'product_category_3',
          url: '/uploads/category_clothes.jpg',
          altText: 'Danh mục quần áo',
          type: 'image',
        },
        {
          name: 'product_category_4',
          url: '/uploads/category_electronics.jpg',
          altText: 'Danh mục điện tử',
          type: 'image',
        },
        {
          name: 'blog_category_1',
          url: '/uploads/blog_category_news.jpg',
          altText: 'Danh mục tin tức',
          type: 'image',
        },
        {
          name: 'blog_category_2',
          url: '/uploads/blog_category_promotion.jpg',
          altText: 'Danh mục khuyến mãi',
          type: 'image',
        },
        {
          name: 'blog_post_1',
          url: '/uploads/blog_post_gift_guide.jpg',
          altText: 'Bài viết cách chọn quà',
          type: 'image',
        },
        {
          name: 'blog_post_2',
          url: '/uploads/blog_post_top_gifts.jpg',
          altText: 'Bài viết top quà tặng',
          type: 'image',
        },
        {
          name: 'banner-home-1.jpg',
          url: '/uploads/banner-home-1.jpg',
          altText: 'Banner trang chủ khuyến mãi mùa hè',
          type: 'image',
        },
        {
          name: 'banner-home-2.jpg',
          url: '/uploads/banner-home-2.jpg',
          altText: 'Banner trang chủ sản phẩm mới',
          type: 'image',
        },
        {
          name: 'logo.png',
          url: '/uploads/logo.png',
          altText: 'Logo website',
          type: 'image',
        },
        {
          name: 'product-placeholder.jpg',
          url: '/uploads/product-placeholder.jpg',
          altText: 'Hình ảnh mặc định cho sản phẩm',
          type: 'image',
        }
      ]);
      console.log(`- Đã tạo ${mediaEntries.length} bản ghi media.`);
    }

    // Cập nhật Product với avatarUrl
    if (products && products.length > 0 && mediaEntries && mediaEntries.length > 0) {
      console.log('Cập nhật avatarUrl cho sản phẩm...');
      await Promise.all([
        products[0].update({ avatarUrl: mediaEntries[0].url }), // Búp bê Barbie -> product_media_1
        products[1].update({ avatarUrl: mediaEntries[2].url }), // Truyện cổ tích -> product_media_3
        products[2].update({ avatarUrl: mediaEntries[3].url }), // Áo thun nam -> product_media_4
        products[3].update({ avatarUrl: mediaEntries[4].url })  // Máy chơi game -> product_media_5
      ]);
      console.log('- Đã cập nhật avatarUrl cho sản phẩm.');
    }

    // Cập nhật ProductCategory với avatarUrl
    if (categories && categories.length > 0 && mediaEntries && mediaEntries.length > 0) {
      console.log('Cập nhật avatarUrl cho danh mục sản phẩm...');
      await Promise.all([
        categories[0].update({ avatarUrl: mediaEntries[6].url }), // Đồ chơi -> product_category_1
        categories[1].update({ avatarUrl: mediaEntries[7].url }), // Sách -> product_category_2
        categories[2].update({ avatarUrl: mediaEntries[8].url }), // Quần áo -> product_category_3
        categories[3].update({ avatarUrl: mediaEntries[9].url })  // Đồ điện tử -> product_category_4
      ]);
      console.log('- Đã cập nhật avatarUrl cho danh mục sản phẩm.');
    }

    // Kiểm tra danh mục blog đã tồn tại
    const existingBlogCategories = await BlogCategory.findAll();
    if (existingBlogCategories.length > 0) {
      console.log('Dữ liệu danh mục blog đã tồn tại. Bỏ qua việc tạo dữ liệu mẫu cho danh mục blog.');
      var blogCategories = existingBlogCategories;
    } else {
      console.log('Tạo danh mục blog mẫu...');
      // Tạo danh mục blog mẫu
      blogCategories = await BlogCategory.bulkCreate([
        {
          name: 'Tin tức',
          slug: 'tin-tuc',
          status: 'active',
        },
        {
          name: 'Khuyến mãi',
          slug: 'khuyen-mai',
          status: 'active',
        },
        {
          name: 'Hướng dẫn',
          slug: 'huong-dan',
          status: 'active',
        },
        {
          name: 'Review sản phẩm',
          slug: 'review-san-pham',
          status: 'active',
        }
      ]);
      console.log(`- Đã tạo ${blogCategories.length} danh mục blog.`);
    }

    // Cập nhật BlogCategory với avatarUrl
    if (blogCategories && blogCategories.length > 0 && mediaEntries && mediaEntries.length > 0) {
      console.log('Cập nhật avatarUrl cho danh mục blog...');
      await Promise.all([
        blogCategories[0].update({ avatarUrl: mediaEntries[10].url }), // Tin tức -> blog_category_1
        blogCategories[1].update({ avatarUrl: mediaEntries[11].url }),  // Khuyến mãi -> blog_category_2
        blogCategories[2].update({ avatarUrl: mediaEntries[12].url }),  // Hướng dẫn -> blog_category_3
        blogCategories[3].update({ avatarUrl: mediaEntries[13].url })  // Review sản phẩm -> blog_category_4
      ]);
      console.log('- Đã cập nhật avatarUrl cho danh mục blog.');
    }

    // Kiểm tra ProductMedia đã tồn tại
    const existingProductMedia = await ProductMedia.findAll({
      attributes: ['id', 'productId', 'type', 'url', 'createdAt', 'updatedAt']
    });
    if (existingProductMedia.length === 0 && products && products.length > 0 && mediaEntries && mediaEntries.length > 0) {
      console.log('Tạo dữ liệu ProductMedia mới...');
      await ProductMedia.bulkCreate([
        {
          productId: products[0].id, // Búp bê Barbie
          type: 'image',
          url: mediaEntries[0].url, // product_media_1
          altText: mediaEntries[0].altText
        },
        {
          productId: products[0].id, // Búp bê Barbie
          type: 'image',
          url: mediaEntries[1].url, // product_media_2
          altText: mediaEntries[1].altText
        },
        {
          productId: products[1].id, // Truyện cổ tích
          type: 'image',
          url: mediaEntries[2].url, // product_media_3
          altText: mediaEntries[2].altText
        },
        {
          productId: products[2].id, // Áo thun nam
          type: 'image',
          url: mediaEntries[3].url, // product_media_4
          altText: mediaEntries[3].altText
        },
        {
          productId: products[3].id, // Máy chơi game
          type: 'image',
          url: mediaEntries[4].url, // product_media_5
          altText: mediaEntries[4].altText
        },
        {
          productId: products[3].id, // Máy chơi game
          type: 'video',
          url: mediaEntries[5].url, // product_media_6
          altText: mediaEntries[5].altText
        }
      ]);
      console.log('- Đã tạo dữ liệu ProductMedia.');
    }

    // Kiểm tra bài viết blog đã tồn tại
    const existingBlogPosts = await BlogPost.findAll();
    if (existingBlogPosts.length > 0 && mediaEntries && mediaEntries.length > 0) {
      console.log('Cập nhật avatarUrl cho bài viết blog...');
      
      // Kiểm tra xem có đủ media entries không
      if (existingBlogPosts.length >= 2 && mediaEntries.length >= 14) {
        await Promise.all([
          existingBlogPosts[0].update({ avatarUrl: mediaEntries[12].url }), // Bài viết 1 -> blog_post_1
          existingBlogPosts[1].update({ avatarUrl: mediaEntries[13].url }),  // Bài viết 2 -> blog_post_2
          existingBlogPosts[2].update({ avatarUrl: mediaEntries[14].url }),  // Bài viết 3 -> blog_post_3
          existingBlogPosts[3].update({ avatarUrl: mediaEntries[15].url })  // Bài viết 4 -> blog_post_4
        ]);
        console.log('- Đã cập nhật avatarUrl cho bài viết blog.');
      } else {
        console.log('- Không đủ media entries để cập nhật blog posts.');
      }
    } else if (existingBlogPosts.length === 0) {
      console.log('Tạo bài viết blog mẫu với avatarUrl...');
      // Tạo bài viết blog mẫu với avatarUrl
      
      // Xác định blogCategoryId dựa trên các danh mục đã tạo
      const blogCategoryIds = [];
      if (blogCategories && blogCategories.length > 0) {
        for (let i = 0; i < blogCategories.length; i++) {
          blogCategoryIds.push(blogCategories[i].id);
        }
      }
      
      // Đảm bảo có ít nhất một danh mục
      if (blogCategoryIds.length === 0) {
        console.log('Không tìm thấy danh mục blog nào. Bỏ qua việc tạo bài viết blog.');
        return;
      }
      
      await BlogPost.bulkCreate([
        {
          title: 'Bật mí cách chọn quà tặng ý nghĩa cho người thân',
          content: '<p>Bài viết này sẽ giúp bạn hiểu cách chọn quà tặng ý nghĩa cho người thân yêu...</p><p>Khi chọn quà, bạn nên quan tâm đến sở thích của người nhận...</p>',
          slug: 'bat-mi-cach-chon-qua-tang-y-nghia',
          metaTitle: 'Cách chọn quà tặng ý nghĩa cho người thân',
          metaDescription: 'Bài viết chia sẻ những bí quyết chọn quà tặng ý nghĩa cho người thân yêu dịp đặc biệt',
          metaKeywords: 'quà tặng, ý nghĩa, người thân, bí quyết',
          author: 'Admin',
          publishedAt: new Date(),
          viewCount: 45,
          blogCategoryId: blogCategoryIds[0],
          avatarUrl: mediaEntries[12].url // blog_post_1
        },
        {
          title: 'Top 10 món quà được yêu thích nhất năm 2023',
          content: '<p>Năm 2023 đã chứng kiến nhiều xu hướng quà tặng mới...</p><p>Dưới đây là top 10 món quà được yêu thích nhất...</p>',
          slug: 'top-10-mon-qua-duoc-yeu-thich-nhat-nam-2023',
          metaTitle: 'Top 10 món quà được yêu thích nhất năm 2023',
          metaDescription: 'Khám phá những món quà tặng được yêu thích nhất trong năm 2023',
          metaKeywords: 'quà tặng, top 10, xu hướng, 2023',
          author: 'Admin',
          publishedAt: new Date(),
          viewCount: 128,
          blogCategoryId: blogCategoryIds[Math.min(blogCategoryIds.length - 1, 3)],
          avatarUrl: mediaEntries[13].url // blog_post_2
        },
        {
          title: 'Khuyến mãi đặc biệt dịp Tết Dương lịch 2024',
          content: '<p>Nhân dịp Tết Dương lịch 2024, chúng tôi có nhiều chương trình khuyến mãi đặc biệt...</p><p>Giảm giá lên đến 50% cho nhiều sản phẩm...</p>',
          slug: 'khuyen-mai-dac-biet-dip-tet-duong-lich-2024',
          metaTitle: 'Khuyến mãi đặc biệt dịp Tết Dương lịch 2024',
          metaDescription: 'Thông tin về chương trình khuyến mãi đặc biệt dịp Tết Dương lịch 2024',
          metaKeywords: 'khuyến mãi, Tết Dương lịch, 2024, giảm giá',
          author: 'Admin',
          publishedAt: new Date(),
          viewCount: 256,
          blogCategoryId: blogCategoryIds[Math.min(blogCategoryIds.length - 1, 1)]
        },
        {
          title: 'Hướng dẫn gói quà đẹp và độc đáo',
          content: '<p>Bài viết này sẽ hướng dẫn bạn cách gói những món quà đẹp và độc đáo...</p><p>Với một chút sáng tạo, bạn có thể gói quà theo nhiều phong cách khác nhau...</p>',
          slug: 'huong-dan-goi-qua-dep-va-doc-dao',
          metaTitle: 'Hướng dẫn gói quà đẹp và độc đáo',
          metaDescription: 'Học cách gói quà đẹp và độc đáo với các kỹ thuật gói quà sáng tạo',
          metaKeywords: 'gói quà, hướng dẫn, sáng tạo, độc đáo',
          author: 'Admin',
          publishedAt: new Date(),
          viewCount: 78,
          blogCategoryId: blogCategoryIds[Math.min(blogCategoryIds.length - 1, 2)]
        }
      ]);
      console.log('- Đã tạo bài viết blog mẫu với avatarUrl.');
    }

    // Kiểm tra đơn hàng đã tồn tại
    const existingOrders = await Order.findAll();
    if (existingOrders.length > 0) {
      console.log('Dữ liệu đơn hàng đã tồn tại. Bỏ qua việc tạo dữ liệu mẫu cho đơn hàng.');
    } else {
      console.log('- Tạo dữ liệu người dùng và đơn hàng...');
      
      // Kiểm tra người dùng đã tồn tại
      const existingUsers = await User.findAll();
      if (existingUsers.length > 0) {
        console.log('Dữ liệu người dùng đã tồn tại. Sử dụng người dùng hiện có.');
        var users = existingUsers;
      } else {
        console.log('Tạo dữ liệu người dùng mẫu...');
        // Tạo dữ liệu người dùng
        users = await User.bulkCreate([
          {
            name: 'Admin',
            email: 'admin@example.com',
            password: await bcrypt.hash('admin123', 10),
            role: 'admin',
          },
          {
            name: 'Test User',
            email: 'user@example.com',
            password: await bcrypt.hash('user123', 10),
            role: 'user',
          },
        ]);
        console.log(`- Đã tạo ${users.length} người dùng.`);
      }
      
      // Tạo orders
      const orders = await Order.bulkCreate([
        {
          userId: users && users.length > 1 ? users[1].id : null, // Test User hoặc null
          recipientName: 'Nguyễn Văn A',
          recipientPhone: '0123456789',
          recipientAddress: '123 Đường ABC, Quận 1, TP HCM',
          notes: 'Giao hàng giờ hành chính',
          status: OrderStatus.DELIVERED,
          totalAmount: 299000,
          createdAt: new Date(Date.now() - 864000000), // 10 ngày trước
          updatedAt: new Date(Date.now() - 864000000)
        },
        {
          userId: users && users.length > 1 ? users[1].id : null, // Test User hoặc null
          recipientName: 'Nguyễn Văn A',
          recipientPhone: '0123456789',
          recipientAddress: '123 Đường ABC, Quận 1, TP HCM',
          notes: 'Gọi trước khi giao',
          status: OrderStatus.PENDING,
          totalAmount: 159000,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          userId: null, // Khách không đăng nhập
          recipientName: 'Trần Thị B',
          recipientPhone: '0987654321',
          recipientAddress: '456 Đường XYZ, Quận 2, TP HCM',
          notes: '',
          status: OrderStatus.PROCESSING,
          totalAmount: 199000,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);
      
      // Tạo order items
      await OrderItem.bulkCreate([
        {
          orderId: orders[0].id, // Đơn hàng đầu tiên
          productId: products[0].id, // Búp bê Barbie
          productItemId: productItems[0].id, // Barbie Classic
          quantity: 1,
          price: 299000,
          originalPrice: 399000,
          color: 'Hồng',
          productName: 'Búp bê Barbie',
          itemName: 'Barbie Classic',
          itemStatus: ProductItemStatus.AVAILABLE,
          createdAt: new Date(Date.now() - 864000000), // 10 ngày trước
          updatedAt: new Date(Date.now() - 864000000)
        },
        {
          orderId: orders[1].id, // Đơn hàng thứ hai
          productId: products[2].id, // Áo thun nam
          productItemId: productItems[3].id, // Áo thun nam - Size S
          quantity: 1,
          price: 159000,
          originalPrice: 199000,
          color: 'Xanh',
          productName: 'Áo thun nam',
          itemName: 'Áo thun nam - Size S',
          itemStatus: ProductItemStatus.AVAILABLE,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          orderId: orders[2].id, // Đơn hàng thứ ba
          productId: products[1].id, // Truyện cổ tích
          productItemId: productItems[2].id, // Truyện cổ tích - Bản đặc biệt
          quantity: 1,
          price: 199000,
          originalPrice: 249000,
          color: 'Nhiều màu',
          productName: 'Truyện cổ tích',
          itemName: 'Truyện cổ tích - Bản đặc biệt',
          itemStatus: ProductItemStatus.AVAILABLE,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);
      
      console.log(`- Đã tạo ${orders.length} đơn hàng và ${orders.length} chi tiết đơn hàng.`);
    }

    console.log('Đã tạo dữ liệu mẫu thành công!');
  } catch (error) {
    console.error('Lỗi khi tạo dữ liệu mẫu:', error);
  } finally {
    await sequelize.close();
  }
}

// Chạy hàm tạo dữ liệu mẫu
seedData(); 