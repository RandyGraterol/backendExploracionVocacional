import { Request, Response } from 'express';
import { PreguntaConocimiento, OpcionConocimiento } from '../models';

interface OpcionInput {
  texto: string;
  indice: number;
}

interface PreguntaInput {
  pregunta: string;
  rama: string;
  correcta: number;
  opciones: OpcionInput[];
}

// Validar datos de entrada
const validatePreguntaInput = (data: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!data.pregunta || typeof data.pregunta !== 'string' || data.pregunta.trim() === '') {
    errors.push('El campo "pregunta" es requerido y debe ser un texto no vacío');
  }
  
  if (!data.rama || typeof data.rama !== 'string' || data.rama.trim() === '') {
    errors.push('El campo "rama" es requerido y debe ser un texto no vacío');
  }
  
  if (data.correcta === undefined || typeof data.correcta !== 'number' || data.correcta < 0 || data.correcta > 3) {
    errors.push('El campo "correcta" es requerido y debe ser un número entre 0 y 3');
  }
  
  if (!data.opciones || !Array.isArray(data.opciones) || data.opciones.length === 0) {
    errors.push('El campo "opciones" es requerido y debe ser un array no vacío');
  } else {
    data.opciones.forEach((opcion: any, index: number) => {
      if (!opcion.texto || typeof opcion.texto !== 'string' || opcion.texto.trim() === '') {
        errors.push(`Opción ${index + 1}: el campo "texto" es requerido`);
      }
      if (opcion.indice === undefined || typeof opcion.indice !== 'number' || opcion.indice < 0 || opcion.indice > 3) {
        errors.push(`Opción ${index + 1}: el campo "indice" debe ser un número entre 0 y 3`);
      }
    });
  }
  
  return { valid: errors.length === 0, errors };
};

// GET - Obtener todas las preguntas de conocimiento (con filtro opcional por rama)
export const getAll = async (req: Request, res: Response) => {
  try {
    const { rama } = req.query;
    
    const whereClause = rama ? { rama: rama as string } : {};
    
    const preguntas = await PreguntaConocimiento.findAll({
      where: whereClause,
      include: [{ model: OpcionConocimiento, as: 'opciones' }],
      order: [['rama', 'ASC'], ['id', 'ASC']]
    });
    
    res.json(preguntas);
  } catch (error) {
    console.error('Error fetching preguntas conocimiento:', error);
    res.status(500).json({ error: 'Error al obtener las preguntas' });
  }
};

// GET - Obtener una pregunta por ID
export const getById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const pregunta = await PreguntaConocimiento.findByPk(id, {
      include: [{ model: OpcionConocimiento, as: 'opciones' }]
    });
    
    if (!pregunta) {
      return res.status(404).json({ error: 'Pregunta no encontrada' });
    }
    
    res.json(pregunta);
  } catch (error) {
    console.error('Error fetching pregunta conocimiento:', error);
    res.status(500).json({ error: 'Error al obtener la pregunta' });
  }
};

// POST - Crear nueva pregunta de conocimiento
export const create = async (req: Request, res: Response) => {
  try {
    const validation = validatePreguntaInput(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: 'Validation failed', details: validation.errors });
    }
    
    const { pregunta, rama, correcta, opciones } = req.body as PreguntaInput;
    
    const nuevaPregunta = await PreguntaConocimiento.create({ pregunta, rama, correcta });
    
    await Promise.all(
      opciones.map(opcion => 
        OpcionConocimiento.create({
          preguntaId: nuevaPregunta.id,
          texto: opcion.texto,
          indice: opcion.indice
        })
      )
    );
    
    const preguntaConOpciones = await PreguntaConocimiento.findByPk(nuevaPregunta.id, {
      include: [{ model: OpcionConocimiento, as: 'opciones' }]
    });
    
    res.status(201).json(preguntaConOpciones);
  } catch (error) {
    console.error('Error creating pregunta conocimiento:', error);
    res.status(500).json({ error: 'Error al crear la pregunta' });
  }
};

// PUT - Actualizar pregunta de conocimiento
export const update = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validation = validatePreguntaInput(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: 'Validation failed', details: validation.errors });
    }
    
    const preguntaExistente = await PreguntaConocimiento.findByPk(id);
    if (!preguntaExistente) {
      return res.status(404).json({ error: 'Pregunta no encontrada' });
    }
    
    const { pregunta, rama, correcta, opciones } = req.body as PreguntaInput;
    
    await preguntaExistente.update({ pregunta, rama, correcta });
    
    // Eliminar opciones existentes y crear nuevas
    await OpcionConocimiento.destroy({ where: { preguntaId: id } });
    
    await Promise.all(
      opciones.map(opcion => 
        OpcionConocimiento.create({
          preguntaId: parseInt(id),
          texto: opcion.texto,
          indice: opcion.indice
        })
      )
    );
    
    const preguntaActualizada = await PreguntaConocimiento.findByPk(id, {
      include: [{ model: OpcionConocimiento, as: 'opciones' }]
    });
    
    res.json(preguntaActualizada);
  } catch (error) {
    console.error('Error updating pregunta conocimiento:', error);
    res.status(500).json({ error: 'Error al actualizar la pregunta' });
  }
};

// DELETE - Eliminar pregunta de conocimiento
export const remove = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const pregunta = await PreguntaConocimiento.findByPk(id);
    if (!pregunta) {
      return res.status(404).json({ error: 'Pregunta no encontrada' });
    }
    
    // Las opciones se eliminan automáticamente por CASCADE
    await pregunta.destroy();
    
    res.json({ message: 'Pregunta eliminada correctamente' });
  } catch (error) {
    console.error('Error deleting pregunta conocimiento:', error);
    res.status(500).json({ error: 'Error al eliminar la pregunta' });
  }
};
