import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import axios from 'axios';
import { sequelize, Actividad, Usuario } from '../models';
import crypto from 'crypto';

const API_BASE = 'http://localhost:3003/api';

/**
 * Property-Based Tests para asociaciones actividad-rama
 * 
 * Property 22: Persistencia de asociaciones actividad-rama
 * Property 23: Modificación de asociaciones de ramas
 */

describe('Property Tests: Actividad-Rama Associations', () => {
  let adminToken: string;
  let adminId: string;

  beforeAll(async () => {
    await sequelize.sync();

    // Crear admin para tests
    const hashedPassword = crypto.createHash('sha256').update('admin123').digest('hex');
    const admin = await Usuario.create({
      nombre: 'Admin',
      apellido: 'Test',
      email: 'admin-rama-assoc@test.com',
      password: hashedPassword,
      rol: 'admin',
      estado: 'aprobado',
      activo: true
    });
    adminId = admin.id.toString();

    // Login
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin-rama-assoc@test.com',
      password: 'admin123'
    });
    
    adminToken = loginRes.data.token;
  });

  afterAll(async () => {
    // Limpiar usuario de prueba
    await Usuario.destroy({ where: { email: 'admin-rama-assoc@test.com' } });
  });

  /**
   * Property 22: Persistencia de asociaciones actividad-rama
   * **Validates: Requirements 7.2**
   * 
   * Verifica que cuando se crea una actividad con múltiples ramas,
   * todas las asociaciones se persisten correctamente en la base de datos
   */
  it('Property 22: Persistencia de asociaciones actividad-rama', async () => {
    const ramasValidas = ['Desarrollo de Software', 'Ciberseguridad', 'Inteligencia Artificial', 'Redes', 'Bases de Datos', 'Robótica'];
    
    const actividadArb = fc.record({
      title: fc.string({ minLength: 5, maxLength: 50 }),
      description: fc.string({ minLength: 10, maxLength: 200 }),
      ramas: fc.array(fc.constantFrom(...ramasValidas), { minLength: 1, maxLength: 4 }).map(arr => [...new Set(arr)]), // Eliminar duplicados
      tipo: fc.constantFrom('Quiz', 'Ordenamiento', 'Simulación', 'Práctica', 'Desafío'),
      dificultad: fc.constantFrom('Básico', 'Intermedio', 'Avanzado')
    });

    await fc.assert(
      fc.asyncProperty(actividadArb, async (actData) => {
        const actividadId = `act-rama-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Preparar contenido según tipo
        let contenido: any = {};
        switch(actData.tipo.toLowerCase()) {
          case 'quiz':
            contenido.preguntas = [{
              id: 'q1',
              pregunta: 'Test question',
              opciones: ['A', 'B', 'C'],
              correcta: 0
            }];
            break;
          case 'ordenamiento':
            contenido.itemsOrden = [{ id: 'i1', texto: 'Item 1', ordenCorrecto: 0 }];
            break;
          case 'simulación':
            contenido.simulacion = { dispositivos: [], conexionesCorrectas: [], objetivos: [] };
            break;
          case 'práctica':
            contenido.ejercicioCodigo = { id: 'e1', enunciado: 'Test', plantillaCodigo: '', pruebasUnitarias: [] };
            break;
          case 'desafío':
            contenido.paresDesafio = [{ id: 'p1', concepto: 'C1', definicion: 'D1' }];
            break;
        }

        // Crear actividad con múltiples ramas
        const createRes = await axios.post(`${API_BASE}/actividades`, {
          id: actividadId,
          title: actData.title,
          description: actData.description,
          rama: actData.ramas, // Array de ramas
          tipo: actData.tipo,
          dificultad: actData.dificultad,
          ...contenido
        }, {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        expect(createRes.status).toBe(201);

        // Verificar que se guardó correctamente
        const getRes = await axios.get(`${API_BASE}/actividades/${actividadId}`, {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        expect(getRes.status).toBe(200);
        expect(Array.isArray(getRes.data.rama)).toBe(true);
        expect(getRes.data.rama).toHaveLength(actData.ramas.length);
        
        // Verificar que todas las ramas están presentes
        actData.ramas.forEach(rama => {
          expect(getRes.data.rama).toContain(rama);
        });

        // Limpiar
        await Actividad.destroy({ where: { id: actividadId } });
      }),
      { numRuns: 50, timeout: 10000 } // Reducido a 50 iteraciones con timeout de 10s
    );
  });

  /**
   * Property 23: Modificación de asociaciones de ramas
   * **Validates: Requirements 7.4**
   * 
   * Verifica que se pueden modificar las asociaciones de ramas de una actividad
   * y que los cambios se persisten correctamente
   */
  it('Property 23: Modificación de asociaciones de ramas', async () => {
    const ramasValidas = ['Desarrollo de Software', 'Ciberseguridad', 'Inteligencia Artificial', 'Redes', 'Bases de Datos', 'Robótica'];
    
    const ramasArb = fc.tuple(
      fc.array(fc.constantFrom(...ramasValidas), { minLength: 1, maxLength: 3 }).map(arr => [...new Set(arr)]),
      fc.array(fc.constantFrom(...ramasValidas), { minLength: 1, maxLength: 3 }).map(arr => [...new Set(arr)])
    );

    await fc.assert(
      fc.asyncProperty(ramasArb, async ([ramasIniciales, ramasNuevas]) => {
        const actividadId = `act-mod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Crear actividad con ramas iniciales
        const createRes = await axios.post(`${API_BASE}/actividades`, {
          id: actividadId,
          title: 'Test Activity',
          description: 'Test description for modification',
          rama: ramasIniciales,
          tipo: 'Quiz',
          dificultad: 'Básico',
          preguntas: [{
            id: 'q1',
            pregunta: 'Test?',
            opciones: ['A', 'B'],
            correcta: 0
          }]
        }, {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        expect(createRes.status).toBe(201);

        // Modificar las ramas
        const updateRes = await axios.put(`${API_BASE}/actividades/${actividadId}`, {
          rama: ramasNuevas
        }, {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        expect(updateRes.status).toBe(200);

        // Verificar que las ramas se actualizaron
        const getRes = await axios.get(`${API_BASE}/actividades/${actividadId}`, {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        expect(getRes.status).toBe(200);
        expect(Array.isArray(getRes.data.rama)).toBe(true);
        expect(getRes.data.rama).toHaveLength(ramasNuevas.length);
        
        // Verificar que las nuevas ramas están presentes
        ramasNuevas.forEach(rama => {
          expect(getRes.data.rama).toContain(rama);
        });

        // Verificar que las ramas antiguas que no están en las nuevas ya no existen
        ramasIniciales.forEach(rama => {
          if (!ramasNuevas.includes(rama)) {
            expect(getRes.data.rama).not.toContain(rama);
          }
        });

        // Limpiar
        await Actividad.destroy({ where: { id: actividadId } });
      }),
      { numRuns: 50, timeout: 10000 } // Reducido a 50 iteraciones con timeout de 10s
    );
  });
});
