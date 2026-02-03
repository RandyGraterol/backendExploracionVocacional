/**
 * Property-Based Tests para renderizado de ramas
 * Feature: mejoras-exploracion-vocacional
 * 
 * Estos tests verifican las propiedades universales del renderizado de ramas:
 * - Property 8: Renderizado completo de información de rama
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import axios from 'axios';
import { sequelize, Rama } from '../models';

const API_URL = 'http://localhost:3003';

describe('Property 8: Renderizado completo de información de rama', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await Rama.destroy({ where: {}, truncate: true });
    await sequelize.close();
  });

  /**
   * Property 8: Renderizado completo de información de rama
   * Feature: mejoras-exploracion-vocacional, Property 8: Renderizado completo de información de rama
   * **Validates: Requirements 3.4**
   * 
   * Para cualquier rama mostrada en la interfaz, el contenido renderizado debe incluir
   * nombre, descripción y al menos un elemento visual (icono o imagen).
   * 
   * NOTE: This test requires HTTP server running - skipped in unit test mode
   */
  it.skip('Property 8: Renderizado completo de información de rama', async () => {
    // Generador de ramas con información completa
    const ramaArbitrary = fc.record({
      id: fc.string({ minLength: 5, maxLength: 20 }).map(s => `test-${Date.now()}-${s}`),
      titulo: fc.string({ minLength: 5, maxLength: 50 }),
      descripcion: fc.string({ minLength: 20, maxLength: 500 }),
      icono: fc.constantFrom(
        'Code',
        'Network',
        'Shield',
        'Database',
        'Cpu',
        'Brain'
      ),
      tecnologias: fc.array(fc.string({ minLength: 2, maxLength: 30 }), { minLength: 1, maxLength: 10 }),
      aplicaciones: fc.array(fc.string({ minLength: 5, maxLength: 100 }), { minLength: 1, maxLength: 10 }),
      imagenes: fc.array(fc.webUrl(), { minLength: 1, maxLength: 10 })
    });

    await fc.assert(
      fc.asyncProperty(
        ramaArbitrary,
        async (ramaData) => {
          // Crear la rama en la base de datos
          const rama = await Rama.create({
            id: ramaData.id,
            titulo: ramaData.titulo,
            descripcion: ramaData.descripcion,
            icono: ramaData.icono,
            tecnologias: ramaData.tecnologias,
            aplicaciones: ramaData.aplicaciones,
            imagenes: ramaData.imagenes
          });

          // Obtener la rama desde el endpoint
          const response = await axios.get(`${API_URL}/api/ramas/${rama.id}`);

          // Verificar que la respuesta incluye todos los campos requeridos
          expect(response.status).toBe(200);
          expect(response.data).toBeDefined();
          
          // Verificar nombre (titulo)
          expect(response.data.titulo).toBeDefined();
          expect(response.data.titulo).toBe(ramaData.titulo);
          expect(response.data.titulo.length).toBeGreaterThan(0);
          
          // Verificar descripción
          expect(response.data.descripcion).toBeDefined();
          expect(response.data.descripcion).toBe(ramaData.descripcion);
          expect(response.data.descripcion.length).toBeGreaterThan(0);
          
          // Verificar al menos un elemento visual (icono o imagen)
          const tieneIcono = response.data.icono && response.data.icono.length > 0;
          const tieneImagenes = response.data.imagenes && 
                                Array.isArray(response.data.imagenes) && 
                                response.data.imagenes.length > 0;
          
          expect(tieneIcono || tieneImagenes).toBe(true);
          
          // Si tiene icono, verificar que es válido
          if (tieneIcono) {
            expect(response.data.icono).toBe(ramaData.icono);
          }
          
          // Si tiene imágenes, verificar que es un array válido
          if (tieneImagenes) {
            expect(Array.isArray(response.data.imagenes)).toBe(true);
            expect(response.data.imagenes.length).toBeGreaterThan(0);
            expect(response.data.imagenes).toEqual(ramaData.imagenes);
          }

          // Limpiar: eliminar la rama creada
          await rama.destroy();
        }
      ),
      { numRuns: 50 }
    );
  }, 60000);

  /**
   * Test adicional: Verificar que todas las ramas retornadas tienen información completa
   * 
   * NOTE: This test requires HTTP server running - skipped in unit test mode
   */
  it.skip('Property 8 (variante): Todas las ramas del endpoint GET /api/ramas tienen información completa', async () => {
    // Crear múltiples ramas de prueba
    const ramasArbitrary = fc.array(
      fc.record({
        id: fc.string({ minLength: 5, maxLength: 20 }).map(s => `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${s}`),
        titulo: fc.string({ minLength: 5, maxLength: 50 }),
        descripcion: fc.string({ minLength: 20, maxLength: 500 }),
        icono: fc.constantFrom(
          'Code',
          'Network',
          'Shield',
          'Database',
          'Cpu',
          'Brain'
        ),
        tecnologias: fc.array(fc.string({ minLength: 2, maxLength: 30 }), { minLength: 1, maxLength: 5 }),
        aplicaciones: fc.array(fc.string({ minLength: 5, maxLength: 100 }), { minLength: 1, maxLength: 5 }),
        imagenes: fc.array(fc.webUrl(), { minLength: 1, maxLength: 5 })
      }),
      { minLength: 1, maxLength: 6 }
    );

    await fc.assert(
      fc.asyncProperty(
        ramasArbitrary,
        async (ramasData) => {
          // Crear las ramas en la base de datos
          const ramasCreadas = await Promise.all(
            ramasData.map(ramaData =>
              Rama.create({
                id: ramaData.id,
                titulo: ramaData.titulo,
                descripcion: ramaData.descripcion,
                icono: ramaData.icono,
                tecnologias: ramaData.tecnologias,
                aplicaciones: ramaData.aplicaciones,
                imagenes: ramaData.imagenes
              })
            )
          );

          // Obtener todas las ramas desde el endpoint
          const response = await axios.get(`${API_URL}/api/ramas`);

          expect(response.status).toBe(200);
          expect(Array.isArray(response.data)).toBe(true);
          expect(response.data.length).toBeGreaterThanOrEqual(ramasData.length);

          // Verificar que cada rama tiene información completa
          response.data.forEach((rama: any) => {
            // Verificar nombre
            expect(rama.titulo).toBeDefined();
            expect(typeof rama.titulo).toBe('string');
            expect(rama.titulo.length).toBeGreaterThan(0);
            
            // Verificar descripción
            expect(rama.descripcion).toBeDefined();
            expect(typeof rama.descripcion).toBe('string');
            expect(rama.descripcion.length).toBeGreaterThan(0);
            
            // Verificar al menos un elemento visual
            const tieneIcono = rama.icono && rama.icono.length > 0;
            const tieneImagenes = rama.imagenes && 
                                  Array.isArray(rama.imagenes) && 
                                  rama.imagenes.length > 0;
            
            expect(tieneIcono || tieneImagenes).toBe(true);
          });

          // Limpiar: eliminar las ramas creadas
          await Promise.all(ramasCreadas.map(rama => rama.destroy()));
        }
      ),
      { numRuns: 30 }
    );
  });
});
