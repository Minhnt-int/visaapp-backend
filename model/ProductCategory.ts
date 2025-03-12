import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../lib/db';

interface ProductCategoryAttributes {
  id: number;
  name: string;
  parentId?: number | null;
}

interface ProductCategoryCreationAttributes extends Optional<ProductCategoryAttributes, 'id'> {}

class ProductCategory extends Model<ProductCategoryAttributes, ProductCategoryCreationAttributes> implements ProductCategoryAttributes {
  public id!: number;
  public name!: string;
  public parentId?: number | null;
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
    parentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'product_categories',
        key: 'id',
      },
    },
  },
  {
    tableName: 'product_categories',
    sequelize, // passing the `sequelize` instance is required
    indexes: [
      {
        fields: ['name'], // Add index for the 'name' column
      },
      {
        fields: ['parentId'], // Add index for the 'parentId' column
      },
    ],
  }
);

// Thiết lập quan hệ tự tham chiếu
ProductCategory.hasMany(ProductCategory, {
  foreignKey: 'parentId',
  as: 'subcategories',
});

ProductCategory.belongsTo(ProductCategory, {
  foreignKey: 'parentId',
  as: 'parent',
});

export default ProductCategory;