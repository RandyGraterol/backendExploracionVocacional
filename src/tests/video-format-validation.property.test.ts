import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import axios from 'axios';
import { sequelize, Usuario } from '../models';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const API_BASE = 'http://localhost:3003/api';

/**
 * Property-Based Tests para validación de formato de videos
 * 
 * Property 17: Validación de formato de video
 */

describe('Property Tests: Video Format Validation', () => {
  let adminToken: string;
  let adminId: string;
  const testVideosDir = path.join(__dirname, '../../uploads/videos');

  beforeAll(async () => {
    await sequelize.sync();

    // Crear directorio de videos si no existe
    if (!fs.existsSync(testVideosDir)) {
      fs.mkdirSync(testVideosDir, { recursive: true });
    }

    // Crear admin para tests
    const hashedPassword = crypto.createHash('sha256').update('admin123').digest('hex');
    const admin = await Usuario.create({
      nombre: 'Admin',
      apellido: 'FormatTest',
      email: 'admin-format-test@test.com',
      password: hashedPassword,
      rol: 'admin',
      estado: 'aprobado',
      activo: true
    });
    adminId = admin.id.toString();

    // Login
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin-format-test@test.com',
      password: 'admin123'
    });
    
    adminToken = loginRes.data.token;
  });

  afterAll(async () => {
    // Limpiar usuario de prueba
    await Usuario.destroy({ where: { email: 'admin-format-test@test.com' } });
  });

  /**
   * Property 17: Validación de formato de video
   * **Validates: Requirements 5.6**
   * 
   * Verifica que para cualquier archivo subido que no sea formato .mp4 válido,
   * el sistema rechaza la subida con un error de validación
   */
  it('Property 17: Validación de formato de video - rechaza archivos no .mp4', async () => {
    // Generar diferentes extensiones y mimetypes inválidos
    const invalidFormatsArb = fc.record({
      extension: fc.constantFrom('.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.txt', '.pdf', '.jpg'),
      mimetype: fc.constantFrom('video/x-msvideo', 'video/quicktime', 'video/x-ms-wmv', 'video/x-flv', 'video/webm', 'video/x-matroska', 'text/plain', 'application/pdf', 'image/jpeg')
    });

    await fc.assert(
      fc.asyncProperty(
        invalidFormatsArb,
        async ({ extension, mimetype }) => {
          // Crear un archivo temporal con extensión inválida
          const tempFilename = `test-invalid-${Date.now()}${extension}`;
          const tempFilePath = path.join(testVideosDir, tempFilename);
          const fileContent = Buffer.alloc(1024); // 1KB de datos
          fs.writeFileSync(tempFilePath, fileContent);

          try {
            // Intentar subir el archivo con formato inválido
            const FormData = require('form-data');
            const formData = new FormData();
            
            // Simular el archivo con mimetype inválido
            formData.append('video', fs.createReadStream(tempFilePath), {
              filename: tempFilename,
              contentType: mimetype
            });
            formData.append('titulo', 'Test Invalid Video');
            formData.append('descripcion', 'Testing invalid format');
            formData.append('rama', 'Desarrollo de Software');

            // Intentar subir - debe fallar
            try {
              const uploadRes = await axios.post(`${API_BASE}/videos`, formData, {
                headers: {
                  ...formData.getHeaders(),
                  'Authorization': `Bearer ${adminToken}`
                },
                validateStatus: () => true // No lanzar error automáticamente
              });

              // Verificar que la respuesta es un error (400 o 500)
              expect(uploadRes.status).toBeDefined();
              expect(uploadRes.status).toBeGreaterThanOrEqual(400);
              
              // Verificar que hay un mensaje de error
              expect(uploadRes.data.error).toBeDefined();
              
              // El mensaje debe indicar que el formato no es válido
              const errorMessage = uploadRes.data.error.toLowerCase();
              expect(
                errorMessage.includes('formato') ||
                errorMessage.includes('tipo') ||
                errorMessage.includes('permitido') ||
                errorMessage.includes('extensión') ||
                errorMessage.includes('mp4')
              ).toBe(true);

            } catch (error: any) {
              // Si axios lanza error, también es válido (significa que el servidor rechazó)
              // Verificar que hay un error de respuesta
              expect(error.response).toBeDefined();
              if (error.response) {
                expect(error.response.status).toBeGreaterThanOrEqual(400);
              }
            }

          } finally {
            // Limpiar archivo temporal
            if (fs.existsSync(tempFilePath)) {
              fs.unlinkSync(tempFilePath);
            }
          }
        }
      ),
      { numRuns: 50, timeout: 10000 }
    );
  });

  /**
   * Test complementario: Validación acepta archivos .mp4 válidos
   * 
   * Verifica que archivos con extensión .mp4 y mimetype correcto son aceptados
   */
  it('Validación acepta archivos .mp4 válidos', async () => {
    const validMp4Arb = fc.record({
      titulo: fc.string({ minLength: 5, maxLength: 50 }),
      descripcion: fc.string({ minLength: 10, maxLength: 200 }),
      rama: fc.constantFrom('Desarrollo de Software', 'Ciberseguridad', 'Inteligencia Artificial')
    });

    await fc.assert(
      fc.asyncProperty(
        validMp4Arb,
        async ({ titulo, descripcion, rama }) => {
          // Crear un archivo .mp4 temporal
          const tempFilename = `test-valid-${Date.now()}.mp4`;
          const tempFilePath = path.join(testVideosDir, tempFilename);
          const fileContent = Buffer.alloc(1024 * 10); // 10KB
          fs.writeFileSync(tempFilePath, fileContent);

          try {
            // Subir el archivo .mp4 válido
            const FormData = require('form-data');
            const formData = new FormData();
            
            formData.append('video', fs.createReadStream(tempFilePath), {
              filename: tempFilename,
              contentType: 'video/mp4'
            });
            formData.append('titulo', titulo);
            formData.append('descripcion', descripcion);
            formData.append('rama', rama);

            const uploadRes = await axios.post(`${API_BASE}/videos`, formData, {
              headers: {
                ...formData.getHeaders(),
                'Authorization': `Bearer ${adminToken}`
              }
            });

            // Verificar que la subida fue exitosa
            expect(uploadRes.status).toBe(201);
            expect(uploadRes.data.id).toBeDefined();
            expect(uploadRes.data.filename).toBeDefined();
            expect(uploadRes.data.mimetype).toBe('video/mp4');

            // Limpiar: eliminar video de la base de datos
            await axios.delete(`${API_BASE}/videos/${uploadRes.data.id}`, {
              headers: { 'Authorization': `Bearer ${adminToken}` }
            });

          } finally {
            // Limpiar archivo temporal si aún existe
            if (fs.existsSync(tempFilePath)) {
              fs.unlinkSync(tempFilePath);
            }
          }
        }
      ),
      { numRuns: 50, timeout: 10000 }
    );
  });

  /**
   * Test de edge case: Archivo con extensión .mp4 pero mimetype incorrecto
   * 
   * Verifica que el sistema valida tanto la extensión como el mimetype
   */
  it('Rechaza archivos con extensión .mp4 pero mimetype incorrecto', async () => {
    const tempFilename = `test-fake-mp4-${Date.now()}.mp4`;
    const tempFilePath = path.join(testVideosDir, tempFilename);
    const fileContent = Buffer.alloc(1024);
    fs.writeFileSync(tempFilePath, fileContent);

    try {
      const FormData = require('form-data');
      const formData = new FormData();
      
      // Archivo con extensión .mp4 pero mimetype de texto
      formData.append('video', fs.createReadStream(tempFilePath), {
        filename: tempFilename,
        contentType: 'text/plain' // Mimetype incorrecto
      });
      formData.append('titulo', 'Fake MP4');
      formData.append('descripcion', 'Testing mimetype validation');
      formData.append('rama', 'Desarrollo de Software');

      const uploadRes = await axios.post(`${API_BASE}/videos`, formData, {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${adminToken}`
        },
        validateStatus: () => true
      });

      // Debe rechazar la subida
      expect(uploadRes.status).toBeGreaterThanOrEqual(400);
      expect(uploadRes.data.error).toBeDefined();

    } finally {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  });
});
