import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../lib/db';

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

// ProductCategory Model
export interface ProductCategoryAttributes {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parentId?: number;
  avatarUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define interface for creation (id is optional)
export interface ProductCategoryCreationAttributes extends Optional<ProductCategoryAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class ProductCategory extends Model<ProductCategoryAttributes, ProductCategoryCreationAttributes> implements ProductCategoryAttributes {
  public id!: number;
  public name!: string;
  public slug!: string;
  public description!: string;
  public parentId!: number;
  public avatarUrl!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
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

class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
  public id!: number;
  public name!: string;
  public description!: string;
  public shortDescription!: string;
  public categoryId!: number;
  public avatarUrl!: string;
  public slug!: string;
  public metaTitle!: string;
  public metaDescription!: string;
  public metaKeywords!: string;
  public status!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
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

class ProductItem extends Model<ProductItemAttributes, ProductItemCreationAttributes> implements ProductItemAttributes {
  public id!: number;
  public productId!: number;
  public name!: string;
  public color!: string;
  public price!: number;
  public originalPrice!: number;
  public status!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

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

class ProductMedia extends Model<ProductMediaAttributes, ProductMediaCreationAttributes> implements ProductMediaAttributes {
  public id!: number;
  public productId!: number;
  public url!: string;
  public type!: string;
  public altText!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
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

class Order extends Model<OrderAttributes, OrderCreationAttributes> implements OrderAttributes {
  public id!: number;
  public userId?: number;
  public recipientName!: string;
  public recipientPhone!: string;
  public recipientAddress!: string;
  public notes!: string;
  public status!: string;
  public totalAmount!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
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
  public itemStatus!: string;
  public subtotal!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
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

class BlogPost extends Model<BlogPostAttributes, BlogPostCreationAttributes> implements BlogPostAttributes {
  public id!: number;
  public title!: string;
  public content!: string;
  public slug!: string;
  public metaTitle!: string;
  public metaDescription!: string;
  public metaKeywords!: string;
  public author!: string;
  public publishedAt!: Date;
  public viewCount!: number;
  public blogCategoryId!: number;
  public avatarUrl!: string;
  public status!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
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

class Media extends Model<MediaAttributes, MediaCreationAttributes> implements MediaAttributes {
  public id!: number;
  public name!: string;
  public url!: string;
  public type!: string;
  public altText!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
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

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public name!: string;
  public email!: string;
  public password!: string;
  public role!: 'user' | 'admin';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
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

// Other relationships are here

export { Product, ProductCategory, ProductItem, ProductMedia, Order, OrderItem, BlogPost, BlogCategory, Media }; 