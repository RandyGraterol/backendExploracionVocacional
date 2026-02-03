/**
 * End-to-End Integration Tests
 * Feature: mejoras-exploracion-vocacional
 * 
 * These tests verify complete system functionality:
 * - Super admin can create admin
 * - Admin can create activities of different types
 * - Student sees filtered activities by rama
 * - Videos are filtered by rama
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import axios from 'axios';
import { sequelize, Usuario, Actividad, Video, ResultadoTest } from '../models';
import { hashPassword } from '../controllers/authController';
import jwt from 'jsonwebtoken';

const API_URL = 'http://localhost:3003';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

describe('End-to-End Integration Tests', () => {
  let superAdminToken: string;
  let adminToken: string;
  let studentToken: string;
  let studentId: number;
  let createdActivityIds: string[] = [];
  let createdVideoIds: number[] = [];

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Crear usuarios de prueba
    const hashedPassword = await hashPassword('password123');

    const superAdmin = await Usuario.create({
      nombre: 'Super',
      apellido: 'Admin',
      email: 'superadmin@e2e.com',
      password: hashedPassword,
      rol: 'super_admin',
      activo: true,
      estado: 'aprobado'
    });

    const admin = await Usuario.create({
      nombre: 'Admin',
      apellido: 'User',
      email: 'admin@e2e.com',
      password: hashedPassword,
      rol: 'admin',
      activo: true,
      estado: 'aprobado'
    });

    const student = await Usuario.create({
      nombre: 'Student',
      apellido: 'User',
      email: 'student@e2e.com',
      password: hashedPassword,
      rol: 'student',
      activo: true,
      estado: 'aprobado'
    });

    studentId = student.id;

    // Generar tokens
    superAdminToken = jwt.sign(
      { id: superAdmin.id, email: superAdmin.email, rol: superAdmin.rol },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    adminToken = jwt.sign(
      { id: admin.id, email: admin.email, rol: admin.rol },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    studentToken = jwt.sign(
      { id: student.id, email: student.email, rol: student.rol },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    // Limpiar datos creados
    for (const id of createdActivityIds) {
      await Actividad.destroy({ where: { id } });
    }
    for (const id of createdVideoIds) {
      await Video.destroy({ where: { id } });
    }
    await sequelize.close();
  });

  /**
   * Test 1: Super admin can create admin
   */
  it('should allow super admin to create a new admin user', async () => {
    const newAdminData = {
      nombre: 'New',
      apellido: 'Admin',
      email: `newadmin${Date.now()}@e2e.com`,
      password: 'password123'
    };

    const response = await axios.post(
      `${API_URL}/api/auth/create-admin`,
      newAdminData,
      {
        headers: { Authorization: `Bearer ${superAdminToken}` }
      }
    );

    expect(response.status).toBe(201);
    expect(response.data).toHaveProperty('id');
    expect(response.data.rol).toBe('admin');
    expect(response.data.email).toBe(newAdminData.email);
    expect(response.data).not.toHaveProperty('password');

    // Verificar que el admin fue creado en la base de datos
    const createdAdmin = await Usuario.findOne({ where: { email: newAdminData.email } });
    expect(createdAdmin).toBeDefined();
    expect(createdAdmin?.rol).toBe('admin');

    // Limpiar
    await createdAdmin?.destroy();
  });

  /**
   * Test 2: Admin can create activities of different types
   */
  it('should allow admin to create activities of all types', async () => {
    const activityTypes = [
      {
        tipo: 'quiz',
        content: { preguntas: [{ pregunta: 'Test?', opciones: ['A', 'B'], respuestaCorrecta: 0 }] }
      },
      {
        tipo: 'ordenamiento',
        content: { itemsOrden: [{ id: '1', texto: 'Item 1', ordenCorrecto: 1 }] }
      },
      {
        tipo: 'simulacion',
        content: { simulacion: { tipo: 'red', configuracionInicial: {}, objetivos: ['Test'], validaciones: [] } }
      },
      {
        tipo: 'practica',
        content: { ejercicioCodigo: { lenguaje: 'javascript', plantilla: 'console.log("test")', tests: [] } }
      },
      {
        tipo: 'desafio',
        content: { paresDesafio: [{ concepto: 'Test', definicion: 'Test definition' }] }
      }
    ];

    for (const activityType of activityTypes) {
      const activityData = {
        id: `e2e-${activityType.tipo}-${Date.now()}`,
        title: `E2E Test ${activityType.tipo}`,
        description: 'End-to-end test activity',
        rama: ['desarrollo', 'redes'],
        tipo: activityType.tipo,
        dificultad: 'facil',
        imagen: 'test.jpg',
        icono: 'test',
        ...activityType.content
      };

      const response = await axios.post(
        `${API_URL}/api/actividades`,
        activityData,
        {
          headers: { Authorization: `Bearer ${adminToken}` }
        }
      );

      expect(response.status).toBe(201);
      expect(response.data.tipo).toBe(activityType.tipo);
      expect(response.data.rama).toEqual(['desarrollo', 'redes']);

      createdActivityIds.push(activityData.id);
    }

    // Verificar que todas las actividades fueron creadas
    expect(createdActivityIds).toHaveLength(5);
  });

  /**
   * Test 3: Student sees filtered activities by rama
   */
  it('should filter activities by student rama vocacional', async () => {
    // Crear resultado de test vocacional para el estudiante
    await ResultadoTest.create({
      userId: studentId,
      ramaRecomendada: 'desarrollo',
      puntuaciones: { desarrollo: 80, redes: 60 },
      fecha: new Date(),
      respuestas: []
    });

    // Crear actividades con diferentes ramas
    const activityDesarrollo = await Actividad.create({
      id: `e2e-desarrollo-${Date.now()}`,
      title: 'Actividad Desarrollo',
      description: 'Solo para desarrollo',
      rama: ['desarrollo'],
      tipo: 'quiz',
      dificultad: 'facil',
      imagen: 'test.jpg',
      icono: 'test',
      preguntas: [{ pregunta: 'Test?', opciones: ['A', 'B'], respuestaCorrecta: 0 }]
    });

    const activityRedes = await Actividad.create({
      id: `e2e-redes-${Date.now()}`,
      title: 'Actividad Redes',
      description: 'Solo para redes',
      rama: ['redes'],
      tipo: 'quiz',
      dificultad: 'facil',
      imagen: 'test.jpg',
      icono: 'test',
      preguntas: [{ pregunta: 'Test?', opciones: ['A', 'B'], respuestaCorrecta: 0 }]
    });

    const activityMultiple = await Actividad.create({
      id: `e2e-multiple-${Date.now()}`,
      title: 'Actividad Multiple',
      description: 'Para desarrollo y redes',
      rama: ['desarrollo', 'redes'],
      tipo: 'quiz',
      dificultad: 'facil',
      imagen: 'test.jpg',
      icono: 'test',
      preguntas: [{ pregunta: 'Test?', opciones: ['A', 'B'], respuestaCorrecta: 0 }]
    });

    createdActivityIds.push(activityDesarrollo.id, activityRedes.id, activityMultiple.id);

    // Obtener actividades como estudiante
    const response = await axios.get(
      `${API_URL}/api/actividades`,
      {
        headers: { Authorization: `Bearer ${studentToken}` }
      }
    );

    expect(response.status).toBe(200);
    expect(Array.isArray(response.data)).toBe(true);

    // Verificar que solo se retornan actividades con rama 'desarrollo'
    const activityIds = response.data.map((a: any) => a.id);
    expect(activityIds).toContain(activityDesarrollo.id);
    expect(activityIds).not.toContain(activityRedes.id);
    expect(activityIds).toContain(activityMultiple.id);

    // Verificar que todas las actividades retornadas incluyen 'desarrollo' en su rama
    for (const activity of response.data) {
      expect(activity.rama).toContain('desarrollo');
    }
  });

  /**
   * Test 4: Videos are filtered by rama
   */
  it('should filter videos by student rama vocacional', async () => {
    // Crear videos con diferentes ramas
    const videoDesarrollo = await Video.create({
      titulo: 'Video Desarrollo',
      descripcion: 'Video sobre desarrollo',
      rama: 'desarrollo',
      filename: 'desarrollo.mp4',
      originalName: 'desarrollo.mp4',
      mimetype: 'video/mp4',
      size: 1000
    });

    const videoRedes = await Video.create({
      titulo: 'Video Redes',
      descripcion: 'Video sobre redes',
      rama: 'redes',
      filename: 'redes.mp4',
      originalName: 'redes.mp4',
      mimetype: 'video/mp4',
      size: 1000
    });

    createdVideoIds.push(videoDesarrollo.id, videoRedes.id);

    // Obtener videos filtrados por rama del estudiante
    const response = await axios.get(
      `${API_URL}/api/videos?rama=desarrollo`,
      {
        headers: { Authorization: `Bearer ${studentToken}` }
      }
    );

    expect(response.status).toBe(200);
    expect(Array.isArray(response.data)).toBe(true);

    // Verificar que solo se retornan videos de la rama 'desarrollo'
    const videoIds = response.data.map((v: any) => v.id);
    expect(videoIds).toContain(videoDesarrollo.id);
    expect(videoIds).not.toContain(videoRedes.id);

    // Verificar que todos los videos retornados son de la rama correcta
    for (const video of response.data) {
      expect(video.rama).toBe('desarrollo');
    }
  });

  /**
   * Test 5: Complete workflow - Super admin → Admin → Student
   */
  it('should complete full workflow from super admin to student', async () => {
    // 1. Super admin crea un nuevo admin
    const newAdminEmail = `workflow-admin${Date.now()}@e2e.com`;
    const createAdminResponse = await axios.post(
      `${API_URL}/api/auth/create-admin`,
      {
        nombre: 'Workflow',
        apellido: 'Admin',
        email: newAdminEmail,
        password: 'password123'
      },
      {
        headers: { Authorization: `Bearer ${superAdminToken}` }
      }
    );

    expect(createAdminResponse.status).toBe(201);
    const newAdmin = createAdminResponse.data;

    // 2. Nuevo admin hace login
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: newAdminEmail,
      password: 'password123'
    });

    expect(loginResponse.status).toBe(200);
    const newAdminToken = loginResponse.data.token;

    // 3. Nuevo admin crea una actividad
    const activityId = `workflow-activity-${Date.now()}`;
    const createActivityResponse = await axios.post(
      `${API_URL}/api/actividades`,
      {
        id: activityId,
        title: 'Workflow Activity',
        description: 'Created by new admin',
        rama: ['desarrollo'],
        tipo: 'quiz',
        dificultad: 'medio',
        imagen: 'test.jpg',
        icono: 'test',
        preguntas: [{ pregunta: 'Workflow test?', opciones: ['Yes', 'No'], respuestaCorrecta: 0 }]
      },
      {
        headers: { Authorization: `Bearer ${newAdminToken}` }
      }
    );

    expect(createActivityResponse.status).toBe(201);
    createdActivityIds.push(activityId);

    // 4. Estudiante ve la actividad (filtrada por su rama)
    const getActivitiesResponse = await axios.get(
      `${API_URL}/api/actividades`,
      {
        headers: { Authorization: `Bearer ${studentToken}` }
      }
    );

    expect(getActivitiesResponse.status).toBe(200);
    const activityIds = getActivitiesResponse.data.map((a: any) => a.id);
    expect(activityIds).toContain(activityId);

    // Limpiar
    const createdAdminUser = await Usuario.findOne({ where: { email: newAdminEmail } });
    await createdAdminUser?.destroy();
  });
});
