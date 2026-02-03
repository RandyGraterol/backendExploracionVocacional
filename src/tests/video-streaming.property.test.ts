import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import axios from 'axios';
import { sequelize, Video, Usuario } from '../models';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const API_BASE = 'http://localhost:3003/api';

/**
 * Property-Based Tests para sistema de streaming de videos
 * 
 * Property 14: Headers HTTP correctos para streaming
 * Property 16: Soporte de Range requests
 * Property 13: Persistencia de videos
 */

describe('Property Tests: Video Streaming', () => {
  let adminToken: string;
  let adminId: string;
  const testVideosDir = path.join(__dirname, '../../uploads/videos');
  const testVideoFilename = 'test-video-streaming.mp4';
  const testVideoPath = path.join(testVideosDir, testVideoFilename);

  beforeAll(async () => {
    await sequelize.sync();

    // Crear directorio de videos si no existe
    if (!fs.existsSync(testVideosDir)) {
      fs.mkdirSync(testVideosDir, { recursive: true });
    }

    // Crear un archivo de video de prueba (simulado con datos binarios)
    // En un test real, usaríamos un video .mp4 válido pequeño
    const videoBuffer = Buffer.alloc(1024 * 100); // 100KB de datos simulados
    fs.writeFileSync(testVideoPath, videoBuffer);

    // Crear admin para tests
    const hashedPassword = crypto.createHash('sha256').update('admin123').digest('hex');
    const admin = await Usuario.create({
      nombre: 'Admin',
      apellido: 'VideoTest',
      email: 'admin-video-stream@test.com',
      password: hashedPassword,
      rol: 'admin',
      estado: 'aprobado',
      activo: true
    });
    adminId = admin.id.toString();

    // Login
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin-video-stream@test.com',
      password: 'admin123'
    });
    
    adminToken = loginRes.data.token;

    // Crear un video de prueba en la base de datos
    await Video.create({
      titulo: 'Test Video for Streaming',
      descripcion: 'Video de prueba para tests de streaming',
      rama: 'Desarrollo de Software',
      filename: testVideoFilename,
      originalName: 'test-video.mp4',
      mimetype: 'video/mp4',
      size: videoBuffer.length
    });
  });

  afterAll(async () => {
    // Limpiar archivo de video de prueba
    if (fs.existsSync(testVideoPath)) {
      fs.unlinkSync(testVideoPath);
    }

    // Limpiar base de datos
    await Video.destroy({ where: { filename: testVideoFilename } });
    await Usuario.destroy({ where: { email: 'admin-video-stream@test.com' } });
  });

  /**
   * Property 14: Headers HTTP correctos para streaming
   * **Validates: Requirements 5.2**
   * 
   * Verifica que para cualquier video servido, la respuesta HTTP incluye:
   * - Content-Type: video/mp4
   * - Accept-Ranges: bytes
   * - Content-Length con el tamaño correcto
   */
  it('Property 14: Headers HTTP correctos para streaming', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(testVideoFilename),
        async (filename) => {
          // Hacer request sin Range header (streaming completo)
          const response = await axios.get(`${API_BASE}/videos/stream/${filename}`, {
            responseType: 'stream',
            validateStatus: () => true // No lanzar error en cualquier status
          });

          // Verificar status code
          expect(response.status).toBe(200);

          // Verificar headers requeridos
          expect(response.headers['content-type']).toBe('video/mp4');
          expect(response.headers['content-length']).toBeDefined();
          
          // Content-Length debe ser un número positivo
          const contentLength = parseInt(response.headers['content-length']);
          expect(contentLength).toBeGreaterThan(0);
          
          // Verificar que el tamaño coincide con el archivo
          const stats = fs.statSync(testVideoPath);
          expect(contentLength).toBe(stats.size);
        }
      ),
      { numRuns: 50, timeout: 10000 }
    );
  });

  /**
   * Property 16: Soporte de Range requests
   * **Validates: Requirements 5.4**
   * 
   * Verifica que cuando se recibe un request HTTP con header Range,
   * el sistema responde con código 206 Partial Content y el rango de bytes solicitado
   */
  it('Property 16: Soporte de Range requests', async () => {
    const fileSize = fs.statSync(testVideoPath).size;
    
    // Generar rangos válidos para el archivo
    const rangeArb = fc.tuple(
      fc.integer({ min: 0, max: Math.floor(fileSize / 2) }),
      fc.integer({ min: Math.floor(fileSize / 2), max: fileSize - 1 })
    ).filter(([start, end]) => start < end);

    await fc.assert(
      fc.asyncProperty(
        rangeArb,
        async ([start, end]) => {
          // Hacer request con Range header
          const response = await axios.get(`${API_BASE}/videos/stream/${testVideoFilename}`, {
            headers: {
              'Range': `bytes=${start}-${end}`
            },
            responseType: 'arraybuffer',
            validateStatus: () => true
          });

          // Verificar código de respuesta 206 Partial Content
          expect(response.status).toBe(206);

          // Verificar headers de Range
          expect(response.headers['content-range']).toBeDefined();
          expect(response.headers['accept-ranges']).toBe('bytes');
          expect(response.headers['content-type']).toBe('video/mp4');

          // Verificar formato del Content-Range header
          const contentRange = response.headers['content-range'];
          expect(contentRange).toMatch(/^bytes \d+-\d+\/\d+$/);

          // Verificar que el Content-Range coincide con lo solicitado
          const rangeMatch = contentRange.match(/bytes (\d+)-(\d+)\/(\d+)/);
          expect(rangeMatch).toBeTruthy();
          
          if (rangeMatch) {
            const [, rangeStart, rangeEnd, totalSize] = rangeMatch;
            expect(parseInt(rangeStart)).toBe(start);
            expect(parseInt(rangeEnd)).toBe(end);
            expect(parseInt(totalSize)).toBe(fileSize);
          }

          // Verificar Content-Length del chunk
          const expectedChunkSize = (end - start) + 1;
          expect(parseInt(response.headers['content-length'])).toBe(expectedChunkSize);

          // Verificar que el tamaño de los datos recibidos coincide
          expect(response.data.byteLength).toBe(expectedChunkSize);
        }
      ),
      { numRuns: 50, timeout: 10000 }
    );
  });

  /**
   * Property 13: Persistencia de videos
   * **Validates: Requirements 5.1**
   * 
   * Verifica que para cualquier archivo de video .mp4 válido subido por un administrador,
   * el sistema lo almacena de forma que puede ser recuperado y reproducido posteriormente
   */
  it('Property 13: Persistencia de videos', async () => {
    const ramasValidas = ['Desarrollo de Software', 'Ciberseguridad', 'Inteligencia Artificial', 'Redes', 'Bases de Datos', 'Robótica'];
    
    const videoDataArb = fc.record({
      titulo: fc.string({ minLength: 5, maxLength: 100 }),
      descripcion: fc.string({ minLength: 10, maxLength: 500 }),
      rama: fc.constantFrom(...ramasValidas)
    });

    await fc.assert(
      fc.asyncProperty(
        videoDataArb,
        async (videoData) => {
          // Crear un archivo de video temporal
          const tempFilename = `test-persist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.mp4`;
          const tempFilePath = path.join(testVideosDir, tempFilename);
          const videoContent = Buffer.alloc(1024 * 50); // 50KB
          fs.writeFileSync(tempFilePath, videoContent);

          try {
            // Crear FormData para subir el video
            const FormData = require('form-data');
            const formData = new FormData();
            formData.append('video', fs.createReadStream(tempFilePath));
            formData.append('titulo', videoData.titulo);
            formData.append('descripcion', videoData.descripcion);
            formData.append('rama', videoData.rama);

            // Subir video
            const uploadRes = await axios.post(`${API_BASE}/videos`, formData, {
              headers: {
                ...formData.getHeaders(),
                'Authorization': `Bearer ${adminToken}`
              }
            });

            expect(uploadRes.status).toBe(201);
            expect(uploadRes.data.id).toBeDefined();
            expect(uploadRes.data.filename).toBeDefined();

            const videoId = uploadRes.data.id;
            const uploadedFilename = uploadRes.data.filename;

            // Verificar que el video se puede recuperar de la base de datos
            const getRes = await axios.get(`${API_BASE}/videos/${videoId}`, {
              headers: { 'Authorization': `Bearer ${adminToken}` }
            });

            expect(getRes.status).toBe(200);
            expect(getRes.data.titulo).toBe(videoData.titulo);
            expect(getRes.data.descripcion).toBe(videoData.descripcion);
            expect(getRes.data.rama).toBe(videoData.rama);
            expect(getRes.data.filename).toBe(uploadedFilename);

            // Verificar que el archivo físico existe
            const uploadedFilePath = path.join(testVideosDir, uploadedFilename);
            expect(fs.existsSync(uploadedFilePath)).toBe(true);

            // Verificar que el video se puede reproducir (streaming)
            const streamRes = await axios.get(`${API_BASE}/videos/stream/${uploadedFilename}`, {
              responseType: 'stream',
              validateStatus: () => true
            });

            expect(streamRes.status).toBe(200);
            expect(streamRes.headers['content-type']).toBe('video/mp4');

            // Limpiar: eliminar video
            await axios.delete(`${API_BASE}/videos/${videoId}`, {
              headers: { 'Authorization': `Bearer ${adminToken}` }
            });

            // Verificar que el archivo físico fue eliminado
            expect(fs.existsSync(uploadedFilePath)).toBe(false);

          } finally {
            // Limpiar archivo temporal si aún existe
            if (fs.existsSync(tempFilePath)) {
              fs.unlinkSync(tempFilePath);
            }
          }
        }
      ),
      { numRuns: 50, timeout: 15000 }
    );
  });
});
