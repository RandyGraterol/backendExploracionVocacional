/**
 * Unit Tests: Super Admin Middleware Edge Cases
 * Feature: panel-super-admin
 * 
 * Tests edge cases for the requireSuperAdmin middleware
 */

import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { requireSuperAdmin, AuthRequest } from '../middleware/auth';

describe('requireSuperAdmin Middleware - Edge Cases', () => {

  it('should return 401 when user is missing from request', () => {
    const req = {} as AuthRequest;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    } as unknown as Response;
    const next = vi.fn() as NextFunction;

    requireSuperAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'No autenticado' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 when user role is admin', () => {
    const req = {
      user: {
        id: 1,
        email: 'admin@test.com',
        rol: 'admin'
      }
    } as AuthRequest;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    } as unknown as Response;
    const next = vi.fn() as NextFunction;

    requireSuperAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ 
      error: 'Acceso denegado. Se requiere rol de super administrador' 
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 when user role is student', () => {
    const req = {
      user: {
        id: 1,
        email: 'student@test.com',
        rol: 'student'
      }
    } as AuthRequest;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    } as unknown as Response;
    const next = vi.fn() as NextFunction;

    requireSuperAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ 
      error: 'Acceso denegado. Se requiere rol de super administrador' 
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next() when user role is super_admin', () => {
    const req = {
      user: {
        id: 1,
        email: 'superadmin@test.com',
        rol: 'super_admin'
      }
    } as AuthRequest;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    } as unknown as Response;
    const next = vi.fn() as NextFunction;

    requireSuperAdmin(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it('should handle missing user.rol gracefully', () => {
    const req = {
      user: {
        id: 1,
        email: 'test@test.com'
        // rol is missing
      }
    } as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    } as unknown as Response;
    const next = vi.fn() as NextFunction;

    requireSuperAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

});
