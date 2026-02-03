/**
 * Property-Based Tests: Múltiples Tipos de Actividades
 * Feature: mejoras-exploracion-vocacional
 * 
 * Estos tests verifican las propiedades universales del sistema de múltiples tipos de actividades:
 * - Property 3: Selección de tipo de actividad
 * - Property 4: Persistencia de configuración de simulación
 * - Property 5: Persistencia de configuración de ordenamiento
 * - Property 6: Persistencia de configuración de práctica
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { sequelize, Actividad } from '../models';

describe('🧪 Property-Based Tests: Múltiples Tipos de Actividades', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
    console.log('✅ Setup completado: Base de datos sincronizada');
  });

  afterAll(async () => {
    console.log('🧹 Limpiando actividades de prueba...');
    await Actividad.destroy({ where: {}, truncate: true });
    console.log('✅ Limpieza completada');
  });

  /**
   * Property 3: Selección de tipo de actividad
   * **Validates: Requirements 2.2**
   * 
   * Para cualquier administrador y cualquier tipo de actividad válido 
   * (quiz, simulación, ordenamiento, práctica, desafío), el sistema debe 
   * permitir crear una actividad de ese tipo.
   */
  it('Property 3: Selección de tipo de actividad', async () => {
    // Generador de tipos de actividad válidos
    const tipoActividadArbitrary = fc.constantFrom(
      'quiz',
      'Quiz',
      'simulacion',
      'Simulación',
      'ordenamiento',
      'Ordenamiento',
      'practica',
      'Práctica',
      'desafio',
      'Desafío'
    );

    // Generador de datos de actividad según tipo
    const actividadArbitrary = fc.tuple(
      tipoActividadArbitrary,
      fc.string({ minLength: 3, maxLength: 50 }),
      fc.string({ minLength: 10, maxLength: 200 }),
      fc.constantFrom('desarrollo', 'redes', 'ciberseguridad', 'bases-datos', 'robotica', 'ia').map(r => [r]),
      fc.constantFrom('facil', 'medio', 'dificil')
    ).chain(([tipo, title, description, rama, dificultad]) => {
      // Generar contenido apropiado según el tipo
      let contenido: any = {};
      
      const tipoNormalizado = tipo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      
      switch(tipoNormalizado) {
        case 'quiz':
          contenido = {
            preguntas: [
              {
                id: 'q1',
                pregunta: '¿Pregunta de prueba?',
                opciones: ['Opción 1', 'Opción 2', 'Opción 3'],
                correcta: 0
              }
            ]
          };
          break;
        case 'simulacion':
          contenido = {
            simulacion: {
              tipo: 'red',
              configuracionInicial: { dispositivos: [] },
              objetivos: ['Objetivo 1'],
              validaciones: []
            }
          };
          break;
        case 'ordenamiento':
          contenido = {
            itemsOrden: [
              { id: 'item1', texto: 'Paso 1', ordenCorrecto: 1 },
              { id: 'item2', texto: 'Paso 2', ordenCorrecto: 2 }
            ]
          };
          break;
        case 'practica':
          contenido = {
            ejercicioCodigo: {
              lenguaje: 'javascript',
              plantilla: 'function test() {}',
              tests: []
            }
          };
          break;
        case 'desafio':
          contenido = {
            paresDesafio: [
              { id: 'par1', concepto: 'Concepto 1', definicion: 'Definición 1' }
            ]
          };
          break;
      }

      return fc.constant({
        tipo,
        title,
        description,
        rama,
        dificultad,
        ...contenido
      });
    });

    await fc.assert(
      fc.asyncProperty(
        actividadArbitrary,
        async (actividadData) => {
          // Generar ID único
          const id = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          // Intentar crear la actividad
          const actividad = await Actividad.create({
            id,
            ...actividadData,
            icono: '📚'
          });

          // Verificar que se creó correctamente
          expect(actividad).toBeDefined();
          expect(actividad.id).toBe(id);
          expect(actividad.tipo).toBe(actividadData.tipo);

          // Limpiar
          await actividad.destroy();
        }
      ),
      { numRuns: 50 } // 50 iteraciones para cubrir todos los tipos múltiples veces
    );
  }, 60000); // Timeout de 60 segundos

  /**
   * Property 4: Persistencia de configuración de simulación
   * **Validates: Requirements 2.3**
   * 
   * Para cualquier configuración de simulación válida, cuando se crea una 
   * actividad tipo simulación, recuperar esa actividad debe retornar la 
   * misma configuración de simulación (round-trip property).
   */
  it('Property 4: Persistencia de configuración de simulación', async () => {
    const simulacionArbitrary = fc.record({
      tipo: fc.constantFrom('red', 'algoritmo', 'sistema'),
      configuracionInicial: fc.record({
        dispositivos: fc.array(fc.string({ minLength: 1 }), { minLength: 0, maxLength: 5 }),
        parametros: fc.dictionary(
          fc.string({ minLength: 1 }), 
          fc.oneof(fc.string(), fc.integer(), fc.boolean(), fc.constant(null))
        )
      }),
      objetivos: fc.array(fc.string({ minLength: 5, maxLength: 50 }), { minLength: 1, maxLength: 5 }),
      validaciones: fc.array(
        fc.oneof(fc.string(), fc.integer(), fc.record({ tipo: fc.string(), valor: fc.anything() })),
        { minLength: 0, maxLength: 3 }
      )
    });

    await fc.assert(
      fc.asyncProperty(
        simulacionArbitrary,
        fc.string({ minLength: 3, maxLength: 50 }),
        async (simulacion, title) => {
          const id = `test-sim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          // Crear actividad con simulación
          const actividad = await Actividad.create({
            id,
            title,
            description: 'Test simulación',
            rama: ['redes'],
            tipo: 'Simulación',
            dificultad: 'medio',
            icono: '🌐',
            simulacion
          });

          // Recuperar la actividad
          const actividadRecuperada = await Actividad.findByPk(id);
          
          // Verificar round-trip
          // Nota: JSON convierte undefined a null, así que normalizamos antes de comparar
          const simulacionNormalizada = JSON.parse(JSON.stringify(simulacion));
          
          expect(actividadRecuperada).toBeDefined();
          expect(actividadRecuperada!.simulacion).toEqual(simulacionNormalizada);

          // Limpiar
          await actividad.destroy();
        }
      ),
      { numRuns: 100 }
    );
  }, 60000);

  /**
   * Property 5: Persistencia de configuración de ordenamiento
   * **Validates: Requirements 2.4**
   * 
   * Para cualquier configuración de ordenamiento válida, cuando se crea una 
   * actividad tipo ordenamiento, recuperar esa actividad debe retornar la 
   * misma configuración de ordenamiento (round-trip property).
   */
  it('Property 5: Persistencia de configuración de ordenamiento', async () => {
    const itemOrdenArbitrary = fc.record({
      id: fc.string({ minLength: 3, maxLength: 20 }),
      texto: fc.string({ minLength: 5, maxLength: 100 }),
      ordenCorrecto: fc.integer({ min: 1, max: 10 })
    });

    const itemsOrdenArbitrary = fc.array(itemOrdenArbitrary, { minLength: 2, maxLength: 8 });

    await fc.assert(
      fc.asyncProperty(
        itemsOrdenArbitrary,
        fc.string({ minLength: 3, maxLength: 50 }),
        async (itemsOrden, title) => {
          const id = `test-orden-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          // Crear actividad con ordenamiento
          const actividad = await Actividad.create({
            id,
            title,
            description: 'Test ordenamiento',
            rama: ['desarrollo'],
            tipo: 'Ordenamiento',
            dificultad: 'medio',
            icono: '📋',
            itemsOrden
          });

          // Recuperar la actividad
          const actividadRecuperada = await Actividad.findByPk(id);
          
          // Verificar round-trip
          expect(actividadRecuperada).toBeDefined();
          expect(actividadRecuperada!.itemsOrden).toEqual(itemsOrden);

          // Limpiar
          await actividad.destroy();
        }
      ),
      { numRuns: 100 }
    );
  }, 60000);

  /**
   * Property 6: Persistencia de configuración de práctica
   * **Validates: Requirements 2.5**
   * 
   * Para cualquier configuración de práctica válida, cuando se crea una 
   * actividad tipo práctica, recuperar esa actividad debe retornar la 
   * misma configuración de práctica (round-trip property).
   */
  it('Property 6: Persistencia de configuración de práctica', async () => {
    const testCaseArbitrary = fc.record({
      input: fc.oneof(fc.string(), fc.integer(), fc.boolean(), fc.constant(null), fc.array(fc.string())),
      expectedOutput: fc.oneof(fc.string(), fc.integer(), fc.boolean(), fc.constant(null)),
      descripcion: fc.string({ minLength: 5, maxLength: 100 })
    });

    const ejercicioCodigoArbitrary = fc.record({
      lenguaje: fc.constantFrom('javascript', 'python', 'java', 'c++', 'typescript'),
      plantilla: fc.string({ minLength: 10, maxLength: 200 }),
      tests: fc.array(testCaseArbitrary, { minLength: 1, maxLength: 5 }),
      solucion: fc.option(fc.string({ minLength: 10, maxLength: 200 }), { nil: null })
    });

    await fc.assert(
      fc.asyncProperty(
        ejercicioCodigoArbitrary,
        fc.string({ minLength: 3, maxLength: 50 }),
        async (ejercicioCodigo, title) => {
          const id = `test-practica-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          // Crear actividad con práctica
          const actividad = await Actividad.create({
            id,
            title,
            description: 'Test práctica',
            rama: ['desarrollo'],
            tipo: 'Práctica',
            dificultad: 'avanzado',
            icono: '💻',
            ejercicioCodigo
          });

          // Recuperar la actividad
          const actividadRecuperada = await Actividad.findByPk(id);
          
          // Verificar round-trip
          // Nota: JSON convierte undefined a null, así que normalizamos antes de comparar
          const ejercicioNormalizado = JSON.parse(JSON.stringify(ejercicioCodigo));
          
          expect(actividadRecuperada).toBeDefined();
          expect(actividadRecuperada!.ejercicioCodigo).toEqual(ejercicioNormalizado);

          // Limpiar
          await actividad.destroy();
        }
      ),
      { numRuns: 100 }
    );
  }, 60000);
});
