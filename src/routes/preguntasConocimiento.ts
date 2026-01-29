import { Router } from 'express';
import * as controller from '../controllers/preguntasConocimientoController';

const router = Router();

// GET /api/preguntas-conocimiento - Obtener todas las preguntas (con filtro opcional ?rama=X)
router.get('/', controller.getAll);

// GET /api/preguntas-conocimiento/:id - Obtener una pregunta por ID
router.get('/:id', controller.getById);

// POST /api/preguntas-conocimiento - Crear nueva pregunta
router.post('/', controller.create);

// PUT /api/preguntas-conocimiento/:id - Actualizar pregunta
router.put('/:id', controller.update);

// DELETE /api/preguntas-conocimiento/:id - Eliminar pregunta
router.delete('/:id', controller.remove);

export default router;
