import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../lib/db';
import BlogCategory from './BlogCategory';

interface BlogPostAttributes {
  id: number;
  title: string;
  content: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  author: string;
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  blogCategoryId: number; // Thêm trường blogCategoryId
}

interface BlogPostCreationAttributes extends Optional<BlogPostAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

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
  public createdAt!: Date;
  public updatedAt!: Date;
  public blogCategoryId!: number; // Thêm trường blogCategoryId
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
    blogCategoryId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: BlogCategory,
        key: 'id',
      },
    },
  },
  {
    tableName: 'blog_posts',
    sequelize, // passing the `sequelize` instance is required
    timestamps: true, // automatically add createdAt and updatedAt fields
    indexes: [
      {
        fields: ['slug'], // Add index for the 'slug' column
      },
      {
        fields: ['title'], // Add index for the 'title' column
      },
      {
        fields: ['blogCategoryId'], // Add index for the 'blogCategoryId' column
      },
    ],
  }
);

export default BlogPost;