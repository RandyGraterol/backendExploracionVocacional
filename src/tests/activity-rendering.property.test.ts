/**
 * Property-Based Test: Renderizado por Tipo de Actividad
 * Feature: mejoras-exploracion-vocacional
 * 
 * Este test verifica la propiedad universal:
 * - Property 7: Renderizado correcto por tipo de actividad
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { sequelize, Actividad } from '../models';

describe('🧪 Property-Based Test: Renderizado por Tipo de Actividad', () => {
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
   * Property 7: Renderizado correcto por tipo de actividad
   * **Validates: Requirements 2.7**
   * 
   * Para cualquier actividad, cuando un estudiante accede a ella, el componente 
   * renderizado debe corresponder al tipo de actividad. Esto se verifica asegurando
   * que cada actividad tiene el contenido apropiado para su tipo, lo cual determina
   * qué componente se renderizará en el frontend.
   * 
   * Mapeo tipo -> contenido requerido -> componente:
   * - Quiz -> preguntas[] -> QuizActivity
   * - Simulación -> simulacion{} -> SimulacionActivity
   * - Ordenamiento -> itemsOrden[] -> OrdenActivity
   * - Práctica -> ejercicioCodigo{} -> PracticaActivity
   * - Desafío -> paresDesafio[] -> DesafioActivity
   */
  it('Property 7: Renderizado correcto por tipo de actividad', async () => {
    // Generador de actividades con contenido apropiado según tipo
    const actividadConContenidoArbitrary = fc.oneof(
      // Quiz: debe tener preguntas
      fc.record({
        tipo: fc.constant('Quiz'),
        title: fc.string({ minLength: 3, maxLength: 50 }),
        description: fc.string({ minLength: 10, maxLength: 200 }),
        rama: fc.constantFrom('desarrollo', 'redes', 'ciberseguridad', 'bases-datos', 'robotica', 'ia').map(r => [r]),
        dificultad: fc.constantFrom('facil', 'medio', 'dificil'),
        preguntas: fc.array(
          fc.record({
            id: fc.string({ minLength: 2, maxLength: 10 }),
            pregunta: fc.string({ minLength: 10, maxLength: 100 }),
            opciones: fc.array(fc.string({ minLength: 3, maxLength: 50 }), { minLength: 2, maxLength: 5 }),
            correcta: fc.integer({ min: 0, max: 4 })
          }),
          { minLength: 1, maxLength: 10 }
        )
      }),

      // Simulación: debe tener simulacion
      fc.record({
        tipo: fc.constant('Simulación'),
        title: fc.string({ minLength: 3, maxLength: 50 }),
        description: fc.string({ minLength: 10, maxLength: 200 }),
        rama: fc.constantFrom('desarrollo', 'redes', 'ciberseguridad', 'bases-datos', 'robotica', 'ia').map(r => [r]),
        dificultad: fc.constantFrom('facil', 'medio', 'dificil'),
        simulacion: fc.record({
          tipo: fc.constantFrom('red', 'algoritmo', 'sistema'),
          dispositivos: fc.array(
            fc.record({
              id: fc.string({ minLength: 2, maxLength: 10 }),
              nombre: fc.string({ minLength: 3, maxLength: 30 }),
              tipo: fc.constantFrom('computadora', 'servidor', 'switch', 'router')
            }),
            { minLength: 1, maxLength: 8 }
          ),
          conexionesCorrectas: fc.array(
            fc.record({
              dispositivo1: fc.string({ minLength: 2, maxLength: 10 }),
              dispositivo2: fc.string({ minLength: 2, maxLength: 10 })
            }),
            { minLength: 0, maxLength: 10 }
          ),
          objetivos: fc.array(fc.string({ minLength: 10, maxLength: 100 }), { minLength: 1, maxLength: 5 })
        })
      }),

      // Ordenamiento: debe tener itemsOrden
      fc.record({
        tipo: fc.constant('Ordenamiento'),
        title: fc.string({ minLength: 3, maxLength: 50 }),
        description: fc.string({ minLength: 10, maxLength: 200 }),
        rama: fc.constantFrom('desarrollo', 'redes', 'ciberseguridad', 'bases-datos', 'robotica', 'ia').map(r => [r]),
        dificultad: fc.constantFrom('facil', 'medio', 'dificil'),
        itemsOrden: fc.array(
          fc.record({
            id: fc.string({ minLength: 2, maxLength: 10 }),
            texto: fc.string({ minLength: 5, maxLength: 100 }),
            ordenCorrecto: fc.integer({ min: 0, max: 20 })
          }),
          { minLength: 2, maxLength: 10 }
        )
      }),

      // Práctica: debe tener ejercicioCodigo
      fc.record({
        tipo: fc.constant('Práctica'),
        title: fc.string({ minLength: 3, maxLength: 50 }),
        description: fc.string({ minLength: 10, maxLength: 200 }),
        rama: fc.constantFrom('desarrollo', 'redes', 'ciberseguridad', 'bases-datos', 'robotica', 'ia').map(r => [r]),
        dificultad: fc.constantFrom('facil', 'medio', 'dificil'),
        ejercicioCodigo: fc.record({
          enunciado: fc.string({ minLength: 10, maxLength: 200 }),
          lenguaje: fc.constantFrom('javascript', 'python', 'java', 'c++', 'typescript'),
          plantillaCodigo: fc.string({ minLength: 10, maxLength: 200 }),
          pruebasUnitarias: fc.array(
            fc.record({
              id: fc.string({ minLength: 2, maxLength: 10 }),
              descripcion: fc.string({ minLength: 10, maxLength: 100 }),
              entrada: fc.string({ minLength: 1, maxLength: 50 }),
              salidaEsperada: fc.string({ minLength: 1, maxLength: 50 })
            }),
            { minLength: 1, maxLength: 5 }
          ),
          solucionEjemplo: fc.option(fc.string({ minLength: 10, maxLength: 200 }), { nil: null })
        })
      }),

      // Desafío: debe tener paresDesafio
      fc.record({
        tipo: fc.constant('Desafío'),
        title: fc.string({ minLength: 3, maxLength: 50 }),
        description: fc.string({ minLength: 10, maxLength: 200 }),
        rama: fc.constantFrom('desarrollo', 'redes', 'ciberseguridad', 'bases-datos', 'robotica', 'ia').map(r => [r]),
        dificultad: fc.constantFrom('facil', 'medio', 'dificil'),
        paresDesafio: fc.array(
          fc.record({
            id: fc.string({ minLength: 2, maxLength: 10 }),
            concepto: fc.string({ minLength: 5, maxLength: 50 }),
            definicion: fc.string({ minLength: 10, maxLength: 150 })
          }),
          { minLength: 2, maxLength: 10 }
        )
      })
    );

    await fc.assert(
      fc.asyncProperty(
        actividadConContenidoArbitrary,
        async (actividadData) => {
          const id = `test-render-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          // Crear actividad con contenido apropiado para su tipo
          const actividad = await Actividad.create({
            id,
            ...actividadData,
            icono: '📚'
          });

          // Recuperar la actividad
          const actividadRecuperada = await Actividad.findByPk(id);
          expect(actividadRecuperada).toBeDefined();

          // Verificar que el contenido apropiado existe según el tipo
          // Esto garantiza que el frontend podrá renderizar el componente correcto
          switch (actividadData.tipo) {
            case 'Quiz':
              expect(actividadRecuperada!.preguntas).toBeDefined();
              expect(Array.isArray(actividadRecuperada!.preguntas)).toBe(true);
              expect(actividadRecuperada!.preguntas!.length).toBeGreaterThan(0);
              // Verificar estructura de preguntas
              actividadRecuperada!.preguntas!.forEach((pregunta: any) => {
                expect(pregunta).toHaveProperty('pregunta');
                expect(pregunta).toHaveProperty('opciones');
                expect(pregunta).toHaveProperty('correcta');
                expect(Array.isArray(pregunta.opciones)).toBe(true);
                expect(pregunta.opciones.length).toBeGreaterThan(0);
              });
              break;

            case 'Simulación':
              expect(actividadRecuperada!.simulacion).toBeDefined();
              expect(typeof actividadRecuperada!.simulacion).toBe('object');
              expect(actividadRecuperada!.simulacion).toHaveProperty('tipo');
              expect(actividadRecuperada!.simulacion).toHaveProperty('dispositivos');
              expect(actividadRecuperada!.simulacion).toHaveProperty('objetivos');
              expect(Array.isArray(actividadRecuperada!.simulacion.dispositivos)).toBe(true);
              expect(actividadRecuperada!.simulacion.dispositivos.length).toBeGreaterThan(0);
              break;

            case 'Ordenamiento':
              expect(actividadRecuperada!.itemsOrden).toBeDefined();
              expect(Array.isArray(actividadRecuperada!.itemsOrden)).toBe(true);
              expect(actividadRecuperada!.itemsOrden!.length).toBeGreaterThanOrEqual(2);
              // Verificar estructura de items
              actividadRecuperada!.itemsOrden!.forEach((item: any) => {
                expect(item).toHaveProperty('id');
                expect(item).toHaveProperty('texto');
                expect(item).toHaveProperty('ordenCorrecto');
              });
              break;

            case 'Práctica':
              expect(actividadRecuperada!.ejercicioCodigo).toBeDefined();
              expect(typeof actividadRecuperada!.ejercicioCodigo).toBe('object');
              expect(actividadRecuperada!.ejercicioCodigo).toHaveProperty('enunciado');
              expect(actividadRecuperada!.ejercicioCodigo).toHaveProperty('lenguaje');
              expect(actividadRecuperada!.ejercicioCodigo).toHaveProperty('plantillaCodigo');
              expect(actividadRecuperada!.ejercicioCodigo).toHaveProperty('pruebasUnitarias');
              expect(Array.isArray(actividadRecuperada!.ejercicioCodigo.pruebasUnitarias)).toBe(true);
              expect(actividadRecuperada!.ejercicioCodigo.pruebasUnitarias.length).toBeGreaterThan(0);
              break;

            case 'Desafío':
              expect(actividadRecuperada!.paresDesafio).toBeDefined();
              expect(Array.isArray(actividadRecuperada!.paresDesafio)).toBe(true);
              expect(actividadRecuperada!.paresDesafio!.length).toBeGreaterThanOrEqual(2);
              // Verificar estructura de pares
              actividadRecuperada!.paresDesafio!.forEach((par: any) => {
                expect(par).toHaveProperty('concepto');
                expect(par).toHaveProperty('definicion');
              });
              break;

            default:
              throw new Error(`Tipo de actividad no reconocido: ${(actividadData as any).tipo}`);
          }

          // Limpiar
          await actividad.destroy();
        }
      ),
      { numRuns: 100 } // 100 iteraciones para cubrir todos los tipos múltiples veces
    );
  }, 60000); // Timeout de 60 segundos
});
