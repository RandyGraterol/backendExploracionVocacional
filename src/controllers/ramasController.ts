import { Request, Response } from 'express';
import { Rama, Video } from '../models';

// GET - Obtener todas las ramas
export const getAll = async (_req: Request, res: Response) => {
  try {
    const ramas = await Rama.findAll({ order: [['titulo', 'ASC']] });
    
    // Para cada rama, obtener sus videos de la tabla videos
    const ramasConVideos = await Promise.all(
      ramas.map(async (rama) => {
        const ramaData = rama.toJSON();
        
        // Obtener videos de la tabla videos que pertenecen a esta rama
        const videosDeTabla = await Video.findAll({
          where: { rama: rama.id },
          order: [['createdAt', 'DESC']]
        });
        
        // Construir URLs de los videos - solo retornar filenames
        const videosUrls = videosDeTabla.map(video => video.filename);
        
        // Combinar videos del campo JSON con videos de la tabla
        const todosLosVideos = [...(ramaData.videos || []), ...videosUrls];
        
        return {
          ...ramaData,
          videos: todosLosVideos
        };
      })
    );
    
    res.json(ramasConVideos);
  } catch (error) {
    console.error('Error fetching ramas:', error);
    res.status(500).json({ error: 'Error al obtener las ramas' });
  }
};

// GET - Obtener una rama por ID
export const getById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rama = await Rama.findByPk(id);
    
    if (!rama) {
      return res.status(404).json({ error: 'Rama no encontrada' });
    }
    
    const ramaData = rama.toJSON();
    
    // Obtener videos de la tabla videos que pertenecen a esta rama
    const videosDeTabla = await Video.findAll({
      where: { rama: id },
      order: [['createdAt', 'DESC']]
    });
    
    // Construir URLs de los videos - solo retornar filenames
    const videosUrls = videosDeTabla.map(video => video.filename);
    
    // Combinar videos del campo JSON con videos de la tabla
    const todosLosVideos = [...(ramaData.videos || []), ...videosUrls];
    
    res.json({
      ...ramaData,
      videos: todosLosVideos
    });
  } catch (error) {
    console.error('Error fetching rama:', error);
    res.status(500).json({ error: 'Error al obtener la rama' });
  }
};

// POST - Crear nueva rama
export const create = async (req: Request, res: Response) => {
  try {
    const { id, titulo, descripcion, icono, tecnologias, aplicaciones } = req.body;
    
    if (!id || !titulo || !descripcion) {
      return res.status(400).json({ error: 'ID, título y descripción son requeridos' });
    }
    
    // Procesar archivos subidos
    const files = req.files as Express.Multer.File[] || [];
    const imagenes: string[] = [];
    const videos: string[] = [];
    
    files.forEach(file => {
      const isVideo = file.mimetype.startsWith('video/');
      const fileUrl = `/uploads/ramas/${id}/${isVideo ? 'videos' : 'images'}/${file.filename}`;
      
      if (isVideo) {
        videos.push(fileUrl);
      } else {
        imagenes.push(fileUrl);
      }
    });
    
    const rama = await Rama.create({
      id,
      titulo,
      descripcion,
      icono: icono || '📚',
      tecnologias: tecnologias ? (typeof tecnologias === 'string' ? JSON.parse(tecnologias) : tecnologias) : [],
      aplicaciones: aplicaciones ? (typeof aplicaciones === 'string' ? JSON.parse(aplicaciones) : aplicaciones) : [],
      imagenes,
      videos
    });
    
    res.status(201).json(rama);
  } catch (error) {
    console.error('Error creating rama:', error);
    res.status(500).json({ error: 'Error al crear la rama' });
  }
};

// PUT - Actualizar rama
export const update = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion, icono, tecnologias, aplicaciones } = req.body;
    
    const rama = await Rama.findByPk(id);
    if (!rama) {
      return res.status(404).json({ error: 'Rama no encontrada' });
    }
    
    // Validar campos requeridos si se proporcionan
    if (titulo !== undefined && (!titulo || titulo.trim() === '')) {
      return res.status(400).json({ error: 'El título no puede estar vacío' });
    }
    
    if (descripcion !== undefined && (!descripcion || descripcion.trim() === '')) {
      return res.status(400).json({ error: 'La descripción no puede estar vacía' });
    }
    
    // Procesar nuevos archivos subidos
    const files = req.files as Express.Multer.File[] || [];
    const nuevasImagenes: string[] = [];
    const nuevosVideos: string[] = [];
    
    files.forEach(file => {
      const isVideo = file.mimetype.startsWith('video/');
      const fileUrl = `/uploads/ramas/${id}/${isVideo ? 'videos' : 'images'}/${file.filename}`;
      
      if (isVideo) {
        nuevosVideos.push(fileUrl);
      } else {
        nuevasImagenes.push(fileUrl);
      }
    });
    
    // Actualizar solo los campos proporcionados, preservando los demás
    const updateData: any = {};
    
    if (titulo !== undefined) updateData.titulo = titulo;
    if (descripcion !== undefined) updateData.descripcion = descripcion;
    if (icono !== undefined) updateData.icono = icono;
    if (tecnologias !== undefined) {
      updateData.tecnologias = typeof tecnologias === 'string' ? JSON.parse(tecnologias) : tecnologias;
    }
    if (aplicaciones !== undefined) {
      updateData.aplicaciones = typeof aplicaciones === 'string' ? JSON.parse(aplicaciones) : aplicaciones;
    }
    
    // Agregar nuevos archivos a los existentes
    if (nuevasImagenes.length > 0) {
      updateData.imagenes = [...rama.imagenes, ...nuevasImagenes];
    }
    if (nuevosVideos.length > 0) {
      updateData.videos = [...rama.videos, ...nuevosVideos];
    }
    
    await rama.update(updateData);
    
    res.json(rama);
  } catch (error) {
    console.error('Error updating rama:', error);
    res.status(500).json({ error: 'Error al actualizar la rama' });
  }
};

// DELETE - Eliminar rama
export const remove = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const rama = await Rama.findByPk(id);
    if (!rama) {
      return res.status(404).json({ error: 'Rama no encontrada' });
    }
    
    await rama.destroy();
    
    res.json({ message: 'Rama eliminada correctamente' });
  } catch (error) {
    console.error('Error deleting rama:', error);
    res.status(500).json({ error: 'Error al eliminar la rama' });
  }
};
