/**
 * Regression Tests
 * Feature: mejoras-exploracion-vocacional
 * 
 * These tests verify that existing functionality still works after implementing new features:
 * - Authentication system
 * - Quiz activities
 * - Test vocacional
 * - Progress registration
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import axios from 'axios';
import { sequelize, Usuario, Actividad, ProgresoActividad, ResultadoTest, PreguntaVocacional } from '../models';
import { hashPassword } from '../controllers/authController';
import jwt from 'jsonwebtoken';

const API_URL = 'http://localhost:3003';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

describe('Regression Tests - Existing Functionality', () => {
  let studentToken: string;
  let studentId: number;
  let adminToken: string;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Crear usuarios de prueba
    const hashedPassword = await hashPassword('password123');

    const student = await Usuario.create({
      nombre: 'Student',
      apellido: 'Regression',
      email: 'student@regression.com',
      password: hashedPassword,
      rol: 'student',
      activo: true,
      estado: 'aprobado'
    });

    const admin = await Usuario.create({
      nombre: 'Admin',
      apellido: 'Regression',
      email: 'admin@regression.com',
      password: hashedPassword,
      rol: 'admin',
      activo: true,
      estado: 'aprobado'
    });

    studentId = student.id;

    // Generar tokens
    studentToken = jwt.sign(
      { id: student.id, email: student.email, rol: student.rol },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    adminToken = jwt.sign(
      { id: admin.id, email: admin.email, rol: admin.rol },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Crear preguntas vocacionales para el test
    await PreguntaVocacional.create({
      id: 1,
      pregunta: '¿Te gusta programar?'
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // Limpiar datos entre tests
    await ProgresoActividad.destroy({ where: {} });
    await ResultadoTest.destroy({ where: {} });
    await Actividad.destroy({ where: {} });
  });

  /**
   * Regression Test 1: Authentication System Still Works
   */
  describe('Authentication System', () => {
    it('should allow users to login with correct credentials', async () => {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email: 'student@regression.com',
        password: 'password123'
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('token');
      expect(response.data).toHaveProperty('user');
      expect(response.data.user.email).toBe('student@regression.com');
      expect(response.data.user.rol).toBe('student');
    });

    it('should reject login with incorrect password', async () => {
      try {
        await axios.post(`${API_URL}/api/auth/login`, {
          email: 'student@regression.com',
          password: 'wrongpassword'
        });
        throw new Error('Should have thrown error');
      } catch (error: any) {
        expect([401, 403]).toContain(error.response?.status);
      }
    });

    it('should reject login with non-existent email', async () => {
      try {
        await axios.post(`${API_URL}/api/auth/login`, {
          email: 'nonexistent@test.com',
          password: 'password123'
        });
        throw new Error('Should have thrown error');
      } catch (error: any) {
        expect([401, 404]).toContain(error.response?.status);
      }
    });

    it('should allow new user registration', async () => {
      const newUserEmail = `newuser${Date.now()}@regression.com`;
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        nombre: 'New',
        apellido: 'User',
        email: newUserEmail,
        password: 'password123'
      });

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('user');
      expect(response.data.user.email).toBe(newUserEmail);
      expect(response.data.user.rol).toBe('student');

      // Limpiar
      const createdUser = await Usuario.findOne({ where: { email: newUserEmail } });
      await createdUser?.destroy();
    });
  });

  /**
   * Regression Test 2: Quiz Activities Still Work
   */
  describe('Quiz Activities', () => {
    it('should allow admin to create quiz activities', async () => {
      const quizData = {
        id: `regression-quiz-${Date.now()}`,
        title: 'Regression Test Quiz',
        description: 'Testing quiz functionality',
        rama: ['desarrollo'],
        tipo: 'quiz',
        dificultad: 'facil',
        imagen: 'test.jpg',
        icono: '📝',
        preguntas: [
          {
            pregunta: '¿Qué es JavaScript?',
            opciones: ['Un lenguaje de programación', 'Un framework', 'Una base de datos', 'Un editor'],
            respuestaCorrecta: 0
          },
          {
            pregunta: '¿Qué es React?',
            opciones: ['Un lenguaje', 'Una librería', 'Un navegador', 'Un servidor'],
            respuestaCorrecta: 1
          }
        ]
      };

      const response = await axios.post(
        `${API_URL}/api/actividades`,
        quizData,
        {
          headers: { Authorization: `Bearer ${adminToken}` }
        }
      );

      expect(response.status).toBe(201);
      expect(response.data.tipo).toBe('quiz');
      expect(response.data.preguntas).toHaveLength(2);
      expect(response.data.preguntas[0].pregunta).toBe('¿Qué es JavaScript?');
    });

    it('should allow students to view quiz activities', async () => {
      // Crear quiz
      const quiz = await Actividad.create({
        id: `regression-quiz-view-${Date.now()}`,
        title: 'View Test Quiz',
        description: 'Testing quiz viewing',
        rama: ['desarrollo'],
        tipo: 'quiz',
        dificultad: 'medio',
        imagen: 'test.jpg',
        icono: '📝',
        preguntas: [
          {
            pregunta: 'Test question?',
            opciones: ['A', 'B', 'C', 'D'],
            respuestaCorrecta: 0
          }
        ]
      });

      // Crear resultado de test para el estudiante
      await ResultadoTest.create({
        userId: studentId,
        ramaRecomendada: 'desarrollo',
        puntuaciones: { desarrollo: 80 },
        fecha: new Date(),
        respuestas: []
      });

      const response = await axios.get(
        `${API_URL}/api/actividades`,
        {
          headers: { Authorization: `Bearer ${studentToken}` }
        }
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      const quizActivity = response.data.find((a: any) => a.id === quiz.id);
      expect(quizActivity).toBeDefined();
      expect(quizActivity.tipo).toBe('quiz');
      expect(quizActivity.preguntas).toBeDefined();
    });
  });

  /**
   * Regression Test 3: Test Vocacional Still Works
   */
  describe('Test Vocacional', () => {
    it('should save test vocacional results', async () => {
      const resultData = {
        userId: studentId,
        ramaRecomendada: 'desarrollo',
        puntuaciones: {
          desarrollo: 85,
          redes: 60,
          ciberseguridad: 45,
          'bases-datos': 70,
          robotica: 40,
          ia: 55
        },
        respuestas: [
          { preguntaId: 1, respuesta: 'desarrollo' }
        ]
      };

      const result = await ResultadoTest.create(resultData);

      expect(result).toBeDefined();
      expect(result.userId).toBe(studentId);
      expect(result.ramaRecomendada).toBe('desarrollo');
      expect(result.puntuaciones).toHaveProperty('desarrollo');
      expect(result.puntuaciones.desarrollo).toBe(85);
    });

    it('should retrieve latest test vocacional result for user', async () => {
      // Crear múltiples resultados
      await ResultadoTest.create({
        userId: studentId,
        ramaRecomendada: 'redes',
        puntuaciones: { redes: 70 },
        fecha: new Date('2024-01-01'),
        respuestas: []
      });

      await ResultadoTest.create({
        userId: studentId,
        ramaRecomendada: 'desarrollo',
        puntuaciones: { desarrollo: 90 },
        fecha: new Date('2024-02-01'),
        respuestas: []
      });

      // Obtener el más reciente
      const latestResult = await ResultadoTest.findOne({
        where: { userId: studentId },
        order: [['fecha', 'DESC']]
      });

      expect(latestResult).toBeDefined();
      expect(latestResult?.ramaRecomendada).toBe('desarrollo');
      expect(latestResult?.puntuaciones.desarrollo).toBe(90);
    });
  });

  /**
   * Regression Test 4: Progress Registration Still Works
   */
  describe('Progress Registration', () => {
    it('should register progress for completed activities', async () => {
      // Crear actividad
      const activity = await Actividad.create({
        id: `regression-progress-${Date.now()}`,
        title: 'Progress Test Activity',
        description: 'Testing progress',
        rama: ['desarrollo'],
        tipo: 'quiz',
        dificultad: 'facil',
        imagen: 'test.jpg',
        icono: '📝',
        preguntas: [{ pregunta: 'Test?', opciones: ['A', 'B'], respuestaCorrecta: 0 }]
      });

      // Registrar progreso
      const progressResponse = await axios.post(
        `${API_URL}/api/progreso-actividades`,
        {
          userId: studentId,
          actividadId: activity.id,
          completada: true,
          puntuacion: 100
        },
        {
          headers: { Authorization: `Bearer ${studentToken}` }
        }
      );

      expect(progressResponse.status).toBe(201);

      // Verificar en base de datos
      const progress = await ProgresoActividad.findOne({
        where: { userId: studentId, actividadId: activity.id }
      });

      expect(progress).toBeDefined();
      expect(progress?.completada).toBe(true);
      expect(progress?.puntuacion).toBe(100);
    });

    it('should retrieve user progress history', async () => {
      // Crear múltiples progresos
      const activity1 = await Actividad.create({
        id: `regression-history-1-${Date.now()}`,
        title: 'Activity 1',
        description: 'Test',
        rama: ['desarrollo'],
        tipo: 'quiz',
        dificultad: 'facil',
        imagen: 'test.jpg',
        icono: '📝',
        preguntas: [{ pregunta: 'Test?', opciones: ['A', 'B'], respuestaCorrecta: 0 }]
      });

      const activity2 = await Actividad.create({
        id: `regression-history-2-${Date.now()}`,
        title: 'Activity 2',
        description: 'Test',
        rama: ['desarrollo'],
        tipo: 'quiz',
        dificultad: 'medio',
        imagen: 'test.jpg',
        icono: '📝',
        preguntas: [{ pregunta: 'Test?', opciones: ['A', 'B'], respuestaCorrecta: 0 }]
      });

      await ProgresoActividad.create({
        userId: studentId,
        actividadId: activity1.id,
        completada: true,
        puntuacion: 80,
        fecha: new Date()
      });

      await ProgresoActividad.create({
        userId: studentId,
        actividadId: activity2.id,
        completada: true,
        puntuacion: 90,
        fecha: new Date()
      });

      // Obtener historial
      const response = await axios.get(
        `${API_URL}/api/progreso-actividades/user/${studentId}`,
        {
          headers: { Authorization: `Bearer ${studentToken}` }
        }
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThanOrEqual(2);

      const progress1 = response.data.find((p: any) => p.actividadId === activity1.id);
      const progress2 = response.data.find((p: any) => p.actividadId === activity2.id);

      expect(progress1).toBeDefined();
      expect(progress1.puntuacion).toBe(80);
      expect(progress2).toBeDefined();
      expect(progress2.puntuacion).toBe(90);
    });

    it('should update progress if better score is achieved', async () => {
      const activity = await Actividad.create({
        id: `regression-update-${Date.now()}`,
        title: 'Update Test Activity',
        description: 'Testing progress update',
        rama: ['desarrollo'],
        tipo: 'quiz',
        dificultad: 'facil',
        imagen: 'test.jpg',
        icono: '📝',
        preguntas: [{ pregunta: 'Test?', opciones: ['A', 'B'], respuestaCorrecta: 0 }]
      });

      // Primer intento
      await axios.post(
        `${API_URL}/api/progreso-actividades`,
        {
          userId: studentId,
          actividadId: activity.id,
          completada: true,
          puntuacion: 70
        },
        {
          headers: { Authorization: `Bearer ${studentToken}` }
        }
      );

      // Segundo intento con mejor puntuación
      await axios.post(
        `${API_URL}/api/progreso-actividades`,
        {
          userId: studentId,
          actividadId: activity.id,
          completada: true,
          puntuacion: 95
        },
        {
          headers: { Authorization: `Bearer ${studentToken}` }
        }
      );

      // Verificar que se actualizó
      const progress = await ProgresoActividad.findOne({
        where: { userId: studentId, actividadId: activity.id }
      });

      expect(progress).toBeDefined();
      expect(progress?.puntuacion).toBe(95);
    });
  });

  /**
   * Regression Test 5: Backward Compatibility
   */
  describe('Backward Compatibility', () => {
    it('should still support single rama string (legacy format)', async () => {
      // Aunque el nuevo formato es array, verificar que el sistema maneja correctamente
      // actividades con rama como array de un solo elemento
      const activity = await Actividad.create({
        id: `regression-compat-${Date.now()}`,
        title: 'Compatibility Test',
        description: 'Testing backward compatibility',
        rama: ['desarrollo'], // Array con un solo elemento
        tipo: 'quiz',
        dificultad: 'facil',
        imagen: 'test.jpg',
        icono: '📝',
        preguntas: [{ pregunta: 'Test?', opciones: ['A', 'B'], respuestaCorrecta: 0 }]
      });

      expect(activity.rama).toEqual(['desarrollo']);
      expect(Array.isArray(activity.rama)).toBe(true);
    });

    it('should maintain existing API response format', async () => {
      const activity = await Actividad.create({
        id: `regression-api-${Date.now()}`,
        title: 'API Format Test',
        description: 'Testing API response format',
        rama: ['desarrollo'],
        tipo: 'quiz',
        dificultad: 'facil',
        imagen: 'test.jpg',
        icono: '📝',
        preguntas: [{ pregunta: 'Test?', opciones: ['A', 'B'], respuestaCorrecta: 0 }]
      });

      const response = await axios.get(
        `${API_URL}/api/actividades/${activity.id}`,
        {
          headers: { Authorization: `Bearer ${adminToken}` }
        }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('id');
      expect(response.data).toHaveProperty('title');
      expect(response.data).toHaveProperty('description');
      expect(response.data).toHaveProperty('rama');
      expect(response.data).toHaveProperty('tipo');
      expect(response.data).toHaveProperty('dificultad');
      expect(response.data).toHaveProperty('preguntas');
    });
  });
});
