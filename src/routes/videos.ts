import { Router } from 'express';
import * as controller from '../controllers/videosController';
import upload from '../config/multerVideos';

const router = Router();

// GET /api/videos - Obtener todos los videos (con filtro opcional ?rama=X)
router.get('/', controller.getAll);

// GET /api/videos/stream/:filename - Streaming de video
router.get('/stream/:filename', controller.stream);

// GET /api/videos/:id - Obtener un video por ID
router.get('/:id', controller.getById);

// POST /api/videos - Subir nuevo video
router.post('/', upload.single('video'), controller.upload);

// PUT /api/videos/:id - Actualizar información del video
router.put('/:id', controller.update);

// DELETE /api/videos/:id - Eliminar video
router.delete('/:id', controller.remove);

export default router;
