/**
 * Property-Based Tests: Statistics Service
 * Feature: panel-super-admin
 * 
 * These tests verify the universal properties of system statistics:
 * - Property 10: Statistics Accuracy
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import sequelize from '../config/database';
import Usuario, { UserRole } from '../models/Usuario';
import StatisticsService from '../services/StatisticsService';
import { hashPassword } from '../controllers/authController';

const createdUserIds: number[] = [];

beforeAll(async () => {
  await sequelize.sync();
  console.log('✅ Statistics Service test setup completed');
});

afterAll(async () => {
  try {
    for (const id of createdUserIds) {
      await Usuario.destroy({ where: { id } });
    }
    console.log('✅ Statistics Service test cleanup completed');
  } catch (error) {
    console.error('⚠️ Error in cleanup:', error);
  }
});

describe('🧪 Property-Based Tests: Statistics Service', () => {

  /**
   * Property 10: Statistics Accuracy
   * **Validates: Requirements 4.1, 7.1**
   * 
   * For any database state, the system statistics should exactly match
   * the actual counts of users by role, activities, tests, ramas, and videos
   * in the database.
   */
  it('Property 10: Statistics Accuracy - user counts match database', async () => {
    // Arbitrary for generating random number of users per role
    const userCountArbitrary = fc.record({
      studentCount: fc.integer({ min: 0, max: 5 }),
      adminCount: fc.integer({ min: 0, max: 3 }),
      superAdminCount: fc.integer({ min: 1, max: 2 }) // At least 1 super admin
    });

    await fc.assert(
      fc.asyncProperty(
        userCountArbitrary,
        async ({ studentCount, adminCount, superAdminCount }) => {
          const testUserIds: number[] = [];

          try {
            // Get baseline counts before creating test users
            const baselineStats = await StatisticsService.getSystemStatistics();

            // Create students
            for (let i = 0; i < studentCount; i++) {
              const user = await Usuario.create({
                nombre: `Student${i}`,
                apellido: 'Test',
                email: `student${i}-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`,
                password: hashPassword('password123'),
                rol: 'student',
                estado: 'aprobado',
                activo: true
              });
              testUserIds.push(user.id);
              createdUserIds.push(user.id);
            }

            // Create admins
            for (let i = 0; i < adminCount; i++) {
              const user = await Usuario.create({
                nombre: `Admin${i}`,
                apellido: 'Test',
                email: `admin${i}-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`,
                password: hashPassword('password123'),
                rol: 'admin',
                estado: 'aprobado',
                activo: true
              });
              testUserIds.push(user.id);
              createdUserIds.push(user.id);
            }

            // Create super admins
            for (let i = 0; i < superAdminCount; i++) {
              const user = await Usuario.create({
                nombre: `SuperAdmin${i}`,
                apellido: 'Test',
                email: `superadmin${i}-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`,
                password: hashPassword('password123'),
                rol: 'super_admin',
                estado: 'aprobado',
                activo: true
              });
              testUserIds.push(user.id);
              createdUserIds.push(user.id);
            }

            // Get statistics
            const stats = await StatisticsService.getSystemStatistics();

            // Verify user counts match expected (baseline + created)
            expect(stats.usersByRole.student).toBe(baselineStats.usersByRole.student + studentCount);
            expect(stats.usersByRole.admin).toBe(baselineStats.usersByRole.admin + adminCount);
            expect(stats.usersByRole.super_admin).toBe(baselineStats.usersByRole.super_admin + superAdminCount);
            expect(stats.totalUsers).toBe(baselineStats.totalUsers + studentCount + adminCount + superAdminCount);

            // Verify counts match actual database counts
            const actualStudentCount = await Usuario.count({ where: { rol: 'student' } });
            const actualAdminCount = await Usuario.count({ where: { rol: 'admin' } });
            const actualSuperAdminCount = await Usuario.count({ where: { rol: 'super_admin' } });
            const actualTotalUsers = await Usuario.count();

            expect(stats.usersByRole.student).toBe(actualStudentCount);
            expect(stats.usersByRole.admin).toBe(actualAdminCount);
            expect(stats.usersByRole.super_admin).toBe(actualSuperAdminCount);
            expect(stats.totalUsers).toBe(actualTotalUsers);

            // Clean up test users immediately
            for (const id of testUserIds) {
              await Usuario.destroy({ where: { id } });
            }

            return true;
          } catch (error) {
            // Clean up on error
            for (const id of testUserIds) {
              try {
                await Usuario.destroy({ where: { id } });
              } catch (e) {
                // Ignore cleanup errors
              }
            }
            throw error;
          }
        }
      ),
      { numRuns: 50 } // Reduced runs since we're creating/deleting many users
    );
  }, 120000);

  /**
   * Property 10b: Statistics Accuracy - sum of role counts equals total
   */
  it('Property 10b: Statistics Accuracy - role counts sum to total', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(true), // Just run the test multiple times
        async () => {
          const stats = await StatisticsService.getSystemStatistics();

          // Sum of role counts should equal total users
          const sumOfRoles = stats.usersByRole.student + 
                            stats.usersByRole.admin + 
                            stats.usersByRole.super_admin;

          expect(sumOfRoles).toBe(stats.totalUsers);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  }, 60000);

  /**
   * Property 10c: Statistics Accuracy - non-negative counts
   */
  it('Property 10c: Statistics Accuracy - all counts are non-negative', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(true),
        async () => {
          const stats = await StatisticsService.getSystemStatistics();

          // All counts should be non-negative
          expect(stats.totalUsers).toBeGreaterThanOrEqual(0);
          expect(stats.usersByRole.student).toBeGreaterThanOrEqual(0);
          expect(stats.usersByRole.admin).toBeGreaterThanOrEqual(0);
          expect(stats.usersByRole.super_admin).toBeGreaterThanOrEqual(0);
          expect(stats.totalActivities).toBeGreaterThanOrEqual(0);
          expect(stats.totalTests).toBeGreaterThanOrEqual(0);
          expect(stats.totalRamas).toBeGreaterThanOrEqual(0);
          expect(stats.totalVideos).toBeGreaterThanOrEqual(0);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  }, 60000);

});
