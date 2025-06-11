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

class MetaJson extends Model<MetaJsonAttributes, MetaJsonCreationAttributes> {
  public get id(): number {
    return this.getDataValue('id');
  }
  public get pageKey(): string {
    return this.getDataValue('pageKey');
  }
  public get metaData(): any {
    return this.getDataValue('metaData');
  }
  public get createdAt(): Date | undefined {
    return this.getDataValue('createdAt');
  }
  public get updatedAt(): Date | undefined {
    return this.getDataValue('updatedAt');
  }
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