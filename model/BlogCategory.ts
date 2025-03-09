import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../lib/db';

interface BlogCategoryAttributes {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

interface BlogCategoryCreationAttributes extends Optional<BlogCategoryAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class BlogCategory extends Model<BlogCategoryAttributes, BlogCategoryCreationAttributes> implements BlogCategoryAttributes {
  public id!: number;
  public name!: string;
  public createdAt!: Date;
  public updatedAt!: Date;
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
    sequelize, // passing the `sequelize` instance is required
    timestamps: true, // automatically add createdAt and updatedAt fields
  }
);

export default BlogCategory;