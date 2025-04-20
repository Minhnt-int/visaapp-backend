import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../lib/db';

// MetaJson Model
export interface MetaJsonAttributes {
  id: number;
  pageKey: string;
  metaData: any;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define interface for creation (id is optional)
export interface MetaJsonCreationAttributes extends Optional<MetaJsonAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class MetaJson extends Model<MetaJsonAttributes, MetaJsonCreationAttributes> implements MetaJsonAttributes {
  public id!: number;
  public pageKey!: string;
  public metaData!: any;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

MetaJson.init(
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
    metaData: {
      type: DataTypes.JSON,
      allowNull: false,
      field: 'meta_data',
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
    tableName: 'meta_json',
    sequelize,
    timestamps: true,
    underscored: true,
  }
);

export default MetaJson; 