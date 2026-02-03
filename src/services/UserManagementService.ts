/**
 * User Management Service
 * Feature: panel-super-admin
 * 
 * Business logic for user CRUD operations and role management
 */

import Usuario, { UserRole, UserStatus } from '../models/Usuario';
import { Op } from 'sequelize';
import { hashPassword } from '../controllers/authController';

export interface CreateUserRequest {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  rol: UserRole;
  activo?: boolean;
  estado?: UserStatus;
}

export interface UpdateUserRequest {
  nombre?: string;
  apellido?: string;
  email?: string;
  password?: string;
  rol?: UserRole;
  activo?: boolean;
  estado?: UserStatus;
}

export interface UserFilters {
  rol?: UserRole;
  search?: string;
}

export class UserManagementService {
  
  /**
   * Get all users with optional filtering
   * @param filters Optional filters for role and search
   * @returns Array of users
   */
  async getAllUsers(filters?: UserFilters): Promise<Usuario[]> {
    const where: any = {};

    // Filter by role if specified
    if (filters?.rol) {
      where.rol = filters.rol;
    }

    // Search by name, apellido, or email if specified
    if (filters?.search) {
      where[Op.or] = [
        { nombre: { [Op.like]: `%${filters.search}%` } },
        { apellido: { [Op.like]: `%${filters.search}%` } },
        { email: { [Op.like]: `%${filters.search}%` } }
      ];
    }

    const users = await Usuario.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });

    return users;
  }

  /**
   * Get single user by ID
   * @param id User ID
   * @returns User or null if not found
   */
  async getUserById(id: number): Promise<Usuario | null> {
    const user = await Usuario.findByPk(id);
    return user;
  }

  /**
   * Create new user with validation
   * @param data User creation data
   * @returns Created user
   */
  async createUser(data: CreateUserRequest): Promise<Usuario> {
    // Validate required fields
    if (!data.nombre || !data.apellido || !data.email || !data.password) {
      throw new Error('Todos los campos son requeridos: nombre, apellido, email, password');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new Error('Formato de email inválido');
    }

    // Validate password length
    if (data.password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }

    // Validate role
    const validRoles: UserRole[] = ['student', 'admin', 'super_admin'];
    if (!validRoles.includes(data.rol)) {
      throw new Error('Rol inválido. Debe ser: student, admin, o super_admin');
    }

    // Check if email already exists
    const existingUser = await Usuario.findOne({ where: { email: data.email } });
    if (existingUser) {
      throw new Error('El email ya está registrado');
    }

    // Hash password
    const hashedPassword = hashPassword(data.password);

    // Create user
    const user = await Usuario.create({
      nombre: data.nombre,
      apellido: data.apellido,
      email: data.email,
      password: hashedPassword,
      rol: data.rol,
      activo: data.activo !== undefined ? data.activo : true,
      estado: data.estado || 'aprobado'
    });

    return user;
  }

  /**
   * Update existing user with validation
   * @param id User ID
   * @param data Update data
   * @returns Updated user
   */
  async updateUser(id: number, data: UpdateUserRequest): Promise<Usuario> {
    const user = await Usuario.findByPk(id);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Validate email format if provided
    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        throw new Error('Formato de email inválido');
      }

      // Check if email is already taken by another user
      const existingUser = await Usuario.findOne({ 
        where: { 
          email: data.email,
          id: { [Op.ne]: id }
        } 
      });
      if (existingUser) {
        throw new Error('El email ya está registrado por otro usuario');
      }
    }

    // Validate password length if provided
    if (data.password && data.password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }

    // Validate role if provided
    if (data.rol) {
      const validRoles: UserRole[] = ['student', 'admin', 'super_admin'];
      if (!validRoles.includes(data.rol)) {
        throw new Error('Rol inválido. Debe ser: student, admin, o super_admin');
      }
    }

    // Update fields
    if (data.nombre) user.nombre = data.nombre;
    if (data.apellido) user.apellido = data.apellido;
    if (data.email) user.email = data.email;
    if (data.password) user.password = hashPassword(data.password);
    if (data.rol) user.rol = data.rol;
    if (data.activo !== undefined) user.activo = data.activo;
    if (data.estado) user.estado = data.estado;

    await user.save();
    return user;
  }

  /**
   * Delete user and handle cascading
   * @param id User ID to delete
   * @param requestingUserId ID of user making the request
   */
  async deleteUser(id: number, requestingUserId: number): Promise<void> {
    const user = await Usuario.findByPk(id);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Prevent deletion of last super admin
    await this.validateSuperAdminDeletion(id);

    // Prevent self-deletion (optional safety check)
    if (id === requestingUserId) {
      throw new Error('No puedes eliminar tu propia cuenta');
    }

    // Delete user (cascade will be handled by Sequelize associations)
    await user.destroy();
  }

  /**
   * Change user role with validation
   * @param id User ID
   * @param newRole New role to assign
   * @param requestingUserId ID of user making the request
   * @returns Updated user
   */
  async changeUserRole(
    id: number,
    newRole: UserRole,
    requestingUserId: number
  ): Promise<Usuario> {
    // Validate user cannot change their own role
    this.validateRoleChange(id, requestingUserId);

    const user = await Usuario.findByPk(id);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Validate role
    const validRoles: UserRole[] = ['student', 'admin', 'super_admin'];
    if (!validRoles.includes(newRole)) {
      throw new Error('Rol inválido. Debe ser: student, admin, o super_admin');
    }

    // If demoting from super_admin, check it's not the last one
    if (user.rol === 'super_admin' && newRole !== 'super_admin') {
      await this.validateSuperAdminDeletion(id);
    }

    // Update role
    user.rol = newRole;
    await user.save();

    return user;
  }

  /**
   * Validate user cannot change their own role
   * @param userId User ID being modified
   * @param requestingUserId User ID making the request
   */
  private validateRoleChange(userId: number, requestingUserId: number): void {
    if (userId === requestingUserId) {
      throw new Error('No puedes cambiar tu propio rol');
    }
  }

  /**
   * Prevent deletion or demotion of last super admin
   * @param userId User ID being deleted/demoted
   */
  private async validateSuperAdminDeletion(userId: number): Promise<void> {
    const user = await Usuario.findByPk(userId);
    if (!user || user.rol !== 'super_admin') {
      return; // Not a super admin, no validation needed
    }

    // Count total super admins
    const superAdminCount = await Usuario.count({
      where: { rol: 'super_admin' }
    });

    if (superAdminCount <= 1) {
      throw new Error('No se puede eliminar o degradar al último super administrador del sistema');
    }
  }
}

export default new UserManagementService();
