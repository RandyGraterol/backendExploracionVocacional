import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class ResultadoTest extends Model {
  declare id: number;
  declare odeclarei: number;
  declare ramaRecomendada: string;
  declare puntuaciones: any;
  declare fecha: Date;
  declare respuestas: any[];
}

ResultadoTest.init(
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
    ramaRecomendada: {
      type: DataTypes.STRING,
      allowNull: false
    },
    puntuaciones: {
      type: DataTypes.JSON,
      allowNull: false
    },
    fecha: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    respuestas: {
      type: DataTypes.JSON,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'ResultadoTest',
    tableName: 'resultados_test'
  }
);

export default ResultadoTest;
