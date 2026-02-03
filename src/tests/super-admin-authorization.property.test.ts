/**
 * Property-Based Tests: Super Admin Authorization Middleware
 * Feature: panel-super-admin
 * 
 * These tests verify the universal properties of the super admin authorization system:
 * - Property 1: Authorization Enforcement
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import request from 'supertest';
import app from '../app';
import Usuario from '../models/Usuario';
import sequelize from '../config/database';
import { hashPassword } from '../controllers/authController';
import { generateToken } from '../middleware/auth';

// Test users for different roles
let testUsers: {
  super_admin: { id: number; token: string; email: string };
  admin: { id: number; token: string; email: string };
  student: { id: number; token: string; email: string };
} | null = null;

const createdUserIds: number[] = [];

/**
 * Setup: Create test users for each role
 */
beforeAll(async () => {
  try {
    await sequelize.sync();

    // Create super_admin test user
    const superAdmin = await Usuario.create({
      nombre: 'Super',
      apellido: 'Admin',
      email: `superadmin-auth-${Date.now()}@test.com`,
      password: hashPassword('password123'),
      rol: 'super_admin',
      estado: 'aprobado',
      activo: true
    });
    createdUserIds.push(superAdmin.id);

    // Create admin test user
    const admin = await Usuario.create({
      nombre: 'Regular',
      apellido: 'Admin',
      email: `admin-auth-${Date.now()}@test.com`,
      password: hashPassword('password123'),
      rol: 'admin',
      estado: 'aprobado',
      activo: true
    });
    createdUserIds.push(admin.id);

    // Create student test user
    const student = await Usuario.create({
      nombre: 'Test',
      apellido: 'Student',
      email: `student-auth-${Date.now()}@test.com`,
      password: hashPassword('password123'),
      rol: 'student',
      estado: 'aprobado',
      activo: true
    });
    createdUserIds.push(student.id);

    // Generate tokens
    testUsers = {
      super_admin: {
        id: superAdmin.id,
        token: generateToken({ id: superAdmin.id, email: superAdmin.email, rol: 'super_admin' }),
        email: superAdmin.email
      },
      admin: {
        id: admin.id,
        token: generateToken({ id: admin.id, email: admin.email, rol: 'admin' }),
        email: admin.email
      },
      student: {
        id: student.id,
        token: generateToken({ id: student.id, email: student.email, rol: 'student' }),
        email: student.email
      }
    };

    console.log('✅ Authorization test setup completed');
  } catch (error) {
    console.error('❌ Error in setup:', error);
    throw error;
  }
});

/**
 * Cleanup: Remove test users
 */
afterAll(async () => {
  try {
    for (const id of createdUserIds) {
      await Usuario.destroy({ where: { id } });
    }
    console.log('✅ Authorization test cleanup completed');
  } catch (error) {
    console.error('⚠️ Error in cleanup:', error);
  }
});

describe('🧪 Property-Based Tests: Super Admin Authorization', () => {

  /**
   * Property 1: Authorization Enforcement
   * **Validates: Requirements 1.1, 1.2, 5.3, 5.4, 8.1, 8.2**
   * 
   * For any super admin endpoint and any authenticated user,
   * the endpoint should only process the request if the user has super_admin role,
   * otherwise it should return a 403 Forbidden response.
   */
  it('Property 1: Authorization Enforcement - super_admin endpoints require super_admin role', async () => {
    if (!testUsers) {
      throw new Error('Test users not initialized');
    }

    // Define super admin endpoints to test
    const superAdminEndpoints = [
      { method: 'GET', path: '/api/super-admin/users' },
      { method: 'GET', path: '/api/super-admin/statistics' }
    ];

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          endpoint: fc.constantFrom(...superAdminEndpoints),
          userRole: fc.constantFrom('super_admin', 'admin', 'student')
        }),
        async ({ endpoint, userRole }) => {
          const user = testUsers![userRole];
          
          let response;
          if (endpoint.method === 'GET') {
            response = await request(app)
              .get(endpoint.path)
              .set('Authorization', `Bearer ${user.token}`);
          } else {
            response = await request(app)
              .post(endpoint.path)
              .set('Authorization', `Bearer ${user.token}`)
              .send({});
          }

          if (userRole === 'super_admin') {
            // Super admin should NOT receive 403
            expect(response.status).not.toBe(403);
          } else {
            // Admin and student should receive 403
            expect(response.status).toBe(403);
            expect(response.body.error).toBeDefined();
            expect(response.body.error.toLowerCase()).toContain('super');
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  }, 120000);

  /**
   * Property 1b: Authorization Enforcement - missing token
   * 
   * For any super admin endpoint without authentication token,
   * the endpoint should return 401 Unauthorized.
   */
  it('Property 1b: Authorization Enforcement - missing token returns 401', async () => {
    const superAdminEndpoints = [
      { method: 'GET', path: '/api/super-admin/users' },
      { method: 'GET', path: '/api/super-admin/statistics' }
    ];

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...superAdminEndpoints),
        async (endpoint) => {
          let response;
          if (endpoint.method === 'GET') {
            response = await request(app).get(endpoint.path);
          } else {
            response = await request(app).post(endpoint.path).send({});
          }

          expect(response.status).toBe(401);
          expect(response.body.error).toBeDefined();

          return true;
        }
      ),
      { numRuns: 50 }
    );
  }, 60000);

  /**
   * Property 1c: Authorization Enforcement - invalid token
   * 
   * For any super admin endpoint with invalid token,
   * the endpoint should return 401 Unauthorized.
   */
  it('Property 1c: Authorization Enforcement - invalid token returns 401', async () => {
    const superAdminEndpoints = [
      { method: 'GET', path: '/api/super-admin/users' },
      { method: 'GET', path: '/api/super-admin/statistics' }
    ];

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          endpoint: fc.constantFrom(...superAdminEndpoints),
          invalidToken: fc.stringMatching(/^[a-zA-Z0-9]{10,50}$/)
        }),
        async ({ endpoint, invalidToken }) => {
          let response;
          if (endpoint.method === 'GET') {
            response = await request(app)
              .get(endpoint.path)
              .set('Authorization', `Bearer ${invalidToken}`);
          } else {
            response = await request(app)
              .post(endpoint.path)
              .set('Authorization', `Bearer ${invalidToken}`)
              .send({});
          }

          expect(response.status).toBe(401);
          expect(response.body.error).toBeDefined();

          return true;
        }
      ),
      { numRuns: 50 }
    );
  }, 60000);

});
