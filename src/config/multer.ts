import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// Tipos de archivos permitidos
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/x-msvideo']; // AVI

// Límites de tamaño
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const ramaId = req.params.id;
    const type = req.body.type || 'image';
    
    // Crear directorio si no existe
    const uploadDir = path.join(__dirname, '../../uploads/ramas', ramaId, type === 'video' ? 'videos' : 'images');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generar nombre único preservando la extensión
    const uniqueSuffix = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname);
    const type = req.body.type || 'image';
    const prefix = type === 'video' ? 'vid' : 'img';
    
    cb(null, `${prefix}-${uniqueSuffix}${ext}`);
  }
});

// Filtro de archivos
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const type = req.body.type || 'image';
  
  if (type === 'video') {
    if (ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Formato de video no válido. Solo se permiten MP4, WebM y AVI.'));
    }
  } else {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Formato de imagen no válido. Solo se permiten JPEG, PNG y WebP.'));
    }
  }
};

// Configuración de Multer para ramas (crear/editar con archivos)
export const uploadRamaFiles = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const ramaId = req.body.id || req.params.id;
      const isVideo = file.mimetype.startsWith('video/');
      
      // Crear directorio si no existe
      const uploadDir = path.join(__dirname, '../../uploads/ramas', ramaId, isVideo ? 'videos' : 'images');
      
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      // Generar nombre único preservando la extensión
      const uniqueSuffix = crypto.randomBytes(8).toString('hex');
      const ext = path.extname(file.originalname);
      const isVideo = file.mimetype.startsWith('video/');
      const prefix = isVideo ? 'vid' : 'img';
      
      cb(null, `${prefix}-${uniqueSuffix}${ext}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    const isVideo = file.mimetype.startsWith('video/');
    
    if (isVideo) {
      if (ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Formato de video no válido. Solo se permiten MP4, WebM y AVI.'));
      }
    } else {
      if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Formato de imagen no válido. Solo se permiten JPEG, PNG y WebP.'));
      }
    }
  },
  limits: {
    fileSize: MAX_VIDEO_SIZE
  }
});

// Configuración de Multer
export const uploadRamaMultimedia = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_VIDEO_SIZE // Usar el límite más alto, validaremos por tipo después
  }
});

// Validación adicional de tamaño por tipo
export const validateFileSize = (req: any, file: Express.Multer.File): boolean => {
  const type = req.body.type || 'image';
  
  if (type === 'video' && file.size > MAX_VIDEO_SIZE) {
    return false;
  }
  
  if (type === 'image' && file.size > MAX_IMAGE_SIZE) {
    return false;
  }
  
  return true;
};

export { MAX_IMAGE_SIZE, MAX_VIDEO_SIZE };
