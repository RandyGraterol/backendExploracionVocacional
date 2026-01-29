import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface OpcionVocacionalAttributes {
  id: number;
  preguntaId: number;
  texto: string;
  rama: string;
}

interface OpcionVocacionalCreationAttributes extends Optional<OpcionVocacionalAttributes, 'id'> {}

class OpcionVocacional extends Model<OpcionVocacionalAttributes, OpcionVocacionalCreationAttributes> 
  implements OpcionVocacionalAttributes {
  public id!: number;
  public preguntaId!: number;
  public texto!: string;
  public rama!: string;
}

OpcionVocacional.init(
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
        model: 'preguntas_vocacionales',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    texto: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    rama: {
      type: DataTypes.STRING(100),
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: 'opciones_vocacionales',
    timestamps: false
  }
);

export default OpcionVocacional;
