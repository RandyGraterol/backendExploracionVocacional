import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configuración de almacenamiento para videos generales (no de ramas)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/videos');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  },
  fileFilter: (req, file, cb) => {
    // Solo permitir archivos .mp4
    const allowedMimetype = 'video/mp4';
    const allowedExtension = '.mp4';
    
    console.log('🔍 Validando archivo:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      fieldname: file.fieldname
    });
    
    // Verificar extensión del archivo primero
    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (fileExtension !== allowedExtension) {
      console.log('❌ Extensión no permitida:', fileExtension);
      return cb(new Error(`Extensión de archivo no permitida: ${fileExtension}. Solo se aceptan archivos ${allowedExtension}`));
    }
    
    // Verificar mimetype
    if (file.mimetype !== allowedMimetype) {
      console.log('❌ Mimetype no permitido:', file.mimetype);
      return cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}. Solo se aceptan archivos ${allowedMimetype}. Si descargaste este video de YouTube, puede tener un codec incompatible. Intenta convertirlo o usar un video grabado directamente.`));
    }
    
    console.log('✅ Archivo validado correctamente');
    cb(null, true);
  }
});

export default upload;
