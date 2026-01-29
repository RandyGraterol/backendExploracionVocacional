import { Request, Response } from 'express';
import { Rama } from '../models';
import path from 'path';
import fs from 'fs';
import { validateFileSize } from '../config/multer';

// POST - Subir archivo multimedia a una rama
export const uploadFile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const type = req.body.type || 'image';
    
    // Verificar que se subió un archivo
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
    }
    
    // Validar tamaño del archivo según tipo
    if (!validateFileSize(req, req.file)) {
      // Eliminar archivo si excede el tamaño
      fs.unlinkSync(req.file.path);
      const maxSize = type === 'video' ? '100MB' : '10MB';
      return res.status(400).json({ 
        error: `El archivo excede el tamaño máximo permitido de ${maxSize}` 
      });
    }
    
    // Buscar la rama
    const rama = await Rama.findByPk(id);
    if (!rama) {
      // Eliminar archivo si la rama no existe
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Rama no encontrada' });
    }
    
    // Construir la URL del archivo
    const fileUrl = `/uploads/ramas/${id}/${type === 'video' ? 'videos' : 'images'}/${req.file.filename}`;
    
    // Actualizar el array correspondiente en la rama
    if (type === 'video') {
      const videos = rama.videos || [];
      videos.push(fileUrl);
      await rama.update({ videos });
    } else {
      const imagenes = rama.imagenes || [];
      imagenes.push(fileUrl);
      await rama.update({ imagenes });
    }
    
    res.status(201).json({
      success: true,
      message: 'Archivo subido exitosamente',
      data: {
        url: fileUrl,
        type,
        filename: req.file.filename
      }
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    
    // Limpiar archivo en caso de error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Error al subir el archivo' });
  }
};

// DELETE - Eliminar archivo multimedia específico
export const deleteFile = async (req: Request, res: Response) => {
  try {
    const { id, filename } = req.params;
    
    // Buscar la rama
    const rama = await Rama.findByPk(id);
    if (!rama) {
      return res.status(404).json({ error: 'Rama no encontrada' });
    }
    
    // Determinar si es imagen o video buscando en ambos arrays
    let fileType: 'image' | 'video' | null = null;
    let fileUrl: string | null = null;
    
    // Buscar en imágenes
    const imageUrl = rama.imagenes.find(img => img.includes(filename));
    if (imageUrl) {
      fileType = 'image';
      fileUrl = imageUrl;
    }
    
    // Buscar en videos si no se encontró en imágenes
    if (!fileUrl) {
      const videoUrl = rama.videos.find(vid => vid.includes(filename));
      if (videoUrl) {
        fileType = 'video';
        fileUrl = videoUrl;
      }
    }
    
    if (!fileUrl || !fileType) {
      return res.status(404).json({ error: 'Archivo no encontrado en la rama' });
    }
    
    // Construir ruta del archivo en el sistema
    const filePath = path.join(__dirname, '../../', fileUrl);
    
    // Eliminar archivo del sistema de archivos
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Actualizar el array correspondiente en la base de datos
    if (fileType === 'video') {
      const videos = rama.videos.filter(vid => vid !== fileUrl);
      await rama.update({ videos });
    } else {
      const imagenes = rama.imagenes.filter(img => img !== fileUrl);
      await rama.update({ imagenes });
    }
    
    res.json({
      success: true,
      message: 'Archivo eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Error al eliminar el archivo' });
  }
};
