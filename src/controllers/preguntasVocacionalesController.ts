import { Request, Response } from 'express';
import { PreguntaVocacional, OpcionVocacional } from '../models';

interface OpcionInput {
  texto: string;
  rama: string;
}

interface PreguntaInput {
  pregunta: string;
  opciones: OpcionInput[];
}

// Validar datos de entrada
const validatePreguntaInput = (data: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!data.pregunta || typeof data.pregunta !== 'string' || data.pregunta.trim() === '') {
    errors.push('El campo "pregunta" es requerido y debe ser un texto no vacío');
  }
  
  if (!data.opciones || !Array.isArray(data.opciones) || data.opciones.length === 0) {
    errors.push('El campo "opciones" es requerido y debe ser un array no vacío');
  } else {
    data.opciones.forEach((opcion: any, index: number) => {
      if (!opcion.texto || typeof opcion.texto !== 'string' || opcion.texto.trim() === '') {
        errors.push(`Opción ${index + 1}: el campo "texto" es requerido`);
      }
      if (!opcion.rama || typeof opcion.rama !== 'string' || opcion.rama.trim() === '') {
        errors.push(`Opción ${index + 1}: el campo "rama" es requerido`);
      }
    });
  }
  
  return { valid: errors.length === 0, errors };
};

// GET - Obtener todas las preguntas vocacionales
export const getAll = async (req: Request, res: Response) => {
  try {
    const preguntas = await PreguntaVocacional.findAll({
      include: [{ model: OpcionVocacional, as: 'opciones' }],
      order: [['id', 'ASC']]
    });
    res.json(preguntas);
  } catch (error) {
    console.error('Error fetching preguntas vocacionales:', error);
    res.status(500).json({ error: 'Error al obtener las preguntas' });
  }
};

// GET - Obtener una pregunta por ID
export const getById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const pregunta = await PreguntaVocacional.findByPk(id, {
      include: [{ model: OpcionVocacional, as: 'opciones' }]
    });
    
    if (!pregunta) {
      return res.status(404).json({ error: 'Pregunta no encontrada' });
    }
    
    res.json(pregunta);
  } catch (error) {
    console.error('Error fetching pregunta vocacional:', error);
    res.status(500).json({ error: 'Error al obtener la pregunta' });
  }
};

// POST - Crear nueva pregunta vocacional
export const create = async (req: Request, res: Response) => {
  try {
    const validation = validatePreguntaInput(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: 'Validation failed', details: validation.errors });
    }
    
    const { pregunta, opciones } = req.body as PreguntaInput;
    
    const nuevaPregunta = await PreguntaVocacional.create({ pregunta });
    
    const opcionesCreadas = await Promise.all(
      opciones.map(opcion => 
        OpcionVocacional.create({
          preguntaId: nuevaPregunta.id,
          texto: opcion.texto,
          rama: opcion.rama
        })
      )
    );
    
    const preguntaConOpciones = await PreguntaVocacional.findByPk(nuevaPregunta.id, {
      include: [{ model: OpcionVocacional, as: 'opciones' }]
    });
    
    res.status(201).json(preguntaConOpciones);
  } catch (error) {
    console.error('Error creating pregunta vocacional:', error);
    res.status(500).json({ error: 'Error al crear la pregunta' });
  }
};

// PUT - Actualizar pregunta vocacional
export const update = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validation = validatePreguntaInput(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: 'Validation failed', details: validation.errors });
    }
    
    const preguntaExistente = await PreguntaVocacional.findByPk(id);
    if (!preguntaExistente) {
      return res.status(404).json({ error: 'Pregunta no encontrada' });
    }
    
    const { pregunta, opciones } = req.body as PreguntaInput;
    
    await preguntaExistente.update({ pregunta });
    
    // Eliminar opciones existentes y crear nuevas
    await OpcionVocacional.destroy({ where: { preguntaId: id } });
    
    await Promise.all(
      opciones.map(opcion => 
        OpcionVocacional.create({
          preguntaId: parseInt(id),
          texto: opcion.texto,
          rama: opcion.rama
        })
      )
    );
    
    const preguntaActualizada = await PreguntaVocacional.findByPk(id, {
      include: [{ model: OpcionVocacional, as: 'opciones' }]
    });
    
    res.json(preguntaActualizada);
  } catch (error) {
    console.error('Error updating pregunta vocacional:', error);
    res.status(500).json({ error: 'Error al actualizar la pregunta' });
  }
};

// DELETE - Eliminar pregunta vocacional
export const remove = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const pregunta = await PreguntaVocacional.findByPk(id);
    if (!pregunta) {
      return res.status(404).json({ error: 'Pregunta no encontrada' });
    }
    
    // Las opciones se eliminan automáticamente por CASCADE
    await pregunta.destroy();
    
    res.json({ message: 'Pregunta eliminada correctamente' });
  } catch (error) {
    console.error('Error deleting pregunta vocacional:', error);
    res.status(500).json({ error: 'Error al eliminar la pregunta' });
  }
};
