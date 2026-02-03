import { Request, Response } from 'express';
import { ProgresoActividad } from '../models';

// GET - Obtener todos los progresos
export const getAll = async (req: Request, res: Response) => {
  try {
    const progresos = await ProgresoActividad.findAll({
      order: [['fecha', 'DESC']]
    });
    
    res.json(progresos);
  } catch (error) {
    console.error('Error fetching all progreso:', error);
    res.status(500).json({ error: 'Error al obtener los progresos' });
  }
};

// GET - Obtener progreso por usuario
export const getByUserId = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const progresos = await ProgresoActividad.findAll({
      where: { userId: parseInt(userId) },
      order: [['fecha', 'DESC']]
    });
    
    res.json(progresos);
  } catch (error) {
    console.error('Error fetching progreso:', error);
    res.status(500).json({ error: 'Error al obtener el progreso' });
  }
};

// POST - Guardar progreso de actividad
export const create = async (req: Request, res: Response) => {
  try {
    const { userId, actividadId, puntuacion, completada } = req.body;
    
    if (!userId || !actividadId) {
      return res.status(400).json({ error: 'userId y actividadId son requeridos' });
    }
    
    // Verificar si ya existe un progreso para esta actividad
    const existente = await ProgresoActividad.findOne({
      where: { userId, actividadId }
    });
    
    if (existente) {
      // Actualizar si la nueva puntuación es mayor
      if (puntuacion > existente.puntuacion) {
        await existente.update({ puntuacion, completada, fecha: new Date() });
      }
      return res.json(existente);
    }
    
    const progreso = await ProgresoActividad.create({
      userId,
      actividadId,
      puntuacion: puntuacion || 0,
      completada: completada || false,
      fecha: new Date()
    });
    
    res.status(201).json(progreso);
  } catch (error) {
    console.error('Error creating progreso:', error);
    res.status(500).json({ error: 'Error al guardar el progreso' });
  }
};

// DELETE - Eliminar progreso
export const remove = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const progreso = await ProgresoActividad.findByPk(id);
    if (!progreso) {
      return res.status(404).json({ error: 'Progreso no encontrado' });
    }
    
    await progreso.destroy();
    
    res.json({ message: 'Progreso eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting progreso:', error);
    res.status(500).json({ error: 'Error al eliminar el progreso' });
  }
};
