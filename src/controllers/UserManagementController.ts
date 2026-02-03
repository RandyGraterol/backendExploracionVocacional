/**
 * User Management Controller
 * Feature: panel-super-admin
 * 
 * Handles HTTP requests for user management operations
 */

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import UserManagementService from '../services/UserManagementService';
import { UserRole } from '../models/Usuario';

export class UserManagementController {
  
  /**
   * GET /api/super-admin/users
   * Get all users with optional filters
   */
  async getAllUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { rol, search } = req.query;

      const filters: any = {};
      if (rol) filters.rol = rol as UserRole;
      if (search) filters.search = search as string;

      const users = await UserManagementService.getAllUsers(filters);
      
      res.status(200).json(users);
    } catch (error: any) {
      console.error('Error getting users:', error);
      res.status(500).json({ error: 'Error al obtener usuarios' });
    }
  }

  /**
   * GET /api/super-admin/users/:id
   * Get user by ID
   */
  async getUserById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = parseInt(id);

      if (isNaN(userId)) {
        res.status(400).json({ error: 'ID de usuario inválido' });
        return;
      }

      const user = await UserManagementService.getUserById(userId);
      
      if (!user) {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }

      res.status(200).json(user);
    } catch (error: any) {
      console.error('Error getting user:', error);
      res.status(500).json({ error: 'Error al obtener usuario' });
    }
  }

  /**
   * POST /api/super-admin/users
   * Create new user
   */
  async createUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { nombre, apellido, email, password, rol, activo, estado } = req.body;

      // Validate required fields
      if (!nombre || !apellido || !email || !password || !rol) {
        res.status(400).json({ 
          error: 'Campos requeridos: nombre, apellido, email, password, rol' 
        });
        return;
      }

      const user = await UserManagementService.createUser({
        nombre,
        apellido,
        email,
        password,
        rol,
        activo,
        estado
      });

      res.status(201).json(user);
    } catch (error: any) {
      console.error('Error creating user:', error);
      
      // Return specific error messages
      if (error.message.includes('email ya está registrado')) {
        res.status(409).json({ error: error.message });
        return;
      }
      if (error.message.includes('inválido') || error.message.includes('requeridos')) {
        res.status(400).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: 'Error al crear usuario' });
    }
  }

  /**
   * PUT /api/super-admin/users/:id
   * Update user
   */
  async updateUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = parseInt(id);

      if (isNaN(userId)) {
        res.status(400).json({ error: 'ID de usuario inválido' });
        return;
      }

      const { nombre, apellido, email, password, rol, activo, estado } = req.body;

      const user = await UserManagementService.updateUser(userId, {
        nombre,
        apellido,
        email,
        password,
        rol,
        activo,
        estado
      });

      res.status(200).json(user);
    } catch (error: any) {
      console.error('Error updating user:', error);
      
      // Return specific error messages
      if (error.message.includes('no encontrado')) {
        res.status(404).json({ error: error.message });
        return;
      }
      if (error.message.includes('email ya está registrado')) {
        res.status(409).json({ error: error.message });
        return;
      }
      if (error.message.includes('inválido')) {
        res.status(400).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: 'Error al actualizar usuario' });
    }
  }

  /**
   * DELETE /api/super-admin/users/:id
   * Delete user
   */
  async deleteUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = parseInt(id);

      if (isNaN(userId)) {
        res.status(400).json({ error: 'ID de usuario inválido' });
        return;
      }

      if (!req.user) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }

      await UserManagementService.deleteUser(userId, req.user.id);

      res.status(200).json({ message: 'Usuario eliminado correctamente' });
    } catch (error: any) {
      console.error('Error deleting user:', error);
      
      // Return specific error messages
      if (error.message.includes('no encontrado')) {
        res.status(404).json({ error: error.message });
        return;
      }
      if (error.message.includes('último super administrador') || 
          error.message.includes('propia cuenta')) {
        res.status(409).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: 'Error al eliminar usuario' });
    }
  }

  /**
   * PUT /api/super-admin/users/:id/role
   * Change user role
   */
  async changeUserRole(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = parseInt(id);

      if (isNaN(userId)) {
        res.status(400).json({ error: 'ID de usuario inválido' });
        return;
      }

      const { rol } = req.body;

      if (!rol) {
        res.status(400).json({ error: 'Campo requerido: rol' });
        return;
      }

      if (!req.user) {
        res.status(401).json({ error: 'No autenticado' });
        return;
      }

      const user = await UserManagementService.changeUserRole(
        userId,
        rol,
        req.user.id
      );

      res.status(200).json(user);
    } catch (error: any) {
      console.error('Error changing user role:', error);
      
      // Return specific error messages
      if (error.message.includes('no encontrado')) {
        res.status(404).json({ error: error.message });
        return;
      }
      if (error.message.includes('propio rol') || 
          error.message.includes('último super administrador')) {
        res.status(409).json({ error: error.message });
        return;
      }
      if (error.message.includes('inválido')) {
        res.status(400).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: 'Error al cambiar rol de usuario' });
    }
  }
}

export default new UserManagementController();
