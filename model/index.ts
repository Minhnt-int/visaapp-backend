import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../lib/db';
import MetaJson from './MetaJson';

// Định nghĩa enum ProductItemStatus
export const ProductItemStatus = {
  AVAILABLE: 'available',
  OUT_OF_STOCK: 'out_of_stock',
  DISCONTINUED: 'discontinued'
};

// Định nghĩa enum ProductStatus cho sản phẩm
export const ProductStatus = {
  DRAFT: 'draft',      // Nháp
  ACTIVE: 'active',    // Hoạt động
  DELETED: 'deleted'   // Đã xóa
};

// Định nghĩa enum BlogStatus cho bài viết
export const BlogStatus = {
  DRAFT: 'draft',      // Nháp
  ACTIVE: 'active',    // Hoạt động
  DELETED: 'deleted'   // Đã xóa
};

// Định nghĩa enum BlogCategoryStatus cho danh mục bài viết
export const BlogCategoryStatus = {
  DRAFT: 'draft',      // Nháp
  ACTIVE: 'active',    // Hoạt động
  DELETED: 'deleted'   // Đã xóa
};

// Định nghĩa enum OrderStatus
export const OrderStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};

// Định nghĩa enum ProductCategoryStatus cho danh mục sản phẩm
export const ProductCategoryStatus = {
  ACTIVE: 'active',    // Hoạt động
  DELETED: 'deleted'   // Đã xóa
};

// ProductCategory Model
export interface ProductCategoryAttributes {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parentId?: number;
  avatarUrl?: string;
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define interface for creation (id is optional)
export interface ProductCategoryCreationAttributes extends Optional<ProductCategoryAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class ProductCategory extends Model<ProductCategoryAttributes, ProductCategoryCreationAttributes> {
  // Sử dụng getter tường minh
  public get id(): number {
    return this.getDataValue('id');
  }
  public get name(): string {
    return this.getDataValue('name');
  }
  public get slug(): string {
    return this.getDataValue('slug');
  }
  public get description(): string | undefined {
    return this.getDataValue('description');
  }
  public get parentId(): number | undefined {
    return this.getDataValue('parentId');
  }
  public get avatarUrl(): string | undefined {
    return this.getDataValue('avatarUrl');
  }
  public get status(): string {
    return this.getDataValue('status');
  }
  public get createdAt(): Date | undefined {
    return this.getDataValue('createdAt');
  }
  public get updatedAt(): Date | undefined {
    return this.getDataValue('updatedAt');
  }

