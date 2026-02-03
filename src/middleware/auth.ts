import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario';

// Secret key para JWT (en producción usar variable de entorno)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Extender Request para incluir usuario autenticado
export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    rol: 'student' | 'admin' | 'super_admin';
  };
}

/**
 * Middleware para verificar token JWT
 * Valida que el token esté presente y sea válido
 * Retorna 401 si no hay token o es inválido
 */
export const verifyToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No se proporcionó token de autenticación' });
      return;
    }
    
    const token = authHeader.substring(7); // Remover 'Bearer '
    
    // Verificar y decodificar token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: number;
      email: string;
      rol: 'student' | 'admin' | 'super_admin';
    };
    
    // Verificar que el usuario existe y está activo
    const usuario = await Usuario.findByPk(decoded.id);
    if (!usuario) {
      res.status(401).json({ error: 'Usuario no encontrado' });
      return;
    }
    
    if (!usuario.activo) {
      res.status(401).json({ error: 'Usuario desactivado' });
      return;
    }
    
    // Agregar información del usuario al request
    req.user = {
      id: usuario.id,
      email: usuario.email,
      rol: usuario.rol
    };
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Token inválido' });
      return;
    }
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expirado' });
      return;
    }
    console.error('Error en verificación de token:', error);
    res.status(500).json({ error: 'Error al verificar autenticación' });
  }
};

/**
 * Middleware para verificar rol de administrador
 * Debe usarse después de verifyToken
 * Retorna 403 si el usuario no es admin o super_admin
 */
export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }
  
  if (req.user.rol !== 'admin' && req.user.rol !== 'super_admin') {
    res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador' });
    return;
  }
  
  next();
};

/**
 * Middleware para verificar rol de super administrador
 * Debe usarse después de verifyToken
 * Retorna 403 si el usuario no es super_admin
 */
export const requireSuperAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }
  
  if (req.user.rol !== 'super_admin') {
    res.status(403).json({ error: 'Acceso denegado. Se requiere rol de super administrador' });
    return;
  }
  
  next();
};

/**
 * Función helper para generar token JWT
 */
export const generateToken = (user: { id: number; email: string; rol: 'student' | 'admin' | 'super_admin' }): string => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      rol: user.rol
    },
    JWT_SECRET,
    { expiresIn: '7d' } // Token válido por 7 días
  );
};
