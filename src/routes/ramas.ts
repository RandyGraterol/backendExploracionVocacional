import { Router } from 'express';
import * as controller from '../controllers/ramasController';
import * as multimediaController from '../controllers/multimediaController';
import { uploadRamaMultimedia, uploadRamaFiles } from '../config/multer';
import { verifyToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Rutas públicas (lectura)
router.get('/', controller.getAll);
router.get('/:id', controller.getById);

// Rutas protegidas (CRUD - requieren autenticación y rol admin)
// Permitir subir múltiples archivos al crear/editar
router.post('/', verifyToken, requireAdmin, uploadRamaFiles.array('files', 20), controller.create);
router.put('/:id', verifyToken, requireAdmin, uploadRamaFiles.array('files', 20), controller.update);
router.delete('/:id', verifyToken, requireAdmin, controller.remove);

// Rutas de multimedia (requieren autenticación y rol admin)
router.post('/:id/multimedia', verifyToken, requireAdmin, uploadRamaMultimedia.single('file'), multimediaController.uploadFile);
router.delete('/:id/multimedia/:filename', verifyToken, requireAdmin, multimediaController.deleteFile);

export default router;
