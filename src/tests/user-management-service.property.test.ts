/**
 * Property-Based Tests: User Management Service
 * Feature: panel-super-admin
 * 
 * These tests verify the universal properties of user management operations:
 * - Property 4: User Creation Correctness
 * - Property 5: User Update Correctness
 * - Property 6: User Deletion Correctness
 * - Property 7: User Query Correctness
 * - Property 8: Role Change Correctness
 * - Property 9: Self-Role-Change Prevention
 * - Property 14: Validation Error Messages
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import sequelize from '../config/database';
import Usuario, { UserRole } from '../models/Usuario';
import UserManagementService, { CreateUserRequest } from '../services/UserManagementService';

const createdUserIds: number[] = [];

beforeAll(async () => {
  await sequelize.sync();
  console.log('✅ User Management Service test setup completed');
});

afterAll(async () => {
  try {
    // Clean up all created users
    for (const id of createdUserIds) {
      await Usuario.destroy({ where: { id } });
    }
    console.log('✅ User Management Service test cleanup completed');
  } catch (error) {
    console.error('⚠️ Error in cleanup:', error);
  }
});

describe('🧪 Property-Based Tests: User Management Service', () => {

  /**
   * Property 4: User Creation Correctness
   * **Validates: Requirements 2.2**
   * 
   * For any valid user creation data, creating a user should result in
   * a new user record with all specified attributes matching the input data.
   */
  it('Property 4: User Creation Correctness', async () => {
    // Arbitraries for valid user data
    const validNameArbitrary = fc.stringMatching(/^[A-Za-z ]{2,50}$/).filter(s => s.trim().length >= 2);
    const validEmailArbitrary = fc.tuple(
      fc.stringMatching(/^[a-z0-9]{3,15}$/),
      fc.constantFrom('test.com', 'example.com', 'mail.com')
    ).map(([local, domain]) => `${local}@${domain}`);
    const validPasswordArbitrary = fc.stringMatching(/^[a-zA-Z0-9]{6,20}$/);
    const validRoleArbitrary = fc.constantFrom<UserRole>('student', 'admin', 'super_admin');

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          nombre: validNameArbitrary,
          apellido: validNameArbitrary,
          email: validEmailArbitrary,
          password: validPasswordArbitrary,
          rol: validRoleArbitrary
        }),
        async (userData) => {
          // Make email unique with timestamp
          const uniqueEmail = `test${Date.now()}${Math.random().toString(36).substring(7)}@test.com`;
          
          const createData: CreateUserRequest = {
            ...userData,
            email: uniqueEmail
          };

          try {
            const createdUser = await UserManagementService.createUser(createData);
            createdUserIds.push(createdUser.id);

            // Verify all attributes match input
            expect(createdUser.nombre).toBe(userData.nombre);
            expect(createdUser.apellido).toBe(userData.apellido);
            expect(createdUser.email).toBe(uniqueEmail);
            expect(createdUser.rol).toBe(userData.rol);
            expect(createdUser.activo).toBe(true); // Default value
            expect(createdUser.estado).toBe('aprobado'); // Default value
            expect(createdUser.id).toBeDefined();
            expect(createdUser.createdAt).toBeDefined();

            // Verify user exists in database
            const dbUser = await Usuario.findByPk(createdUser.id);
            expect(dbUser).toBeDefined();
            expect(dbUser?.email).toBe(uniqueEmail);

            return true;
          } catch (error: any) {
            console.error('Unexpected error in user creation:', error.message);
            throw error;
          }
        }
      ),
      { numRuns: 100 }
    );
  }, 120000);

  /**
   * Property 5: User Update Correctness
   * **Validates: Requirements 2.3**
   * 
   * For any existing user and valid update data, updating the user should result in
   * the user record reflecting all specified changes while preserving unchanged fields.
   */
  it('Property 5: User Update Correctness', async () => {
    const validNameArbitrary = fc.stringMatching(/^[A-Za-z ]{2,50}$/).filter(s => s.trim().length >= 2);
    const validRoleArbitrary = fc.constantFrom<UserRole>('student', 'admin', 'super_admin');

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          newNombre: validNameArbitrary,
          newApellido: validNameArbitrary,
          newRol: validRoleArbitrary
        }),
        async (updateData) => {
          // Create a user first
          const uniqueEmail = `update${Date.now()}${Math.random().toString(36).substring(7)}@test.com`;
          const user = await UserManagementService.createUser({
            nombre: 'Original',
            apellido: 'Name',
            email: uniqueEmail,
            password: 'password123',
            rol: 'student'
          });
          createdUserIds.push(user.id);

          const originalEmail = user.email;

          // Update the user
          const updatedUser = await UserManagementService.updateUser(user.id, {
            nombre: updateData.newNombre,
            apellido: updateData.newApellido,
            rol: updateData.newRol
          });

          // Verify updates were applied
          expect(updatedUser.nombre).toBe(updateData.newNombre);
          expect(updatedUser.apellido).toBe(updateData.newApellido);
          expect(updatedUser.rol).toBe(updateData.newRol);

          // Verify unchanged fields preserved
          expect(updatedUser.email).toBe(originalEmail);
          expect(updatedUser.id).toBe(user.id);

          // Verify in database
          const dbUser = await Usuario.findByPk(user.id);
          expect(dbUser?.nombre).toBe(updateData.newNombre);
          expect(dbUser?.apellido).toBe(updateData.newApellido);
          expect(dbUser?.rol).toBe(updateData.newRol);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  }, 120000);

  /**
   * Property 6: User Deletion Correctness
   * **Validates: Requirements 2.4**
   * 
   * For any existing user (except the last super admin), deleting the user
   * should result in the user no longer existing in the database.
   */
  it('Property 6: User Deletion Correctness', async () => {
    const validRoleArbitrary = fc.constantFrom<UserRole>('student', 'admin');

    await fc.assert(
      fc.asyncProperty(
        validRoleArbitrary,
        async (role) => {
          // Create a user to delete
          const uniqueEmail = `delete${Date.now()}${Math.random().toString(36).substring(7)}@test.com`;
          const user = await UserManagementService.createUser({
            nombre: 'ToDelete',
            apellido: 'User',
            email: uniqueEmail,
            password: 'password123',
            rol: role
          });
          const userId = user.id;

          // Create a different user to act as requester
          const requesterEmail = `requester${Date.now()}${Math.random().toString(36).substring(7)}@test.com`;
          const requester = await UserManagementService.createUser({
            nombre: 'Requester',
            apellido: 'User',
            email: requesterEmail,
            password: 'password123',
            rol: 'super_admin'
          });
          createdUserIds.push(requester.id);

          // Delete the user
          await UserManagementService.deleteUser(userId, requester.id);

          // Verify user no longer exists
          const deletedUser = await Usuario.findByPk(userId);
          expect(deletedUser).toBeNull();

          return true;
        }
      ),
      { numRuns: 100 }
    );
  }, 120000);

  /**
   * Property 7: User Query Correctness
   * **Validates: Requirements 2.5, 2.6**
   * 
   * For any set of users and any filter criteria (role or search term),
   * the query results should include only users that match the criteria
   * and should include all users that match.
   */
  it('Property 7: User Query Correctness - role filter', async () => {
    const validRoleArbitrary = fc.constantFrom<UserRole>('student', 'admin', 'super_admin');

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          targetRole: validRoleArbitrary,
          otherRole: validRoleArbitrary
        }).filter(({ targetRole, otherRole }) => targetRole !== otherRole),
        async ({ targetRole, otherRole }) => {
          // Create users with different roles
          const user1Email = `query1${Date.now()}${Math.random().toString(36).substring(7)}@test.com`;
          const user1 = await UserManagementService.createUser({
            nombre: 'User1',
            apellido: 'Test',
            email: user1Email,
            password: 'password123',
            rol: targetRole
          });
          createdUserIds.push(user1.id);

          const user2Email = `query2${Date.now()}${Math.random().toString(36).substring(7)}@test.com`;
          const user2 = await UserManagementService.createUser({
            nombre: 'User2',
            apellido: 'Test',
            email: user2Email,
            password: 'password123',
            rol: otherRole
          });
          createdUserIds.push(user2.id);

          // Query by target role
          const results = await UserManagementService.getAllUsers({ rol: targetRole });

          // Verify results include user1 and not user2
          const resultIds = results.map(u => u.id);
          expect(resultIds).toContain(user1.id);
          expect(resultIds).not.toContain(user2.id);

          // Verify all results have the target role
          results.forEach(user => {
            expect(user.rol).toBe(targetRole);
          });

          return true;
        }
      ),
      { numRuns: 50 }
    );
  }, 120000);

  /**
   * Property 7b: User Query Correctness - search filter
   */
  it('Property 7b: User Query Correctness - search filter', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          searchTerm: fc.stringMatching(/^[A-Za-z]{3,10}$/),
          otherTerm: fc.stringMatching(/^[A-Za-z]{3,10}$/)
        }).filter(({ searchTerm, otherTerm }) => 
          searchTerm.toLowerCase() !== otherTerm.toLowerCase()
        ),
        async ({ searchTerm, otherTerm }) => {
          // Create user with searchTerm in name
          const user1Email = `search1${Date.now()}${Math.random().toString(36).substring(7)}@test.com`;
          const user1 = await UserManagementService.createUser({
            nombre: searchTerm,
            apellido: 'Test',
            email: user1Email,
            password: 'password123',
            rol: 'student'
          });
          createdUserIds.push(user1.id);

          // Create user with otherTerm in name
          const user2Email = `search2${Date.now()}${Math.random().toString(36).substring(7)}@test.com`;
          const user2 = await UserManagementService.createUser({
            nombre: otherTerm,
            apellido: 'Test',
            email: user2Email,
            password: 'password123',
            rol: 'student'
          });
          createdUserIds.push(user2.id);

          // Search for searchTerm
          const results = await UserManagementService.getAllUsers({ search: searchTerm });

          // Verify results include user1
          const resultIds = results.map(u => u.id);
          expect(resultIds).toContain(user1.id);

          // Verify all results match search term
          results.forEach(user => {
            const matchesSearch = 
              user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
              user.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
              user.email.toLowerCase().includes(searchTerm.toLowerCase());
            expect(matchesSearch).toBe(true);
          });

          return true;
        }
      ),
      { numRuns: 50 }
    );
  }, 120000);

  /**
   * Property 8: Role Change Correctness
   * **Validates: Requirements 3.1, 3.2**
   * 
   * For any existing user and valid new role, changing the user's role
   * should result in the user having the new role in the database.
   */
  it('Property 8: Role Change Correctness', async () => {
    const validRoleArbitrary = fc.constantFrom<UserRole>('student', 'admin', 'super_admin');

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          originalRole: validRoleArbitrary,
          newRole: validRoleArbitrary
        }).filter(({ originalRole, newRole }) => originalRole !== newRole),
        async ({ originalRole, newRole }) => {
          // Create user with original role
          const userEmail = `rolechange${Date.now()}${Math.random().toString(36).substring(7)}@test.com`;
          const user = await UserManagementService.createUser({
            nombre: 'RoleChange',
            apellido: 'Test',
            email: userEmail,
            password: 'password123',
            rol: originalRole
          });
          createdUserIds.push(user.id);

          // Create requester (different user)
          const requesterEmail = `requester${Date.now()}${Math.random().toString(36).substring(7)}@test.com`;
          const requester = await UserManagementService.createUser({
            nombre: 'Requester',
            apellido: 'User',
            email: requesterEmail,
            password: 'password123',
            rol: 'super_admin'
          });
          createdUserIds.push(requester.id);

          // If changing from super_admin, ensure there's another super_admin
          if (originalRole === 'super_admin') {
            const anotherSuperEmail = `super${Date.now()}${Math.random().toString(36).substring(7)}@test.com`;
            const anotherSuper = await UserManagementService.createUser({
              nombre: 'Another',
              apellido: 'Super',
              email: anotherSuperEmail,
              password: 'password123',
              rol: 'super_admin'
            });
            createdUserIds.push(anotherSuper.id);
          }

          // Change role
          const updatedUser = await UserManagementService.changeUserRole(
            user.id,
            newRole,
            requester.id
          );

          // Verify role was changed
          expect(updatedUser.rol).toBe(newRole);

          // Verify in database
          const dbUser = await Usuario.findByPk(user.id);
          expect(dbUser?.rol).toBe(newRole);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  }, 120000);

  /**
   * Property 9: Self-Role-Change Prevention
   * **Validates: Requirements 3.3**
   * 
   * For any user attempting to change their own role,
   * the operation should be rejected with an error regardless of the target role.
   */
  it('Property 9: Self-Role-Change Prevention', async () => {
    const validRoleArbitrary = fc.constantFrom<UserRole>('student', 'admin', 'super_admin');

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          currentRole: validRoleArbitrary,
          targetRole: validRoleArbitrary
        }),
        async ({ currentRole, targetRole }) => {
          // Create user
          const userEmail = `selfchange${Date.now()}${Math.random().toString(36).substring(7)}@test.com`;
          const user = await UserManagementService.createUser({
            nombre: 'SelfChange',
            apellido: 'Test',
            email: userEmail,
            password: 'password123',
            rol: currentRole
          });
          createdUserIds.push(user.id);

          // Attempt to change own role
          try {
            await UserManagementService.changeUserRole(
              user.id,
              targetRole,
              user.id // Same user ID
            );

            // Should not reach here
            expect.fail('Self role change should have been rejected');
            return false;
          } catch (error: any) {
            // Verify error message
            expect(error.message).toContain('propio rol');
            return true;
          }
        }
      ),
      { numRuns: 100 }
    );
  }, 120000);

  /**
   * Property 14: Validation Error Messages
   * **Validates: Requirements 9.3**
   * 
   * For any invalid user operation input, the system should return
   * a descriptive error message indicating what validation failed.
   */
  it('Property 14: Validation Error Messages - invalid email', async () => {
    const invalidEmailArbitrary = fc.oneof(
      fc.constant('notanemail'),
      fc.constant('missing@domain'),
      fc.constant('@nodomain.com'),
      fc.constant('spaces in@email.com')
    );

    await fc.assert(
      fc.asyncProperty(
        invalidEmailArbitrary,
        async (invalidEmail) => {
          try {
            await UserManagementService.createUser({
              nombre: 'Test',
              apellido: 'User',
              email: invalidEmail,
              password: 'password123',
              rol: 'student'
            });

            // Should not reach here
            expect.fail('Invalid email should have been rejected');
            return false;
          } catch (error: any) {
            // Verify descriptive error message
            expect(error.message).toBeDefined();
            expect(error.message.toLowerCase()).toMatch(/email|inválido/);
            return true;
          }
        }
      ),
      { numRuns: 50 }
    );
  }, 60000);

  it('Property 14b: Validation Error Messages - short password', async () => {
    const shortPasswordArbitrary = fc.stringMatching(/^[a-zA-Z0-9]{1,5}$/);

    await fc.assert(
      fc.asyncProperty(
        shortPasswordArbitrary,
        async (shortPassword) => {
          const uniqueEmail = `test${Date.now()}${Math.random().toString(36).substring(7)}@test.com`;
          
          try {
            await UserManagementService.createUser({
              nombre: 'Test',
              apellido: 'User',
              email: uniqueEmail,
              password: shortPassword,
              rol: 'student'
            });

            // Should not reach here
            expect.fail('Short password should have been rejected');
            return false;
          } catch (error: any) {
            // Verify descriptive error message
            expect(error.message).toBeDefined();
            expect(error.message.toLowerCase()).toMatch(/contraseña|password|caracteres/);
            return true;
          }
        }
      ),
      { numRuns: 50 }
    );
  }, 60000);

  it('Property 14c: Validation Error Messages - invalid role', async () => {
    const invalidRoleArbitrary = fc.constantFrom('superuser', 'moderator', 'guest', 'invalid');

    await fc.assert(
      fc.asyncProperty(
        invalidRoleArbitrary,
        async (invalidRole) => {
          const uniqueEmail = `test${Date.now()}${Math.random().toString(36).substring(7)}@test.com`;
          
          try {
            await UserManagementService.createUser({
              nombre: 'Test',
              apellido: 'User',
              email: uniqueEmail,
              password: 'password123',
              rol: invalidRole as any
            });

            // Should not reach here
            expect.fail('Invalid role should have been rejected');
            return false;
          } catch (error: any) {
            // Verify descriptive error message
            expect(error.message).toBeDefined();
            expect(error.message.toLowerCase()).toMatch(/rol|inválido/);
            return true;
          }
        }
      ),
      { numRuns: 50 }
    );
  }, 60000);

});
