import { Request, Response } from 'express';
import { ResultadoTest, Usuario } from '../models';

// GET - Obtener todos los resultados
export const getAll = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    const whereClause = userId ? { userId: parseInt(userId as string) } : {};
    
    const resultados = await ResultadoTest.findAll({
      where: whereClause,
      include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'apellido', 'email'] }],
      order: [['fecha', 'DESC']]
    });
    
    res.json(resultados);
  } catch (error) {
    console.error('Error fetching resultados:', error);
    res.status(500).json({ error: 'Error al obtener los resultados' });
  }
};

// GET - Obtener resultados por usuario
export const getByUserId = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const resultados = await ResultadoTest.findAll({
      where: { userId: parseInt(userId) },
      order: [['fecha', 'DESC']]
    });
    
    res.json(resultados);
  } catch (error) {
    console.error('Error fetching resultados:', error);
    res.status(500).json({ error: 'Error al obtener los resultados' });
  }
};

// POST - Guardar resultado de test
export const create = async (req: Request, res: Response) => {
  try {
    const { userId, ramaRecomendada, puntuaciones, respuestas } = req.body;
    
    if (!userId || !ramaRecomendada || !puntuaciones) {
      return res.status(400).json({ error: 'userId, ramaRecomendada y puntuaciones son requeridos' });
    }
    
    const resultado = await ResultadoTest.create({
      userId,
      ramaRecomendada,
      puntuaciones,
      respuestas,
      fecha: new Date()
    });
    
    res.status(201).json(resultado);
  } catch (error) {
    console.error('Error creating resultado:', error);
    res.status(500).json({ error: 'Error al guardar el resultado' });
  }
};

// DELETE - Eliminar resultado
export const remove = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const resultado = await ResultadoTest.findByPk(id);
    if (!resultado) {
      return res.status(404).json({ error: 'Resultado no encontrado' });
    }
    
    await resultado.destroy();
    
    res.json({ message: 'Resultado eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting resultado:', error);
    res.status(500).json({ error: 'Error al eliminar el resultado' });
  }
};
