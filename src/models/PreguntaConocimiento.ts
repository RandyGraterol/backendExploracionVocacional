import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface PreguntaConocimientoAttributes {
  id: number;
  pregunta: string;
  rama: string;
  correcta: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PreguntaConocimientoCreationAttributes extends Optional<PreguntaConocimientoAttributes, 'id'> {}

class PreguntaConocimiento extends Model<PreguntaConocimientoAttributes, PreguntaConocimientoCreationAttributes> 
  implements PreguntaConocimientoAttributes {
  public id!: number;
  public pregunta!: string;
  public rama!: string;
  public correcta!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PreguntaConocimiento.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    pregunta: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    rama: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    correcta: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
        max: 3
      }
    }
  },
  {
    sequelize,
    tableName: 'preguntas_conocimiento',
    timestamps: true
  }
);

export default PreguntaConocimiento;
