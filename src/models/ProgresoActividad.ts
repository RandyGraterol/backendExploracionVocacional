import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class ProgresoActividad extends Model {
  declare id: number;
  declare odeclarei: number;
  declare actividadId: string;
  declare puntuacion: number;
  declare completada: boolean;
  declare fecha: Date;
}

ProgresoActividad.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    actividadId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    puntuacion: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    completada: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    fecha: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    modelName: 'ProgresoActividad',
    tableName: 'progreso_actividades'
  }
);

export default ProgresoActividad;
