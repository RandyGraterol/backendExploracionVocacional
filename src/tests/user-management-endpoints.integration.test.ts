/**
 * Integration Tests: User Management Endpoints
 * Feature: panel-super-admin
 * 
 * Tests complete CRUD workflows through HTTP endpoints
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app';
import Usuario from '../models/Usuario';
import sequelize from '../config/database';
import { hashPassword } from '../controllers/authController';
import { generateToken } from '../middleware/auth';

let superAdminToken: string;
let adminToken: string;
let studentToken: string;
let superAdminId: number;
const createdUserIds: number[] = [];

beforeAll(async () => {
  await sequelize.sync();

  // Create test users
  const superAdmin = await Usuario.create({
    nombre: 'Super',
    apellido: 'Admin',
    email: `superadmin-integration-${Date.now()}@test.com`,
    password: hashPassword('password123'),
    rol: 'super_admin',
    estado: 'aprobado',
    activo: true
  });
  superAdminId = superAdmin.id;
  createdUserIds.push(superAdmin.id);
  superAdminToken = generateToken({ id: superAdmin.id, email: superAdmin.email, rol: 'super_admin' });

  const admin = await Usuario.create({
    nombre: 'Regular',
    apellido: 'Admin',
    email: `admin-integration-${Date.now()}@test.com`,
    password: hashPassword('password123'),
    rol: 'admin',
    estado: 'aprobado',
    activo: true
  });
  createdUserIds.push(admin.id);
  adminToken = generateToken({ id: admin.id, email: admin.email, rol: 'admin' });

  const student = await Usuario.create({
    nombre: 'Test',
    apellido: 'Student',
    email: `student-integration-${Date.now()}@test.com`,
    password: hashPassword('password123'),
    rol: 'student',
    estado: 'aprobado',
    activo: true
  });
  createdUserIds.push(student.id);
  studentToken = generateToken({ id: student.id, email: student.email, rol: 'student' });

  console.log('✅ Integration test setup completed');
});

afterAll(async () => {
  try {
    for (const id of createdUserIds) {
      await Usuario.destroy({ where: { id } });
    }
    console.log('✅ Integration test cleanup completed');
  } catch (error) {
    console.error('⚠️ Error in cleanup:', error);
  }
});

describe('User Management Endpoints - Integration Tests', () => {

  describe('Authorization', () => {
    
    it('should allow super_admin to access user management endpoints', async () => {
      const response = await request(app)
        .get('/api/super-admin/users')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).not.toBe(403);
      expect(response.status).toBe(200);
    });

    it('should deny admin access to user management endpoints', async () => {
      const response = await request(app)
        .get('/api/super-admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('super');
    });

    it('should deny student access to user management endpoints', async () => {
      const response = await request(app)
        .get('/api/super-admin/users')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(403);
    });

    it('should deny access without token', async () => {
      const response = await request(app)
        .get('/api/super-admin/users');

      expect(response.status).toBe(401);
    });

  });

  describe('Complete CRUD Workflow', () => {
    
    it('should complete full user lifecycle: create, read, update, delete', async () => {
      // 1. Create user
      const createResponse = await request(app)
        .post('/api/super-admin/users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          nombre: 'Test',
          apellido: 'User',
          email: `testuser-${Date.now()}@test.com`,
          password: 'password123',
          rol: 'student'
        });

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.id).toBeDefined();
      expect(createResponse.body.nombre).toBe('Test');
      expect(createResponse.body.rol).toBe('student');
      
      const userId = createResponse.body.id;
      createdUserIds.push(userId);

      // 2. Read user by ID
      const readResponse = await request(app)
        .get(`/api/super-admin/users/${userId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(readResponse.status).toBe(200);
      expect(readResponse.body.id).toBe(userId);
      expect(readResponse.body.nombre).toBe('Test');

      // 3. Update user
      const updateResponse = await request(app)
        .put(`/api/super-admin/users/${userId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          nombre: 'Updated',
          apellido: 'Name'
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.nombre).toBe('Updated');
      expect(updateResponse.body.apellido).toBe('Name');

      // 4. Verify update in database
      const verifyResponse = await request(app)
        .get(`/api/super-admin/users/${userId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(verifyResponse.body.nombre).toBe('Updated');

      // 5. Delete user
      const deleteResponse = await request(app)
        .delete(`/api/super-admin/users/${userId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.message).toBeDefined();

      // 6. Verify deletion
      const verifyDeleteResponse = await request(app)
        .get(`/api/super-admin/users/${userId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(verifyDeleteResponse.status).toBe(404);
    });

  });

  describe('Role Change Workflow', () => {
    
    it('should change user role from student to admin', async () => {
      // Create student
      const createResponse = await request(app)
        .post('/api/super-admin/users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          nombre: 'Student',
          apellido: 'ToPromote',
          email: `promote-${Date.now()}@test.com`,
          password: 'password123',
          rol: 'student'
        });

      const userId = createResponse.body.id;
      createdUserIds.push(userId);

      // Change role to admin
      const roleChangeResponse = await request(app)
        .put(`/api/super-admin/users/${userId}/role`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ rol: 'admin' });

      expect(roleChangeResponse.status).toBe(200);
      expect(roleChangeResponse.body.rol).toBe('admin');

      // Verify role change
      const verifyResponse = await request(app)
        .get(`/api/super-admin/users/${userId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(verifyResponse.body.rol).toBe('admin');
    });

    it('should prevent self role change', async () => {
      // Attempt to change own role
      const response = await request(app)
        .put(`/api/super-admin/users/${superAdminId}/role`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ rol: 'admin' });

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('propio rol');
    });

  });

  describe('Query and Filter', () => {
    
    it('should filter users by role', async () => {
      const response = await request(app)
        .get('/api/super-admin/users?rol=super_admin')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      // All returned users should be super_admin
      response.body.forEach((user: any) => {
        expect(user.rol).toBe('super_admin');
      });
    });

    it('should search users by name', async () => {
      // Create user with unique name
      const uniqueName = `SearchTest${Date.now()}`;
      const createResponse = await request(app)
        .post('/api/super-admin/users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          nombre: uniqueName,
          apellido: 'User',
          email: `search-${Date.now()}@test.com`,
          password: 'password123',
          rol: 'student'
        });

      const userId = createResponse.body.id;
      createdUserIds.push(userId);

      // Search for user
      const searchResponse = await request(app)
        .get(`/api/super-admin/users?search=${uniqueName}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(searchResponse.status).toBe(200);
      expect(Array.isArray(searchResponse.body)).toBe(true);
      
      // Should find the created user
      const foundUser = searchResponse.body.find((u: any) => u.id === userId);
      expect(foundUser).toBeDefined();
    });

  });

  describe('Error Handling', () => {
    
    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/super-admin/users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          nombre: 'Test'
          // Missing other required fields
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/super-admin/users/999999')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(404);
    });

    it('should return 409 for duplicate email', async () => {
      const email = `duplicate-${Date.now()}@test.com`;
      
      // Create first user
      const firstResponse = await request(app)
        .post('/api/super-admin/users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          nombre: 'First',
          apellido: 'User',
          email: email,
          password: 'password123',
          rol: 'student'
        });

      createdUserIds.push(firstResponse.body.id);

      // Attempt to create second user with same email
      const secondResponse = await request(app)
        .post('/api/super-admin/users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          nombre: 'Second',
          apellido: 'User',
          email: email,
          password: 'password123',
          rol: 'student'
        });

      expect(secondResponse.status).toBe(409);
      expect(secondResponse.body.error).toContain('email');
    });

    it('should return 400 for invalid user ID', async () => {
      const response = await request(app)
        .get('/api/super-admin/users/invalid')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(400);
    });

  });

});
