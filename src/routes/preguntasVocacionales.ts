import { Router } from 'express';
import * as controller from '../controllers/preguntasVocacionalesController';

const router = Router();

// GET /api/preguntas-vocacionales - Obtener todas las preguntas
router.get('/', controller.getAll);

// GET /api/preguntas-vocacionales/:id - Obtener una pregunta por ID
router.get('/:id', controller.getById);

// POST /api/preguntas-vocacionales - Crear nueva pregunta
router.post('/', controller.create);

// PUT /api/preguntas-vocacionales/:id - Actualizar pregunta
router.put('/:id', controller.update);

// DELETE /api/preguntas-vocacionales/:id - Eliminar pregunta
router.delete('/:id', controller.remove);

export default router;
