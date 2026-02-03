/**
 * Unit Tests: User Management Service Edge Cases
 * Feature: panel-super-admin
 * 
 * Tests specific edge cases for user management operations
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import sequelize from '../config/database';
import Usuario from '../models/Usuario';
import UserManagementService from '../services/UserManagementService';

const createdUserIds: number[] = [];

beforeAll(async () => {
  await sequelize.sync();
});

afterAll(async () => {
  try {
    for (const id of createdUserIds) {
      await Usuario.destroy({ where: { id } });
    }
  } catch (error) {
    console.error('Error in cleanup:', error);
  }
});

describe('User Management Service - Edge Cases', () => {

  describe('Last Super Admin Protection', () => {
    
    it('should prevent deletion of last super admin', async () => {
      // Create a single super admin
      const superAdmin = await UserManagementService.createUser({
        nombre: 'Last',
        apellido: 'SuperAdmin',
        email: `lastsuperadmin${Date.now()}@test.com`,
        password: 'password123',
        rol: 'super_admin'
      });
      createdUserIds.push(superAdmin.id);

      // Create another user to act as requester
      const requester = await UserManagementService.createUser({
        nombre: 'Requester',
        apellido: 'User',
        email: `requester${Date.now()}@test.com`,
        password: 'password123',
        rol: 'admin'
      });
      createdUserIds.push(requester.id);

      // Ensure this is the only super admin
      const superAdminCount = await Usuario.count({ where: { rol: 'super_admin' } });
      if (superAdminCount > 1) {
        // Delete extra super admins for this test
        const allSuperAdmins = await Usuario.findAll({ where: { rol: 'super_admin' } });
        for (const sa of allSuperAdmins) {
          if (sa.id !== superAdmin.id) {
            await sa.destroy();
          }
        }
      }

      // Attempt to delete the last super admin
      try {
        await UserManagementService.deleteUser(superAdmin.id, requester.id);
        expect.fail('Should not be able to delete last super admin');
      } catch (error: any) {
        expect(error.message).toContain('último super administrador');
      }

      // Verify super admin still exists
      const stillExists = await Usuario.findByPk(superAdmin.id);
      expect(stillExists).toBeDefined();
    });

    it('should prevent demotion of last super admin', async () => {
      // Create a single super admin
      const superAdmin = await UserManagementService.createUser({
        nombre: 'Last',
        apellido: 'SuperAdmin2',
        email: `lastsuperadmin2${Date.now()}@test.com`,
        password: 'password123',
        rol: 'super_admin'
      });
      createdUserIds.push(superAdmin.id);

      // Create another user to act as requester
      const requester = await UserManagementService.createUser({
        nombre: 'Requester2',
        apellido: 'User',
        email: `requester2${Date.now()}@test.com`,
        password: 'password123',
        rol: 'admin'
      });
      createdUserIds.push(requester.id);

      // Ensure this is the only super admin
      const superAdminCount = await Usuario.count({ where: { rol: 'super_admin' } });
      if (superAdminCount > 1) {
        const allSuperAdmins = await Usuario.findAll({ where: { rol: 'super_admin' } });
        for (const sa of allSuperAdmins) {
          if (sa.id !== superAdmin.id) {
            await sa.destroy();
          }
        }
      }

      // Attempt to demote the last super admin
      try {
        await UserManagementService.changeUserRole(superAdmin.id, 'admin', requester.id);
        expect.fail('Should not be able to demote last super admin');
      } catch (error: any) {
        expect(error.message).toContain('último super administrador');
      }

      // Verify super admin still has super_admin role
      const stillSuperAdmin = await Usuario.findByPk(superAdmin.id);
      expect(stillSuperAdmin?.rol).toBe('super_admin');
    });

    it('should allow deletion of super admin when multiple exist', async () => {
      // Create two super admins
      const superAdmin1 = await UserManagementService.createUser({
        nombre: 'Super',
        apellido: 'Admin1',
        email: `superadmin1${Date.now()}@test.com`,
        password: 'password123',
        rol: 'super_admin'
      });
      createdUserIds.push(superAdmin1.id);

      const superAdmin2 = await UserManagementService.createUser({
        nombre: 'Super',
        apellido: 'Admin2',
        email: `superadmin2${Date.now()}@test.com`,
        password: 'password123',
        rol: 'super_admin'
      });
      createdUserIds.push(superAdmin2.id);

      // Delete one super admin (should succeed)
      await UserManagementService.deleteUser(superAdmin1.id, superAdmin2.id);

      // Verify deletion
      const deleted = await Usuario.findByPk(superAdmin1.id);
      expect(deleted).toBeNull();

      // Verify other super admin still exists
      const stillExists = await Usuario.findByPk(superAdmin2.id);
      expect(stillExists).toBeDefined();
    });

  });

  describe('Duplicate Email Prevention', () => {
    
    it('should prevent creating user with duplicate email', async () => {
      const email = `duplicate${Date.now()}@test.com`;
      
      // Create first user
      const user1 = await UserManagementService.createUser({
        nombre: 'First',
        apellido: 'User',
        email: email,
        password: 'password123',
        rol: 'student'
      });
      createdUserIds.push(user1.id);

      // Attempt to create second user with same email
      try {
        await UserManagementService.createUser({
          nombre: 'Second',
          apellido: 'User',
          email: email,
          password: 'password123',
          rol: 'student'
        });
        expect.fail('Should not allow duplicate email');
      } catch (error: any) {
        expect(error.message).toContain('email ya está registrado');
      }
    });

    it('should prevent updating user to duplicate email', async () => {
      // Create two users
      const user1 = await UserManagementService.createUser({
        nombre: 'User',
        apellido: 'One',
        email: `user1${Date.now()}@test.com`,
        password: 'password123',
        rol: 'student'
      });
      createdUserIds.push(user1.id);

      const user2 = await UserManagementService.createUser({
        nombre: 'User',
        apellido: 'Two',
        email: `user2${Date.now()}@test.com`,
        password: 'password123',
        rol: 'student'
      });
      createdUserIds.push(user2.id);

      // Attempt to update user2 to user1's email
      try {
        await UserManagementService.updateUser(user2.id, {
          email: user1.email
        });
        expect.fail('Should not allow duplicate email');
      } catch (error: any) {
        expect(error.message).toContain('email ya está registrado');
      }
    });

  });

  describe('Self-Deletion Prevention', () => {
    
    it('should prevent user from deleting themselves', async () => {
      const user = await UserManagementService.createUser({
        nombre: 'Self',
        apellido: 'Delete',
        email: `selfdelete${Date.now()}@test.com`,
        password: 'password123',
        rol: 'super_admin'
      });
      createdUserIds.push(user.id);

      // Create another super admin to avoid last super admin issue
      const anotherSuper = await UserManagementService.createUser({
        nombre: 'Another',
        apellido: 'Super',
        email: `anothersuper${Date.now()}@test.com`,
        password: 'password123',
        rol: 'super_admin'
      });
      createdUserIds.push(anotherSuper.id);

      // Attempt self-deletion
      try {
        await UserManagementService.deleteUser(user.id, user.id);
        expect.fail('Should not allow self-deletion');
      } catch (error: any) {
        expect(error.message).toContain('propia cuenta');
      }

      // Verify user still exists
      const stillExists = await Usuario.findByPk(user.id);
      expect(stillExists).toBeDefined();
    });

  });

  describe('Not Found Errors', () => {
    
    it('should throw error when updating non-existent user', async () => {
      const nonExistentId = 999999;
      
      try {
        await UserManagementService.updateUser(nonExistentId, {
          nombre: 'Updated'
        });
        expect.fail('Should throw error for non-existent user');
      } catch (error: any) {
        expect(error.message).toContain('no encontrado');
      }
    });

    it('should throw error when deleting non-existent user', async () => {
      const nonExistentId = 999999;
      const requester = await UserManagementService.createUser({
        nombre: 'Requester',
        apellido: 'User',
        email: `requester${Date.now()}@test.com`,
        password: 'password123',
        rol: 'super_admin'
      });
      createdUserIds.push(requester.id);
      
      try {
        await UserManagementService.deleteUser(nonExistentId, requester.id);
        expect.fail('Should throw error for non-existent user');
      } catch (error: any) {
        expect(error.message).toContain('no encontrado');
      }
    });

    it('should throw error when changing role of non-existent user', async () => {
      const nonExistentId = 999999;
      const requester = await UserManagementService.createUser({
        nombre: 'Requester',
        apellido: 'User',
        email: `requester${Date.now()}@test.com`,
        password: 'password123',
        rol: 'super_admin'
      });
      createdUserIds.push(requester.id);
      
      try {
        await UserManagementService.changeUserRole(nonExistentId, 'admin', requester.id);
        expect.fail('Should throw error for non-existent user');
      } catch (error: any) {
        expect(error.message).toContain('no encontrado');
      }
    });

  });

});
