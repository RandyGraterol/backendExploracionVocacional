import { Request, Response } from 'express';
import { Actividad, ResultadoTest, sequelize } from '../models';
import { AuthRequest } from '../middleware/auth';
import { QueryTypes } from 'sequelize';

/**
 * Valida que el contenido de la actividad sea apropiado según su tipo
 * @param tipo - Tipo de actividad (quiz, simulacion, ordenamiento, practica, desafio)
 * @param body - Datos de la actividad
 * @returns true si la validación es exitosa, false en caso contrario
 */
const validateActivityContent = (tipo: string, body: any): { valid: boolean; error?: string } => {
  switch(tipo.toLowerCase()) {
    case 'quiz':
      if (!Array.isArray(body.preguntas) || body.preguntas.length === 0) {
        return { valid: false, error: 'Las actividades tipo Quiz requieren un array de preguntas con al menos 1 elemento' };
      }
      return { valid: true };
    
    case 'ordenamiento':
      if (!Array.isArray(body.itemsOrden) || body.itemsOrden.length === 0) {
        return { valid: false, error: 'Las actividades tipo Ordenamiento requieren un array de itemsOrden con al menos 1 elemento' };
      }
      return { valid: true };
    
    case 'simulacion':
    case 'simulación':
      if (!body.simulacion || typeof body.simulacion !== 'object') {
        return { valid: false, error: 'Las actividades tipo Simulación requieren un objeto simulacion' };
      }
      return { valid: true };
    
    case 'practica':
    case 'práctica':
      if (!body.ejercicioCodigo || typeof body.ejercicioCodigo !== 'object') {
        return { valid: false, error: 'Las actividades tipo Práctica requieren un objeto ejercicioCodigo' };
      }
      return { valid: true };
    
    case 'desafio':
    case 'desafío':
      if (!Array.isArray(body.paresDesafio) || body.paresDesafio.length === 0) {
        return { valid: false, error: 'Las actividades tipo Desafío requieren un array de paresDesafio con al menos 1 elemento' };
      }
      return { valid: true };
    
    default:
      return { valid: false, error: `Tipo de actividad no soportado: ${tipo}. Los tipos válidos son: quiz, simulacion, ordenamiento, practica, desafio` };
  }
};

// GET - Obtener todas las actividades
// Si el usuario es estudiante con rama asignada, filtra por su rama
export const getAll = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRol = req.user?.rol;

    // Si es estudiante, intentar obtener su rama recomendada
    if (userRol === 'student' && userId) {
      const resultado = await ResultadoTest.findOne({
        where: { userId },
        order: [['fecha', 'DESC']]
      });

      if (resultado && resultado.ramaRecomendada) {
        // Filtrar actividades que incluyan la rama del estudiante
        // Usar SQLite json_each para buscar en el array de ramas
        const actividades = await sequelize.query(
          `SELECT * FROM actividades 
           WHERE EXISTS (
             SELECT 1 FROM json_each(rama) 
             WHERE json_each.value = :ramaEstudiante
           )
           ORDER BY title ASC`,
          {
            replacements: { ramaEstudiante: resultado.ramaRecomendada },
            type: QueryTypes.SELECT,
            model: Actividad,
            mapToModel: true
          }
        ) as Actividad[];

        console.log(`📊 Actividades filtradas para estudiante ${userId} (rama: ${resultado.ramaRecomendada}): ${actividades.length}`);
        return res.json(actividades);
      }
    }

    // Si no es estudiante o no tiene rama, retornar todas las actividades
    const actividades = await Actividad.findAll({
      order: [['title', 'ASC']]
    });

    console.log(`📊 Todas las actividades retornadas: ${actividades.length}`);
    res.json(actividades);
  } catch (error) {
    console.error('Error fetching actividades:', error);
    res.status(500).json({ error: 'Error al obtener las actividades' });
  }
};

