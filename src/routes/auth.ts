import { Router } from 'express';
import * as controller from '../controllers/authController';
import { verifyToken, requireAdmin, requireSuperAdmin } from '../middleware/auth';

const router = Router();

// POST /api/auth/register - Registrar nuevo usuario
router.post('/register', controller.register);

// POST /api/auth/login - Iniciar sesión
router.post('/login', controller.login);

// GET /api/auth/me - Obtener usuario actual
router.get('/me', controller.getMe);

// GET /api/auth/users - Obtener todos los usuarios (solo admin)
router.get('/users', verifyToken, requireAdmin, controller.getAllUsers);

// PUT /api/auth/users/:id - Actualizar usuario (solo admin)
router.put('/users/:id', verifyToken, requireAdmin, controller.updateUser);

// DELETE /api/auth/users/:id - Eliminar usuario (solo admin)
router.delete('/users/:id', verifyToken, requireAdmin, controller.deleteUser);

// POST /api/auth/users/:id/aprobar - Aprobar usuario (solo admin)
router.post('/users/:id/aprobar', verifyToken, requireAdmin, controller.aprobarUser);

// POST /api/auth/users/:id/rechazar - Rechazar usuario (solo admin)
router.post('/users/:id/rechazar', verifyToken, requireAdmin, controller.rechazarUser);

// POST /api/auth/create-admin - Crear administrador (solo super_admin)
router.post('/create-admin', verifyToken, requireSuperAdmin, controller.createAdmin);

export default router;
