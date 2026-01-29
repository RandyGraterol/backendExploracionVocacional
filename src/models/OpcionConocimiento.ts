import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface OpcionConocimientoAttributes {
  id: number;
  preguntaId: number;
  texto: string;
  indice: number;
}

interface OpcionConocimientoCreationAttributes extends Optional<OpcionConocimientoAttributes, 'id'> {}

class OpcionConocimiento extends Model<OpcionConocimientoAttributes, OpcionConocimientoCreationAttributes> 
  implements OpcionConocimientoAttributes {
  public id!: number;
  public preguntaId!: number;
  public texto!: string;
  public indice!: number;
}

OpcionConocimiento.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    preguntaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'preguntas_conocimiento',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    texto: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    indice: {
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
    tableName: 'opciones_conocimiento',
    timestamps: false
  }
);

export default OpcionConocimiento;
