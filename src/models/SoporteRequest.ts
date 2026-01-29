import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class SoporteRequest extends Model {
  declare id: number;
  declare odeclarei: number;
  declare userName: string;
  declare userEmail: string;
  declare tipo: string;
  declare mensaje: string;
  declare status: string;
  declare respuesta: string;
}

SoporteRequest.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    userName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    userEmail: {
      type: DataTypes.STRING,
      allowNull: false
    },
    tipo: {
      type: DataTypes.STRING,
      allowNull: false
    },
    mensaje: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'pending'
    },
    respuesta: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'SoporteRequest',
    tableName: 'soporte_requests'
  }
);

export default SoporteRequest;
