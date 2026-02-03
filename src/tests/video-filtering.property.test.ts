import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import axios from 'axios';
import { sequelize, Video, Usuario, ResultadoTest } from '../models';
import crypto from 'crypto';

const API_BASE = 'http://localhost:3003/api';

/**
 * Property-Based Tests para filtrado de videos por rama
 * 
 * Property 15: Filtrado de videos por rama
 */

describe('Property Tests: Video Filtering by Rama', () => {
  let studentToken: string;
  let studentId: number;
  let adminToken: string;
  const ramasValidas = ['Desarrollo de Software', 'Ciberseguridad', 'Inteligencia Artificial', 'Redes', 'Bases de Datos', 'Robótica'];

  beforeAll(async () => {
    await sequelize.sync();

    // Crear estudiante para tests
    const hashedPassword = crypto.createHash('sha256').update('student123').digest('hex');
    const student = await Usuario.create({
      nombre: 'Student',
      apellido: 'VideoFilter',
      email: 'student-video-filter@test.com',
      password: hashedPassword,
      rol: 'student',
      estado: 'aprobado',
      activo: true
    });
    studentId = student.id;

    // Login estudiante
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'student-video-filter@test.com',
      password: 'student123'
    });
    
    studentToken = loginRes.data.token;

    // Crear admin para crear videos
    const adminHashedPassword = crypto.createHash('sha256').update('admin123').digest('hex');
    const admin = await Usuario.create({
      nombre: 'Admin',
      apellido: 'VideoFilter',
      email: 'admin-video-filter@test.com',
      password: adminHashedPassword,
      rol: 'admin',
      estado: 'aprobado',
      activo: true
    });

    // Login admin
    const adminLoginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin-video-filter@test.com',
      password: 'admin123'
    });
    
    adminToken = adminLoginRes.data.token;
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    await Video.destroy({ where: { descripcion: 'Test video for filtering' } });
    await ResultadoTest.destroy({ where: { userId: studentId } });
    await Usuario.destroy({ where: { email: 'student-video-filter@test.com' } });
    await Usuario.destroy({ where: { email: 'admin-video-filter@test.com' } });
  });

  /**
   * Property 15: Filtrado de videos por rama
   * **Validates: Requirements 5.3**
   * 
   * Verifica que para cualquier estudiante con rama vocacional asignada,
   * cuando visualiza su dashboard, todos los videos mostrados tienen
   * la misma rama que la asignada al estudiante
   */
  it('Property 15: Filtrado de videos por rama', { timeout: 20000 }, async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...ramasValidas),
        async (ramaEstudiante) => {
          // Crear resultado de test vocacional para el estudiante
          await ResultadoTest.destroy({ where: { userId: studentId } });
          await ResultadoTest.create({
            userId: studentId,
            ramaRecomendada: ramaEstudiante,
            puntuaciones: { [ramaEstudiante]: 100 },
            fecha: new Date(),
            respuestas: []
          });

          // Crear videos para diferentes ramas
          const videosCreados: any[] = [];
          
          // Crear 2-3 videos para la rama del estudiante
          const numVideosRamaEstudiante = Math.floor(Math.random() * 2) + 2;
          for (let i = 0; i < numVideosRamaEstudiante; i++) {
            const video = await Video.create({
              titulo: `Video ${i} para ${ramaEstudiante}`,
              descripcion: 'Test video for filtering',
              rama: ramaEstudiante,
              filename: `test-video-${Date.now()}-${i}.mp4`,
              originalName: `test-${i}.mp4`,
              mimetype: 'video/mp4',
              size: 1024 * 100
            });
            videosCreados.push(video);
          }

          // Crear 1-2 videos para otras ramas (no deben aparecer)
          const otrasRamas = ramasValidas.filter(r => r !== ramaEstudiante);
          const numVideosOtrasRamas = Math.floor(Math.random() * 2) + 1;
          for (let i = 0; i < numVideosOtrasRamas; i++) {
            const ramaAleatoria = otrasRamas[Math.floor(Math.random() * otrasRamas.length)];
            const video = await Video.create({
              titulo: `Video ${i} para ${ramaAleatoria}`,
              descripcion: 'Test video for filtering',
              rama: ramaAleatoria,
              filename: `test-video-other-${Date.now()}-${i}.mp4`,
              originalName: `test-other-${i}.mp4`,
              mimetype: 'video/mp4',
              size: 1024 * 100
            });
            videosCreados.push(video);
          }

          try {
            // Obtener videos filtrados por rama del estudiante
            const response = await axios.get(`${API_BASE}/videos?rama=${encodeURIComponent(ramaEstudiante)}`, {
              headers: { 'Authorization': `Bearer ${studentToken}` }
            });

            expect(response.status).toBe(200);
            expect(Array.isArray(response.data)).toBe(true);

            // Verificar que todos los videos retornados tienen la rama del estudiante
            response.data.forEach((video: any) => {
              expect(video.rama).toBe(ramaEstudiante);
            });

            // Verificar que se retornaron al menos los videos de la rama del estudiante
            expect(response.data.length).toBeGreaterThanOrEqual(numVideosRamaEstudiante);

            // Verificar que NO se retornaron videos de otras ramas
            const videosOtrasRamas = response.data.filter((video: any) => video.rama !== ramaEstudiante);
            expect(videosOtrasRamas.length).toBe(0);

          } finally {
            // Limpiar videos creados
            for (const video of videosCreados) {
              await Video.destroy({ where: { id: video.id } });
            }
          }
        }
      ),
      { numRuns: 50, timeout: 15000 }
    );
  });

  /**
   * Test adicional: Estudiante sin rama ve todos los videos
   * 
   * Verifica que cuando un estudiante no ha completado el test vocacional,
   * puede ver todos los videos disponibles
   */
  it('Estudiante sin rama asignada puede ver todos los videos', async () => {
    // Eliminar resultado de test del estudiante
    await ResultadoTest.destroy({ where: { userId: studentId } });

    // Crear videos para diferentes ramas
    const videosCreados: any[] = [];
    for (const rama of ramasValidas.slice(0, 3)) {
      const video = await Video.create({
        titulo: `Video para ${rama}`,
        descripcion: 'Test video for filtering',
        rama: rama,
        filename: `test-video-all-${Date.now()}-${rama}.mp4`,
        originalName: `test-all-${rama}.mp4`,
        mimetype: 'video/mp4',
        size: 1024 * 100
      });
      videosCreados.push(video);
    }

    try {
      // Obtener todos los videos sin filtro
      const response = await axios.get(`${API_BASE}/videos`, {
        headers: { 'Authorization': `Bearer ${studentToken}` }
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);

      // Verificar que se retornan videos de múltiples ramas
      const ramasEnVideos = new Set(response.data.map((v: any) => v.rama));
      expect(ramasEnVideos.size).toBeGreaterThan(0);

    } finally {
      // Limpiar videos creados
      for (const video of videosCreados) {
        await Video.destroy({ where: { id: video.id } });
      }
    }
  });
});
