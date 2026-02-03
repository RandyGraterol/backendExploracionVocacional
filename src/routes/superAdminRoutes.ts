/**
 * Super Admin Routes
 * Feature: panel-super-admin
 * 
 * Routes for super admin user management and system statistics
 */

import { Router } from 'express';
import { verifyToken, requireSuperAdmin } from '../middleware/auth';
import UserManagementController from '../controllers/UserManagementController';
import StatisticsController from '../controllers/StatisticsController';

const router = Router();

// Apply authentication and super admin authorization to all routes
router.use(verifyToken);
router.use(requireSuperAdmin);

// Statistics Routes
router.get('/statistics', StatisticsController.getSystemStatistics.bind(StatisticsController));

// User Management Routes
router.get('/users', UserManagementController.getAllUsers.bind(UserManagementController));
router.get('/users/:id', UserManagementController.getUserById.bind(UserManagementController));
router.post('/users', UserManagementController.createUser.bind(UserManagementController));
router.put('/users/:id', UserManagementController.updateUser.bind(UserManagementController));
router.delete('/users/:id', UserManagementController.deleteUser.bind(UserManagementController));
router.put('/users/:id/role', UserManagementController.changeUserRole.bind(UserManagementController));

export default router;
