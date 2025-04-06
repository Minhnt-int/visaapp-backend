const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

// Đọc tham số từ dòng lệnh
const args = process.argv.slice(2);
const forceMode = args.includes('--force') || args.includes('-f');
const helpMode = args.includes('--help') || args.includes('-h');

// Hiển thị hướng dẫn sử dụng
if (helpMode) {
  console.log(`
  Usage: node scripts/sync-all-models.js [OPTIONS]
  
  Options:
    -f, --force    Xóa tất cả dữ liệu hiện có và tạo lại bảng từ đầu
    -h, --help     Hiển thị hướng dẫn sử dụng này
  
  Không có tham số: Chỉ cập nhật cấu trúc bảng, giữ nguyên dữ liệu
  `);
  process.exit(0);
}

// Cảnh báo nếu sử dụng force mode
if (forceMode) {
  console.log('\x1b[31m%s\x1b[0m', '⚠️  CẢNH BÁO: Chế độ FORCE được kích hoạt!');
  console.log('\x1b[31m%s\x1b[0m', '⚠️  TẤT CẢ dữ liệu hiện có sẽ bị XÓA và tạo lại bảng từ đầu!');
  console.log('\x1b[31m%s\x1b[0m', '⚠️  Nhấn Ctrl+C trong vòng 5 giây để hủy bỏ...');
  
  // Đợi 5 giây để người dùng có thể hủy
  const startTime = Date.now();
  while (Date.now() - startTime < 5000) {
    // Đợi 5 giây
  }
  console.log('\x1b[31m%s\x1b[0m', '⚠️  Đã hết thời gian chờ. Tiếp tục quá trình...');
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
    references: {
      model: 'product_categories',
      key: 'id',
    },
  },
  avatarId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: {
      model: 'media',
      key: 'id',
    },
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
  avatarId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: {
      model: 'media',
      key: 'id',
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
  mediaId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: {
      model: 'media',
      key: 'id',
    },
  },
  type: {
    type: DataTypes.ENUM('image', 'video'),
    allowNull: false,
    defaultValue: 'image',
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
  avatarId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: {
      model: 'media',
      key: 'id',
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
    references: {
      model: 'blog_categories',
      key: 'id',
    },
  },
  avatarId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: {
      model: 'media',
      key: 'id',
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
  path: {
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
  }
}, {
  tableName: 'media',
  timestamps: true,
  underscored: true,
});

// 8. User model
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
    validate: {
      isEmail: true,
    },
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
  indexes: [
    {
      fields: ['email'],
      unique: true,
    },
  ],
});

// 9. Order model
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
});

// 10. OrderItem model
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

// ProductMedia - Media
ProductMedia.belongsTo(Media, {
  foreignKey: 'mediaId',
  as: 'media',
});

Media.hasMany(ProductMedia, {
  sourceKey: 'id',
  foreignKey: 'mediaId',
  as: 'productMedia',
});

// Đồng bộ hóa models với cơ sở dữ liệu
async function syncAllModels() {
  try {
    // Xác thực kết nối
    await sequelize.authenticate();
    console.log('Kết nối database thành công.');

    // Xác định chế độ đồng bộ (force hoặc alter)
    const syncMode = forceMode ? { force: true } : { alter: true };
    const syncTypeText = forceMode ? "XÓA và TẠO LẠI các bảng" : "CẬP NHẬT cấu trúc các bảng";
    
    console.log(`Bắt đầu ${syncTypeText}...`);

    if (forceMode) {
      // Tắt tạm thời kiểm tra foreign key để có thể xóa bảng
      console.log('Tắt tạm thời kiểm tra foreign key...');
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
      
      // Xóa các bảng theo thứ tự (con trước, cha sau) để tránh lỗi constraint
      console.log('Xóa các bảng hiện có...');
      
      console.log('1. Xóa OrderItem...');
      await OrderItem.drop();
      
      console.log('2. Xóa Order...');
      await Order.drop();
      
      console.log('3. Xóa ProductMedia...');
      await ProductMedia.drop();
      
      console.log('4. Xóa ProductItem...');
      await ProductItem.drop();
      
      console.log('5. Xóa BlogPost...');
      await BlogPost.drop();
      
      console.log('6. Xóa Product...');
      await Product.drop();
      
      console.log('7. Xóa ProductCategory...');
      await ProductCategory.drop();
      
      console.log('8. Xóa BlogCategory...');
      await BlogCategory.drop();
      
      console.log('9. Xóa Media...');
      await Media.drop();
      
      console.log('10. Xóa User...');
      await User.drop();
      
      // Bật lại kiểm tra foreign key
      console.log('Bật lại kiểm tra foreign key...');
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    }
    
    // Đồng bộ hóa các model với database
    console.log('Tạo/cập nhật các bảng...');
    
    // Thay đổi thứ tự tạo bảng để đảm bảo các bảng được tạo theo đúng thứ tự phụ thuộc
    // Media phải được tạo trước vì các bảng khác tham chiếu đến nó
    console.log('1. Đồng bộ hóa Media...');
    await Media.sync(syncMode);
    
    console.log('2. Đồng bộ hóa User...');
    await User.sync(syncMode);
    
    console.log('3. Đồng bộ hóa ProductCategory...');
    await ProductCategory.sync(syncMode);
    
    console.log('4. Đồng bộ hóa BlogCategory...');
    await BlogCategory.sync(syncMode);
    
    console.log('5. Đồng bộ hóa Product...');
    await Product.sync(syncMode);
    
    console.log('6. Đồng bộ hóa ProductItem...');
    await ProductItem.sync(syncMode);
    
    console.log('7. Đồng bộ hóa ProductMedia...');
    await ProductMedia.sync(syncMode);
    
    console.log('8. Đồng bộ hóa BlogPost...');
    await BlogPost.sync(syncMode);
    
    console.log('9. Đồng bộ hóa Order...');
    await Order.sync(syncMode);
    
    console.log('10. Đồng bộ hóa OrderItem...');
    await OrderItem.sync(syncMode);
    
    console.log(`Đã hoàn thành ${syncTypeText} thành công!`);
    
    if (forceMode) {
      console.log('\x1b[33m%s\x1b[0m', 'Lưu ý: Tất cả dữ liệu đã bị xóa. Bạn cần chạy script seed-data.js để tạo dữ liệu mẫu.');
    }
  } catch (error) {
    console.error('Lỗi đồng bộ hóa bảng:', error);
  } finally {
    await sequelize.close();
  }
}

// Chạy hàm đồng bộ hóa
syncAllModels(); 