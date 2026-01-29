import { Request, Response } from 'express';
import Usuario from '../models/Usuario';
import crypto from 'crypto';
import { generateToken } from '../middleware/auth';

// Hash simple para passwords (en producción usar bcrypt)
const hashPassword = (password: string): string => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// Validar datos de registro
const validateRegisterInput = (data: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.nombre || typeof data.nombre !== 'string' || data.nombre.trim() === '') {
    errors.push('El campo "nombre" es requerido');
  }

  if (!data.apellido || typeof data.apellido !== 'string' || data.apellido.trim() === '') {
    errors.push('El campo "apellido" es requerido');
  }

  if (!data.email || typeof data.email !== 'string' || data.email.trim() === '') {
    errors.push('El campo "email" es requerido');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('El email no tiene un formato válido');
  }

  if (!data.password || typeof data.password !== 'string' || data.password.length < 6) {
    errors.push('La contraseña debe tener al menos 6 caracteres');
  }

  return { valid: errors.length === 0, errors };
};

// POST /api/auth/register - Registrar nuevo usuario
export const register = async (req: Request, res: Response) => {
  try {
    console.log('📝 Datos recibidos en registro:', JSON.stringify(req.body, null, 2));

    const validation = validateRegisterInput(req.body);
    if (!validation.valid) {
      console.log('❌ Validación fallida:', validation.errors);
      return res.status(400).json({ error: 'Validation failed', details: validation.errors });
    }

    const { nombre, apellido, email, password, documentoUrl, documentoNombre } = req.body;

    // Verificar si el email ya existe
    const existingUser = await Usuario.findOne({ where: { email } });
    if (existingUser) {
      console.log('❌ Email ya registrado:', email);
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    // Crear usuario (siempre como student, admin solo por seed)
    const usuario = await Usuario.create({
      nombre,
      apellido,
      email,
      password: hashPassword(password),
      rol: 'student',
      estado: 'pendiente', // Nuevo usuario requiere aprobación
      documentoUrl: documentoUrl || null,
      documentoNombre: documentoNombre || null
    });

    console.log('✅ Usuario creado exitosamente:', email);

    res.status(201).json({
      message: 'Usuario registrado correctamente. Tu cuenta está pendiente de aprobación por un administrador.',
      user: usuario.toJSON()
    });
  } catch (error) {
    console.error('❌ Error en registro:', error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
};

// POST /api/auth/login - Iniciar sesión
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    // Buscar usuario
    const usuario = await Usuario.findOne({ where: { email } });
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar contraseña
    if (usuario.password !== hashPassword(password)) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar si está activo
    if (!usuario.activo) {
      return res.status(401).json({ error: 'Usuario desactivado' });
    }

    // Verificar si está aprobado
    if (usuario.estado === 'pendiente') {
      return res.status(403).json({ error: 'Tu cuenta está pendiente de aprobación por un administrador' });
    }

    if (usuario.estado === 'rechazado') {
      return res.status(403).json({ error: 'Tu cuenta ha sido rechazada. Contacta al administrador para más información' });
    }

    // Generar token JWT
    const token = generateToken({
      id: usuario.id,
      email: usuario.email,
      rol: usuario.rol
    });

    res.json({
      message: 'Login exitoso',
      user: usuario.toJSON(),
      token
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

// GET /api/auth/me - Obtener usuario actual (por ID)
export const getMe = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId es requerido' });
    }

    const usuario = await Usuario.findByPk(Number(userId));
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(usuario.toJSON());
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
};

// GET /api/auth/users - Obtener todos los usuarios (solo admin)
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const usuarios = await Usuario.findAll({
      order: [['createdAt', 'DESC']]
    });

    res.json(usuarios);
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

// PUT /api/auth/users/:id - Actualizar usuario
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, activo, rol, estado } = req.body;

    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    await usuario.update({
      nombre: nombre || usuario.nombre,
      apellido: apellido || usuario.apellido,
      activo: activo !== undefined ? activo : usuario.activo,
      rol: rol || usuario.rol,
      estado: estado || usuario.estado
    });

    res.json(usuario.toJSON());
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
};

// DELETE /api/auth/users/:id - Eliminar usuario
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    await usuario.destroy();

    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
};

// POST /api/auth/users/:id/aprobar - Aprobar usuario
export const aprobarUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    await usuario.update({ estado: 'aprobado' });

    res.json({
      message: 'Usuario aprobado correctamente',
      user: usuario.toJSON()
    });
  } catch (error) {
    console.error('Error aprobando usuario:', error);
    res.status(500).json({ error: 'Error al aprobar usuario' });
  }
};

// POST /api/auth/users/:id/rechazar - Rechazar usuario
export const rechazarUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    await usuario.update({ estado: 'rechazado' });

    res.json({
      message: 'Usuario rechazado',
      user: usuario.toJSON()
    });
  } catch (error) {
    console.error('Error rechazando usuario:', error);
    res.status(500).json({ error: 'Error al rechazar usuario' });
  }
};

// Exportar hashPassword para usar en seed
export { hashPassword };