  // Nếu bạn cần setter, bạn cũng có thể định nghĩa chúng
  // public set name(value: string) {
  //   this.setDataValue('name', value);
  // }
  // Tương tự cho các thuộc tính khác nếu cần thiết
  // Tuy nhiên, thường thì Sequelize quản lý việc set giá trị qua .update() hoặc .create()
  // nên getter thường là đủ cho việc truy cập.
}

ProductCategory.init(
  {
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
      type: DataTypes.STRING(256),
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
    status: {
      type: DataTypes.ENUM(...Object.values(ProductCategoryStatus)),
      allowNull: false,
      defaultValue: ProductCategoryStatus.ACTIVE,
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
    tableName: 'product_categories',
    sequelize,
    timestamps: true,
  }
);

// Product Model
export interface ProductAttributes {
  id: number;
  name: string;
  description?: string;
  shortDescription?: string;
  categoryId: number;
  avatarUrl?: string;
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define interface for creation (id is optional)
export interface ProductCreationAttributes extends Optional<ProductAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Product extends Model<ProductAttributes, ProductCreationAttributes> {
  public get id(): number {
    return this.getDataValue('id');
  }
  public get name(): string {
    return this.getDataValue('name');
  }
  public get description(): string | undefined {
    return this.getDataValue('description');
  }
  public get shortDescription(): string | undefined {
    return this.getDataValue('shortDescription');
  }
  public get categoryId(): number {
    return this.getDataValue('categoryId');
  }
  public get avatarUrl(): string | undefined {
    return this.getDataValue('avatarUrl');
  }
  public get slug(): string {
    return this.getDataValue('slug');
  }
  public get metaTitle(): string | undefined {
    return this.getDataValue('metaTitle');
  }
  public get metaDescription(): string | undefined {
    return this.getDataValue('metaDescription');
  }
  public get metaKeywords(): string | undefined {
    return this.getDataValue('metaKeywords');
  }
  public get status(): string {
    return this.getDataValue('status');
  }
  public get createdAt(): Date | undefined {
    return this.getDataValue('createdAt');
  }
  public get updatedAt(): Date | undefined {
    return this.getDataValue('updatedAt');
  }
}

Product.init(
  {
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
    status: {
      type: DataTypes.ENUM(...Object.values(ProductStatus)),
      allowNull: false,
      defaultValue: ProductStatus.ACTIVE,
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
    tableName: 'products',
    sequelize,
    timestamps: true,
  }
);

// ProductItem Model
export interface ProductItemAttributes {
  id: number;
  productId: number;
  name: string;
  color: string;
  price: number;
  originalPrice: number;
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define interface for creation (id is optional)
export interface ProductItemCreationAttributes extends Optional<ProductItemAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class ProductItem extends Model<ProductItemAttributes, ProductItemCreationAttributes> {
  public get id(): number {
    return this.getDataValue('id');
  }
  public get productId(): number {
    return this.getDataValue('productId');
  }
  public get name(): string {
    return this.getDataValue('name');
  }
  public get color(): string {
    return this.getDataValue('color');
  }
  public get price(): number {
    return this.getDataValue('price');
  }
  public get originalPrice(): number {
    return this.getDataValue('originalPrice');
  }
  public get status(): string {
    return this.getDataValue('status');
  }
  public get createdAt(): Date | undefined {
    return this.getDataValue('createdAt');
  }
  public get updatedAt(): Date | undefined {
    return this.getDataValue('updatedAt');
  }
}

// Các model khác (ProductMedia, Order, OrderItem, BlogPost, Media, User, MetaSEO) cũng cần được sửa tương tự

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
  },
  {
    tableName: 'product_items',
    sequelize,
    timestamps: true,
  }
);

// ProductMedia Model
export interface ProductMediaAttributes {
  id: number;
  productId: number;
  url: string;
  type: string;
  altText?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define interface for creation (id is optional)
export interface ProductMediaCreationAttributes extends Optional<ProductMediaAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class ProductMedia extends Model<ProductMediaAttributes, ProductMediaCreationAttributes> {
  public get id(): number {
    return this.getDataValue('id');
  }
  public get productId(): number {
    return this.getDataValue('productId');
  }
  public get url(): string {
    return this.getDataValue('url');
  }
  public get type(): string {
    return this.getDataValue('type');
  }
  public get altText(): string | undefined {
    return this.getDataValue('altText');
  }
  public get createdAt(): Date | undefined {
    return this.getDataValue('createdAt');
  }
  public get updatedAt(): Date | undefined {
    return this.getDataValue('updatedAt');
  }
}

ProductMedia.init(
  {
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
  },
  {
    tableName: 'product_media',
    sequelize,
    timestamps: true,
  }
);

// Order Model
export interface OrderAttributes {
  id: number;
  userId?: number;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  notes?: string;
  status: string;
  totalAmount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OrderCreationAttributes extends Optional<OrderAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Order extends Model<OrderAttributes, OrderCreationAttributes> {
  public get id(): number {
    return this.getDataValue('id');
  }
  public get userId(): number | undefined {
    return this.getDataValue('userId');
  }
  public get recipientName(): string {
    return this.getDataValue('recipientName');
  }
  public get recipientPhone(): string {
    return this.getDataValue('recipientPhone');
  }
  public get recipientAddress(): string {
    return this.getDataValue('recipientAddress');
  }
  public get notes(): string | undefined {
    return this.getDataValue('notes');
  }
  public get status(): string {
    return this.getDataValue('status');
  }
  public get totalAmount(): number {
    return this.getDataValue('totalAmount');
  }
  public get createdAt(): Date | undefined {
    return this.getDataValue('createdAt');
  }
  public get updatedAt(): Date | undefined {
    return this.getDataValue('updatedAt');
  }
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
  },
  {
    tableName: 'orders',
    sequelize,
    timestamps: true,
  }
);

// OrderItem Model
export interface OrderItemAttributes {
  id: number;
  orderId: number;
  productId: number;
  productItemId: number;
  quantity: number;
  price: number;
  originalPrice: number;
  color: string;
  productName: string;
  itemName: string;
  itemStatus: string;
  subtotal?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OrderItemCreationAttributes extends Optional<OrderItemAttributes, 'id' | 'subtotal' | 'createdAt' | 'updatedAt'> {}

class OrderItem extends Model<OrderItemAttributes, OrderItemCreationAttributes> {
  public get id(): number {
    return this.getDataValue('id');
  }
  public get orderId(): number {
    return this.getDataValue('orderId');
  }
  public get productId(): number {
    return this.getDataValue('productId');
  }
  public get productItemId(): number {
    return this.getDataValue('productItemId');
  }
  public get quantity(): number {
    return this.getDataValue('quantity');
  }
  public get price(): number {
    return this.getDataValue('price');
  }
  public get originalPrice(): number {
    return this.getDataValue('originalPrice');
  }
  public get color(): string {
    return this.getDataValue('color');
  }
  public get productName(): string {
    return this.getDataValue('productName');
  }
  public get itemName(): string {
    return this.getDataValue('itemName');
  }
  public get itemStatus(): string {
    return this.getDataValue('itemStatus');
  }
  public get subtotal(): number | undefined { // VIRTUAL field
    return this.getDataValue('price') * this.getDataValue('quantity');
  }
  public get createdAt(): Date | undefined {
    return this.getDataValue('createdAt');
  }
  public get updatedAt(): Date | undefined {
    return this.getDataValue('updatedAt');
  }
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
    },
    productId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    productItemId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
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
  },
  {
    tableName: 'order_items',
    sequelize,
    timestamps: true,
  }
);

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

// OrderItem - Product/ProductItem
OrderItem.belongsTo(Product, {
  foreignKey: 'productId',
  as: 'product',
});

OrderItem.belongsTo(ProductItem, {
  foreignKey: 'productItemId',
  as: 'productItem',
});

// BlogCategory Model
export interface BlogCategoryAttributes {
  id: number;
  name: string;
  slug: string;
  avatarUrl?: string;
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BlogCategoryCreationAttributes extends Optional<BlogCategoryAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class BlogCategory extends Model<BlogCategoryAttributes, BlogCategoryCreationAttributes> {
  // Không khai báo public fields để tránh shadowing getters/setters của Sequelize
  // public id!: number;
  // public name!: string;
  // public slug!: string;
  // public avatarUrl!: string;
  // public status!: string;
  // public readonly createdAt!: Date;
  // public readonly updatedAt!: Date;

  // Thay vào đó, sử dụng get để truy cập các thuộc tính
  public get id(): number {
    return this.getDataValue('id');
  }

  public get name(): string {
    return this.getDataValue('name');
  }

  public get slug(): string {
    return this.getDataValue('slug');
  }

  public get avatarUrl(): string | undefined {
    return this.getDataValue('avatarUrl');
  }

  public get status(): string {
    return this.getDataValue('status');
  }

  public get createdAt(): Date | undefined {
    return this.getDataValue('createdAt');
  }

  public get updatedAt(): Date | undefined {
    return this.getDataValue('updatedAt');
  }
}

BlogCategory.init(
  {
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
    status: {
      type: DataTypes.ENUM(...Object.values(BlogCategoryStatus)),
      allowNull: false,
      defaultValue: BlogCategoryStatus.ACTIVE,
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
    tableName: 'blog_categories',
    sequelize,
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
  }
);

// BlogPost Model
export interface BlogPostAttributes {
  id: number;
  title: string;
  content: string;
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  author: string;
  publishedAt?: Date;
  viewCount?: number;
  blogCategoryId: number;
  avatarUrl?: string;
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BlogPostCreationAttributes extends Optional<BlogPostAttributes, 'id' | 'viewCount' | 'createdAt' | 'updatedAt'> {}

class BlogPost extends Model<BlogPostAttributes, BlogPostCreationAttributes> {
  public get id(): number {
    return this.getDataValue('id');
  }
  public get title(): string {
    return this.getDataValue('title');
  }
  public get content(): string {
    return this.getDataValue('content');
  }
  public get slug(): string {
    return this.getDataValue('slug');
  }
  public get metaTitle(): string | undefined {
    return this.getDataValue('metaTitle');
  }
  public get metaDescription(): string | undefined {
    return this.getDataValue('metaDescription');
  }
  public get metaKeywords(): string | undefined {
    return this.getDataValue('metaKeywords');
  }
  public get author(): string {
    return this.getDataValue('author');
  }
  public get publishedAt(): Date | undefined {
    return this.getDataValue('publishedAt');
  }
  public get viewCount(): number | undefined {
    return this.getDataValue('viewCount');
  }
  public get blogCategoryId(): number {
    return this.getDataValue('blogCategoryId');
  }
  public get avatarUrl(): string | undefined {
    return this.getDataValue('avatarUrl');
  }
  public get status(): string {
    return this.getDataValue('status');
  }
}

BlogPost.init(
  {
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
    },
    blogCategoryId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    avatarUrl: {
      type: new DataTypes.STRING(512),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(BlogStatus)),
      allowNull: false,
      defaultValue: BlogStatus.ACTIVE,
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
    tableName: 'blog_posts',
    sequelize,
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
  }
);

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

// Media Model
export interface MediaAttributes {
  id: number;
  name: string;
  url: string;
  type: string;
  altText?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define interface for creation (id is optional)
export interface MediaCreationAttributes extends Optional<MediaAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Media extends Model<MediaAttributes, MediaCreationAttributes> {
  public get id(): number {
    return this.getDataValue('id');
  }
  public get name(): string {
    return this.getDataValue('name');
  }
  public get url(): string {
    return this.getDataValue('url');
  }
  public get type(): string {
    return this.getDataValue('type');
  }
  public get altText(): string | undefined {
    return this.getDataValue('altText');
  }
  public get createdAt(): Date | undefined {
    return this.getDataValue('createdAt');
  }
  public get updatedAt(): Date | undefined {
    return this.getDataValue('updatedAt');
  }
}

Media.init(
  {
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
  },
  {
    tableName: 'media',
    sequelize,
    timestamps: true,
    underscored: true,
  }
);

// User Model
export interface UserAttributes {
  id: number;
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> {
  public get id(): number {
    return this.getDataValue('id');
  }
  public get name(): string {
    return this.getDataValue('name');
  }
  public get email(): string {
    return this.getDataValue('email');
  }
  public get password(): string {
    return this.getDataValue('password');
  }
  public get role(): 'user' | 'admin' {
    return this.getDataValue('role');
  }
  public get createdAt(): Date { // Giữ lại kiểu Date vì trong UserAttributes là Date
    return this.getDataValue('createdAt');
  }
  public get updatedAt(): Date { // Giữ lại kiểu Date vì trong UserAttributes là Date
    return this.getDataValue('updatedAt');
  }
}

User.init(
  {
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
  },
  {
    tableName: 'users',
    sequelize,
    timestamps: true,
    indexes: [
      {
        fields: ['email'],
        unique: true,
      },
    ],
  }
);

// MetaSEO Model
export interface MetaSEOAttributes {
  id: number;
  pageKey: string;
  pageUrl?: string;
  title: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  customHead?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define interface for creation (id is optional)
export interface MetaSEOCreationAttributes extends Optional<MetaSEOAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class MetaSEO extends Model<MetaSEOAttributes, MetaSEOCreationAttributes> {
  public get id(): number {
    return this.getDataValue('id');
  }
  public get pageKey(): string {
    return this.getDataValue('pageKey');
  }
  public get pageUrl(): string | undefined {
    return this.getDataValue('pageUrl');
  }
  public get title(): string {
    return this.getDataValue('title');
  }
  public get description(): string | undefined {
    return this.getDataValue('description');
  }
  public get keywords(): string | undefined {
    return this.getDataValue('keywords');
  }
  public get ogTitle(): string | undefined {
    return this.getDataValue('ogTitle');
  }
  public get ogDescription(): string | undefined {
    return this.getDataValue('ogDescription');
  }
  public get ogImage(): string | undefined {
    return this.getDataValue('ogImage');
  }
  public get customHead(): string | undefined {
    return this.getDataValue('customHead');
  }
  public get createdAt(): Date | undefined {
    return this.getDataValue('createdAt');
  }
  public get updatedAt(): Date | undefined {
    return this.getDataValue('updatedAt');
  }
}

MetaSEO.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    pageKey: {
      type: new DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      field: 'page_key',
    },
    pageUrl: {
      type: new DataTypes.STRING(512),
      allowNull: true,
      field: 'page_url',
    },
    title: {
      type: new DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: new DataTypes.STRING(512),
      allowNull: true,
    },
    keywords: {
      type: new DataTypes.STRING(512),
      allowNull: true,
    },
    ogTitle: {
      type: new DataTypes.STRING(255),
      allowNull: true,
      field: 'og_title',
    },
    ogDescription: {
      type: new DataTypes.STRING(512),
      allowNull: true,
      field: 'og_description',
    },
    ogImage: {
      type: new DataTypes.STRING(512),
      allowNull: true,
      field: 'og_image',
    },
    customHead: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'custom_head',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at',
    },
  },
  {
    tableName: 'meta_seo',
    sequelize,
    timestamps: true,
    underscored: true,
  }
);

// Other relationships are here

export { Product, ProductCategory, ProductItem, ProductMedia, Order, OrderItem, BlogPost, BlogCategory, Media, MetaSEO, MetaJson }; 