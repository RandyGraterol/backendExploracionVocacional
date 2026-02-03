import { Router } from 'express';
import * as controller from '../controllers/progresoActividadesController';

const router = Router();

router.get('/', controller.getAll);
router.get('/user/:userId', controller.getByUserId);
router.post('/', controller.create);
router.delete('/:id', controller.remove);

export default router;
