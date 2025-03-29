import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../lib/db';

// Định nghĩa enum ProductItemStatus
export const ProductItemStatus = {
  AVAILABLE: 'available',
  OUT_OF_STOCK: 'out_of_stock',
  DISCONTINUED: 'discontinued'
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
  categoryId: number;
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define interface for creation (id is optional)
export interface ProductCreationAttributes extends Optional<ProductAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
  public id!: number;
  public name!: string;
  public description!: string;
  public categoryId!: number;
  public slug!: string;
  public metaTitle!: string;
  public metaDescription!: string;
  public metaKeywords!: string;
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
  type: string;
  url: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define interface for creation (id is optional)
export interface ProductMediaCreationAttributes extends Optional<ProductMediaAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class ProductMedia extends Model<ProductMediaAttributes, ProductMediaCreationAttributes> implements ProductMediaAttributes {
  public id!: number;
  public productId!: number;
  public type!: string;
  public url!: string;
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

export { Product, ProductCategory, ProductItem, ProductMedia, Order, OrderItem }; 