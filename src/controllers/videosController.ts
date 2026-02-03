import { Request, Response } from 'express';
import Video from '../models/Video';
import path from 'path';
import fs from 'fs';

// GET - Obtener todos los videos (con filtro opcional por rama)
export const getAll = async (req: Request, res: Response) => {
  try {
    const { rama } = req.query;
    const whereClause = rama ? { rama: rama as string } : {};
    
    const videos = await Video.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });
    
    res.json(videos);
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ error: 'Error al obtener los videos' });
  }
};

// GET - Obtener un video por ID
export const getById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const video = await Video.findByPk(id);
    
    if (!video) {
      return res.status(404).json({ error: 'Video no encontrado' });
    }
    
    res.json(video);
  } catch (error) {
    console.error('Error fetching video:', error);
    res.status(500).json({ error: 'Error al obtener el video' });
  }
};

// POST - Subir nuevo video
export const upload = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No se ha subido ningún archivo',
        details: 'Por favor selecciona un archivo de video para subir'
      });
    }
    
    const { titulo, descripcion, rama } = req.body;
    
    if (!titulo || !rama) {
      // Eliminar archivo si falta información
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ 
        error: 'Título y rama son requeridos',
        details: 'Por favor completa todos los campos obligatorios'
      });
    }
    
    // Validación adicional del archivo
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    if (fileExtension !== '.mp4') {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ 
        error: 'Extensión de archivo no permitida',
        details: 'Solo se aceptan archivos con extensión .mp4'
      });
    }
    
    // Validar mimetype
    if (req.file.mimetype !== 'video/mp4') {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ 
        error: 'Tipo de archivo no permitido',
        details: `El archivo tiene mimetype ${req.file.mimetype}. Solo se aceptan archivos video/mp4. Si descargaste este video de YouTube, puede tener un formato incompatible. Intenta convertirlo con una herramienta de video o graba un video directamente.`
      });
    }
    
    // Validar tamaño
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (req.file.size > maxSize) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ 
        error: 'Archivo demasiado grande',
        details: `El archivo tiene ${(req.file.size / (1024 * 1024)).toFixed(2)}MB. El tamaño máximo permitido es 100MB.`
      });
    }
    
    console.log('✅ Video validado correctamente:', {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: `${(req.file.size / (1024 * 1024)).toFixed(2)}MB`,
      titulo,
      rama
    });
    
    const video = await Video.create({
      titulo,
      descripcion: descripcion || '',
      rama,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
    
    res.status(201).json(video);
  } catch (error) {
    console.error('❌ Error uploading video:', error);
    // Eliminar archivo si hay error
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error eliminando archivo:', unlinkError);
      }
    }
    res.status(500).json({ 
      error: 'Error al subir el video',
      details: 'Ocurrió un error interno al procesar el video. Por favor intenta nuevamente.'
    });
  }
};

// PUT - Actualizar información del video
export const update = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion, rama } = req.body;
    
    const video = await Video.findByPk(id);
    if (!video) {
      return res.status(404).json({ error: 'Video no encontrado' });
    }
    
    await video.update({ titulo, descripcion, rama });
    
    res.json(video);
  } catch (error) {
    console.error('Error updating video:', error);
    res.status(500).json({ error: 'Error al actualizar el video' });
  }
};

// DELETE - Eliminar video
export const remove = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const video = await Video.findByPk(id);
    if (!video) {
      return res.status(404).json({ error: 'Video no encontrado' });
    }
    
    // Eliminar archivo físico
    const filePath = path.join(__dirname, '../../uploads/videos', video.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    await video.destroy();
    
    res.json({ message: 'Video eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({ error: 'Error al eliminar el video' });
  }
};

// GET - Servir archivo de video (streaming)
export const stream = async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../../uploads/videos', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }
    
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;
    
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });
      
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      });
      
      file.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      });
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    console.error('Error streaming video:', error);
    res.status(500).json({ error: 'Error al reproducir el video' });
  }
};
