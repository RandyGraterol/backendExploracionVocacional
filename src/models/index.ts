import sequelize from '../config/database';
import PreguntaVocacional from './PreguntaVocacional';
import OpcionVocacional from './OpcionVocacional';
import PreguntaConocimiento from './PreguntaConocimiento';
import OpcionConocimiento from './OpcionConocimiento';
import Usuario from './Usuario';
import Video from './Video';
import Rama from './Rama';
import Actividad from './Actividad';
import ResultadoTest from './ResultadoTest';
import ProgresoActividad from './ProgresoActividad';
import SoporteRequest from './SoporteRequest';

// Definir relaciones
PreguntaVocacional.hasMany(OpcionVocacional, {
  foreignKey: 'preguntaId',
  as: 'opciones',
  onDelete: 'CASCADE'
});

OpcionVocacional.belongsTo(PreguntaVocacional, {
  foreignKey: 'preguntaId',
  as: 'pregunta'
});

PreguntaConocimiento.hasMany(OpcionConocimiento, {
  foreignKey: 'preguntaId',
  as: 'opciones',
  onDelete: 'CASCADE'
});

OpcionConocimiento.belongsTo(PreguntaConocimiento, {
  foreignKey: 'preguntaId',
  as: 'pregunta'
});

// Relaciones de Usuario
Usuario.hasMany(ResultadoTest, { foreignKey: 'userId', as: 'resultados' });
ResultadoTest.belongsTo(Usuario, { foreignKey: 'userId', as: 'usuario' });

Usuario.hasMany(ProgresoActividad, { foreignKey: 'userId', as: 'progresos' });
ProgresoActividad.belongsTo(Usuario, { foreignKey: 'userId', as: 'usuario' });

Usuario.hasMany(SoporteRequest, { foreignKey: 'userId', as: 'solicitudes' });
SoporteRequest.belongsTo(Usuario, { foreignKey: 'userId', as: 'usuario' });

// Función para sincronizar la base de datos
const syncDatabase = async (force: boolean = false) => {
  try {
    await sequelize.sync({ force });
    console.log('✅ Database models synchronized');
  } catch (error) {
    console.error('❌ Error synchronizing database:', error);
    throw error;
  }
};

export {
  sequelize,
  PreguntaVocacional,
  OpcionVocacional,
  PreguntaConocimiento,
  OpcionConocimiento,
  Usuario,
  Video,
  Rama,
  Actividad,
  ResultadoTest,
  ProgresoActividad,
  SoporteRequest,
  syncDatabase
};
