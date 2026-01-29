import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface VideoAttributes {
  id: number;
  titulo: string;
  descripcion: string;
  rama: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface VideoCreationAttributes extends Optional<VideoAttributes, 'id'> {}

class Video extends Model<VideoAttributes, VideoCreationAttributes> 
  implements VideoAttributes {
  public id!: number;
  public titulo!: string;
  public descripcion!: string;
  public rama!: string;
  public filename!: string;
  public originalName!: string;
  public mimetype!: string;
  public size!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Video.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    titulo: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    rama: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    filename: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    originalName: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    mimetype: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: 'videos',
    timestamps: true
  }
);

export default Video;