// GET - Obtener una actividad por ID
export const getById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const actividad = await Actividad.findByPk(id);

    if (!actividad) {
      return res.status(404).json({ error: 'Actividad no encontrada' });
    }

    res.json(actividad);
  } catch (error) {
    console.error('Error fetching actividad:', error);
    res.status(500).json({ error: 'Error al obtener la actividad' });
  }
};

// POST - Crear nueva actividad
export const create = async (req: Request, res: Response) => {
  try {
    console.log('🔵 === INICIO CREACIÓN DE ACTIVIDAD ===');
    console.log('📦 Datos recibidos:', JSON.stringify(req.body, null, 2));

    const { id, title, description, rama, tipo, dificultad, imagen, icono, preguntas, itemsOrden, simulacion, ejercicioCodigo, paresDesafio } = req.body;

    // Validación de campos requeridos
    if (!id || !title || !description || !rama || !tipo || !dificultad) {
      console.log('❌ Validación fallida - Campos faltantes');
      console.log({ id, title, description, rama, tipo, dificultad });
      return res.status(400).json({
        error: 'Campos requeridos: id, title, description, rama, tipo, dificultad',
        received: { id, title, description, rama, tipo, dificultad }
      });
    }

    // Validación de contenido según tipo de actividad
    const contentValidation = validateActivityContent(tipo, req.body);
    if (!contentValidation.valid) {
      console.log('❌ Validación de contenido fallida:', contentValidation.error);
      return res.status(400).json({
        error: contentValidation.error
      });
    }

    console.log('✅ Validación pasada');

    // Verificar si ya existe una actividad con ese ID
    const existente = await Actividad.findByPk(id);
    if (existente) {
      console.log('⚠️ Ya existe una actividad con ID:', id);
      return res.status(409).json({ error: `Ya existe una actividad con el ID: ${id}` });
    }

    console.log('📝 Creando actividad en BD...');
    const actividadData = {
      id,
      title,
      description,
      rama,
      tipo,
      dificultad,
      imagen,
      icono: icono || '📚',
      preguntas,
      itemsOrden,
      simulacion,
      ejercicioCodigo,
      paresDesafio
    };

    console.log('📄 Datos a insertar:', JSON.stringify(actividadData, null, 2));

    const actividad = await Actividad.create(actividadData);

    console.log('✅ Actividad creada exitosamente:', actividad.id);
    console.log('📊 Total actividades en BD:', await Actividad.count());
    console.log('🔵 === FIN CREACIÓN DE ACTIVIDAD ===');

    res.status(201).json(actividad);
  } catch (error: any) {
    console.error('❌ ERROR CRÍTICO al crear actividad:');
    console.error('Tipo de error:', error.constructor.name);
    console.error('Mensaje:', error.message);
    console.error('Stack:', error.stack);

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Ya existe una actividad con ese ID' });
    }

    res.status(500).json({
      error: 'Error al crear la actividad',
      details: error.message
    });
  }
};

// PUT - Actualizar actividad
export const update = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const actividad = await Actividad.findByPk(id);
    if (!actividad) {
      return res.status(404).json({ error: 'Actividad no encontrada' });
    }

    // Si se está actualizando el tipo, validar el contenido
    if (updateData.tipo) {
      const contentValidation = validateActivityContent(updateData.tipo, updateData);
      if (!contentValidation.valid) {
        return res.status(400).json({
          error: contentValidation.error
        });
      }
    }

    await actividad.update(updateData);

    res.json(actividad);
  } catch (error) {
    console.error('Error updating actividad:', error);
    res.status(500).json({ error: 'Error al actualizar la actividad' });
  }
};

// DELETE - Eliminar actividad
export const remove = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const actividad = await Actividad.findByPk(id);
    if (!actividad) {
      return res.status(404).json({ error: 'Actividad no encontrada' });
    }

    await actividad.destroy();

    res.json({ message: 'Actividad eliminada correctamente' });
  } catch (error) {
    console.error('Error deleting actividad:', error);
    res.status(500).json({ error: 'Error al eliminar la actividad' });
  }
};
