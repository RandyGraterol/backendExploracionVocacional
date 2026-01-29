import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface PreguntaVocacionalAttributes {
  id: number;
  pregunta: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PreguntaVocacionalCreationAttributes extends Optional<PreguntaVocacionalAttributes, 'id'> {}

class PreguntaVocacional extends Model<PreguntaVocacionalAttributes, PreguntaVocacionalCreationAttributes> 
  implements PreguntaVocacionalAttributes {
  public id!: number;
  public pregunta!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PreguntaVocacional.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    pregunta: {
      type: DataTypes.STRING(500),
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: 'preguntas_vocacionales',
    timestamps: true
  }
);

export default PreguntaVocacional;
