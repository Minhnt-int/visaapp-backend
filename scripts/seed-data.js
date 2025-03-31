const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

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

    console.log('Tạo danh mục sản phẩm mẫu...');
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
      {
        name: 'Đồ điện tử',
        slug: 'do-dien-tu',
        description: 'Các sản phẩm điện tử giải trí cho trẻ',
      },
    ]);

    // 2. Tạo sản phẩm
    const products = await Product.bulkCreate([
      {
        name: 'Búp bê Barbie',
        slug: 'bup-be-barbie',
        description: 'Búp bê Barbie cao cấp',
        shortDescription: 'Búp bê Barbie phiên bản mới nhất 2024',
        categoryId: categories[0].id,
        metaTitle: 'Búp bê Barbie - Đồ chơi trẻ em',
        metaDescription: 'Búp bê Barbie cao cấp cho trẻ em',
        metaKeywords: 'bup be, barbie, do choi tre em',
      },
      {
        name: 'Truyện cổ tích',
        slug: 'truyen-co-tich',
        description: 'Tuyển tập truyện cổ tích Việt Nam',
        shortDescription: 'Bộ sưu tập các câu chuyện cổ tích Việt Nam hay nhất',
        categoryId: categories[1].id,
        metaTitle: 'Truyện cổ tích Việt Nam',
        metaDescription: 'Tuyển tập truyện cổ tích Việt Nam',
        metaKeywords: 'truyen co tich, sach tre em',
      },
      {
        name: 'Áo thun nam',
        slug: 'ao-thun-nam',
        description: 'Áo thun nam trẻ em',
        shortDescription: 'Áo thun nam trẻ em chất liệu cotton thoáng mát',
        categoryId: categories[2].id,
        metaTitle: 'Áo thun nam trẻ em',
        metaDescription: 'Áo thun nam trẻ em chất lượng cao',
        metaKeywords: 'ao thun, quan ao tre em',
      },
      {
        name: 'Máy chơi game cầm tay',
        slug: 'may-choi-game-cam-tay',
        description: 'Máy chơi game cầm tay mini với hơn 400 trò chơi',
        shortDescription: 'Máy chơi game cầm tay phù hợp cho trẻ từ 6 tuổi trở lên',
        categoryId: categories[3].id,
        metaTitle: 'Máy chơi game cầm tay mini',
        metaDescription: 'Máy chơi game cầm tay mini với hơn 400 trò chơi cổ điển',
        metaKeywords: 'game, máy chơi game, đồ điện tử trẻ em',
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

    // 4. Tạo media cho sản phẩm
    await ProductMedia.bulkCreate([
      {
        productId: products[0].id,
        type: 'image',
        url: '/uploads/barbie-classic.jpg',
      },
      {
        productId: products[0].id,
        type: 'image',
        url: '/uploads/barbie-princess.jpg',
      },
      {
        productId: products[1].id,
        type: 'image',
        url: '/uploads/truyen-co-tich.jpg',
      },
      {
        productId: products[2].id,
        type: 'image',
        url: '/uploads/ao-thun-nam.jpg',
      },
      {
        productId: products[3].id,
        type: 'image',
        url: '/uploads/game-console.jpg',
      },
      {
        productId: products[3].id,
        type: 'video',
        url: '/uploads/game-console-demo.mp4',
      },
    ]);

    console.log('Tạo danh mục blog mẫu...');
    // Tạo danh mục blog mẫu
    const blogCategories = await BlogCategory.bulkCreate([
      {
        name: 'Tin tức',
        slug: 'tin-tuc',
      },
      {
        name: 'Khuyến mãi',
        slug: 'khuyen-mai',
      },
      {
        name: 'Hướng dẫn',
        slug: 'huong-dan',
      },
      {
        name: 'Review sản phẩm',
        slug: 'review-san-pham',
      }
    ]);

    console.log('Tạo bài viết blog mẫu...');
    // Tạo bài viết blog mẫu
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
        blogCategoryId: blogCategories[0].id
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
        blogCategoryId: blogCategories[3].id
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
        blogCategoryId: blogCategories[1].id
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
        blogCategoryId: blogCategories[2].id
      }
    ]);

    console.log('Tạo dữ liệu Media mẫu...');
    // Tạo dữ liệu Media mẫu
    await Media.bulkCreate([
      {
        name: 'banner-home-1.jpg',
        path: '/uploads/banner-home-1.jpg',
        altText: 'Banner trang chủ khuyến mãi mùa hè',
      },
      {
        name: 'banner-home-2.jpg',
        path: '/uploads/banner-home-2.jpg',
        altText: 'Banner trang chủ sản phẩm mới',
      },
      {
        name: 'logo.png',
        path: '/uploads/logo.png',
        altText: 'Logo website',
      },
      {
        name: 'product-placeholder.jpg',
        path: '/uploads/product-placeholder.jpg',
        altText: 'Hình ảnh mặc định cho sản phẩm',
      },
      {
        name: 'team-member-1.jpg',
        path: '/uploads/team-member-1.jpg',
        altText: 'Thành viên đội ngũ 1',
      },
      {
        name: 'team-member-2.jpg',
        path: '/uploads/team-member-2.jpg',
        altText: 'Thành viên đội ngũ 2',
      }
    ]);

    console.log('Đã tạo dữ liệu mẫu thành công!');
  } catch (error) {
    console.error('Lỗi khi tạo dữ liệu mẫu:', error);
  } finally {
    await sequelize.close();
  }
}

// Chạy hàm tạo dữ liệu mẫu
seedData(); 