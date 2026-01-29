import { Request, Response } from 'express';
import { Actividad } from '../models';

// GET - Obtener todas las actividades
export const getAll = async (req: Request, res: Response) => {
  try {
    const { rama } = req.query;
    const whereClause = rama ? { rama: rama as string } : {};
    
    const actividades = await Actividad.findAll({
      where: whereClause,
      order: [['rama', 'ASC'], ['title', 'ASC']]
    });
    
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
    const { id, title, description, rama, tipo, dificultad, imagen, icono, preguntas, itemsOrden, simulacion, ejercicioCodigo, paresDesafio } = req.body;
    
    if (!id || !title || !description || !rama || !tipo || !dificultad) {
      return res.status(400).json({ error: 'Campos requeridos: id, title, description, rama, tipo, dificultad' });
    }
    
    const actividad = await Actividad.create({
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
    });
    
    res.status(201).json(actividad);
  } catch (error) {
    console.error('Error creating actividad:', error);
    res.status(500).json({ error: 'Error al crear la actividad' });
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
