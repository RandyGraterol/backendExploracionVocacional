import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export type UserRole = 'student' | 'admin';
export type UserStatus = 'pendiente' | 'aprobado' | 'rechazado';

interface UsuarioAttributes {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  rol: UserRole;
  activo: boolean;
  estado: UserStatus;
  documentoUrl?: string;
  documentoNombre?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UsuarioCreationAttributes extends Optional<UsuarioAttributes, 'id' | 'activo' | 'estado'> { }

class Usuario extends Model<UsuarioAttributes, UsuarioCreationAttributes>
  implements UsuarioAttributes {
  public id!: number;
  public nombre!: string;
  public apellido!: string;
  public email!: string;
  public password!: string;
  public rol!: UserRole;
  public activo!: boolean;
  public estado!: UserStatus;
  public documentoUrl?: string;
  public documentoNombre?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Método para ocultar password en JSON
  toJSON() {
    const values = { ...this.get() };
    delete (values as any).password;
    return values;
  }
}

Usuario.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    apellido: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    rol: {
      type: DataTypes.ENUM('student', 'admin'),
      allowNull: false,
      defaultValue: 'student'
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    estado: {
      type: DataTypes.ENUM('pendiente', 'aprobado', 'rechazado'),
      allowNull: false,
      defaultValue: 'pendiente'
    },
    documentoUrl: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    documentoNombre: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'usuarios',
    timestamps: true
  }
);

export default Usuario;
