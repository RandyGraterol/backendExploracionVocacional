import { Router } from 'express';
import * as controller from '../controllers/soporteController';

const router = Router();

router.get('/', controller.getAll);
router.get('/user/:userId', controller.getByUserId);
router.post('/', controller.create);
router.put('/:id/respond', controller.respond);
router.delete('/:id', controller.remove);

export default router;
