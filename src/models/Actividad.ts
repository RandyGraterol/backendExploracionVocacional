import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Actividad extends Model {
  declare id: string;
  declare title: string;
  declare description: string;
  declare rama: string[]; // Cambiado de string a string[] para soportar múltiples ramas
  declare tipo: string;
  declare dificultad: string;
  declare imagen: string;
  declare icono: string;
  declare preguntas: any[];
  declare itemsOrden: any[];
  declare simulacion: any;
  declare ejercicioCodigo: any;
  declare paresDesafio: any[];
}

Actividad.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    rama: {
      type: DataTypes.JSON, // Cambiado de STRING a JSON para almacenar array de ramas
      allowNull: false,
      validate: {
        isValidRamaArray(value: any) {
          if (!Array.isArray(value)) {
            throw new Error('El campo rama debe ser un array');
          }
          if (value.length === 0) {
            throw new Error('Debe asociar al menos una rama a la actividad');
          }
          if (!value.every((item: any) => typeof item === 'string')) {
            throw new Error('Todos los elementos del array rama deben ser strings');
          }
        }
      }
    },
    tipo: {
      type: DataTypes.STRING,
      allowNull: false
    },
    dificultad: {
      type: DataTypes.STRING,
      allowNull: false
    },
    imagen: {
      type: DataTypes.STRING,
      allowNull: true
    },
    icono: {
      type: DataTypes.STRING,
      defaultValue: '📚'
    },
    preguntas: {
      type: DataTypes.JSON,
      allowNull: true
    },
    itemsOrden: {
      type: DataTypes.JSON,
      allowNull: true
    },
    simulacion: {
      type: DataTypes.JSON,
      allowNull: true
    },
    ejercicioCodigo: {
      type: DataTypes.JSON,
      allowNull: true
    },
    paresDesafio: {
      type: DataTypes.JSON,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'Actividad',
    tableName: 'actividades'
  }
);

export default Actividad;
