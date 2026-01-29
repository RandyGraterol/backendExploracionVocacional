import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Rama extends Model {
  declare id: string;
  declare titulo: string;
  declare descripcion: string;
  declare icono: string;
  declare tecnologias: string[];
  declare aplicaciones: string[];
  declare imagenes: string[];
  declare videos: string[];
}

Rama.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    titulo: {
      type: DataTypes.STRING,
      allowNull: false
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    icono: {
      type: DataTypes.STRING,
      defaultValue: '📚'
    },
    tecnologias: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    aplicaciones: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    imagenes: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    videos: {
      type: DataTypes.JSON,
      defaultValue: []
    }
  },
  {
    sequelize,
    modelName: 'Rama',
    tableName: 'ramas'
  }
);

export default Rama;
