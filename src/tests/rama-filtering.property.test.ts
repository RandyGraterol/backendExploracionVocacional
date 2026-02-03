/**
 * Property-Based Tests: Filtrado por Rama Vocacional
 * Feature: mejoras-exploracion-vocacional
 * 
 * Estos tests verifican las propiedades universales del sistema de filtrado por rama:
 * - Property 9: Persistencia de rama recomendada
 * - Property 10: Filtrado de actividades por rama
 * - Property 11: Validación de rama requerida
 * - Property 12: Soporte de múltiples ramas
 * - Property 22: Persistencia de asociaciones actividad-rama
 * - Property 23: Modificación de asociaciones de ramas
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { sequelize, Actividad, Usuario, ResultadoTest } from '../models';
import { QueryTypes } from 'sequelize';

describe('🧪 Property-Based Tests: Filtrado por Rama Vocacional', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
    console.log('✅ Setup completado: Base de datos sincronizada');
  });

  beforeEach(async () => {
    // Limpiar datos entre tests
    await Actividad.destroy({ where: {}, truncate: true });
    await ResultadoTest.destroy({ where: {}, truncate: true });
  });

  afterAll(async () => {
    console.log('🧹 Limpiando datos de prueba...');
    await Actividad.destroy({ where: {}, truncate: true });
    await ResultadoTest.destroy({ where: {}, truncate: true });
    await Usuario.destroy({ where: {}, truncate: true });
    console.log('✅ Limpieza completada');
  });

  /**
   * Property 11: Validación de rama requerida
   * **Validates: Requirements 4.4**
   * 
   * Para cualquier intento de crear una actividad sin al menos una rama asociada, 
   * el sistema debe rechazar la operación con un error de validación.
   */
  it('Property 11: Validación de rama requerida', async () => {
    const actividadSinRamaArbitrary = fc.record({
      title: fc.string({ minLength: 3, maxLength: 50 }),
      description: fc.string({ minLength: 10, maxLength: 200 }),
      tipo: fc.constantFrom('Quiz', 'Ordenamiento', 'Simulación', 'Práctica', 'Desafío'),
      dificultad: fc.constantFrom('facil', 'medio', 'dificil'),
      preguntas: fc.constant([
        {
          id: 'q1',
          pregunta: '¿Pregunta de prueba?',
          opciones: ['A', 'B', 'C'],
          correcta: 0
        }
      ])
    });

    await fc.assert(
      fc.asyncProperty(
        actividadSinRamaArbitrary,
        async (actividadData) => {
          const id = `test-no-rama-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          // Intentar crear actividad sin rama (array vacío)
          let errorOccurred = false;
          try {
            await Actividad.create({
              id,
              ...actividadData,
              rama: [], // Array vacío - debe fallar
              icono: '📚'
            });
          } catch (error: any) {
            errorOccurred = true;
            // Verificar que el error es de validación
            expect(error.name).toBe('SequelizeValidationError');
            expect(error.message).toContain('Debe asociar al menos una rama');
          }
          
          // Verificar que se lanzó el error
          expect(errorOccurred).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  }, 60000);

  /**
   * Property 12: Soporte de múltiples ramas
   * **Validates: Requirements 4.5**
   * 
   * Para cualquier actividad, el sistema debe permitir asociarla con un array 
   * de múltiples ramas vocacionales, y todas las ramas deben persistirse correctamente.
   */
  it('Property 12: Soporte de múltiples ramas', async () => {
    const ramasDisponibles = [
      'desarrollo-software',
      'redes',
      'ciberseguridad',
      'bases-datos',
      'robotica',
      'inteligencia-artificial'
    ];

    const ramasArrayArbitrary = fc.array(
      fc.constantFrom(...ramasDisponibles),
      { minLength: 1, maxLength: 6 }
    ).map(ramas => [...new Set(ramas)]); // Eliminar duplicados

    const actividadArbitrary = fc.record({
      title: fc.string({ minLength: 3, maxLength: 50 }),
      description: fc.string({ minLength: 10, maxLength: 200 }),
      tipo: fc.constantFrom('Quiz', 'Ordenamiento'),
      dificultad: fc.constantFrom('facil', 'medio', 'dificil'),
      preguntas: fc.constant([
        {
          id: 'q1',
          pregunta: '¿Pregunta de prueba?',
          opciones: ['A', 'B'],
          correcta: 0
        }
      ])
    });

    await fc.assert(
      fc.asyncProperty(
        actividadArbitrary,
        ramasArrayArbitrary,
        async (actividadData, ramas) => {
          const id = `test-multi-rama-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          // Crear actividad con múltiples ramas
          const actividad = await Actividad.create({
            id,
            ...actividadData,
            rama: ramas,
            icono: '📚'
          });

          // Recuperar la actividad
          const actividadRecuperada = await Actividad.findByPk(id);
          
          // Verificar que todas las ramas se persistieron correctamente
          expect(actividadRecuperada).toBeDefined();
          expect(actividadRecuperada!.rama).toEqual(ramas);
          expect(actividadRecuperada!.rama.length).toBe(ramas.length);
          
          // Verificar que cada rama está presente
          ramas.forEach(rama => {
            expect(actividadRecuperada!.rama).toContain(rama);
          });

          // Limpiar
          await actividad.destroy();
        }
      ),
      { numRuns: 100 }
    );
  }, 60000);

  /**
   * Property 22: Persistencia de asociaciones actividad-rama
   * **Validates: Requirements 7.2**
   * 
   * Para cualquier actividad con ramas asociadas, cuando se almacena y luego 
   * se recupera, el array de ramas debe ser idéntico (round-trip property).
   */
  it('Property 22: Persistencia de asociaciones actividad-rama', async () => {
    const ramasDisponibles = [
      'desarrollo-software',
      'redes',
      'ciberseguridad',
      'bases-datos',
      'robotica',
      'inteligencia-artificial'
    ];

    const ramasArrayArbitrary = fc.array(
      fc.constantFrom(...ramasDisponibles),
      { minLength: 1, maxLength: 4 }
    ).map(ramas => [...new Set(ramas)]);

    await fc.assert(
      fc.asyncProperty(
        ramasArrayArbitrary,
        fc.string({ minLength: 3, maxLength: 50 }),
        async (ramas, title) => {
          const id = `test-persist-rama-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          // Crear actividad
          const actividad = await Actividad.create({
            id,
            title,
            description: 'Test persistencia de ramas',
            rama: ramas,
            tipo: 'Quiz',
            dificultad: 'medio',
            icono: '📚',
            preguntas: [
              {
                id: 'q1',
                pregunta: 'Test?',
                opciones: ['A', 'B'],
                correcta: 0
              }
            ]
          });

          // Recuperar la actividad
          const actividadRecuperada = await Actividad.findByPk(id);
          
          // Verificar round-trip exacto
          expect(actividadRecuperada).toBeDefined();
          expect(actividadRecuperada!.rama).toEqual(ramas);
          
          // Verificar orden y contenido
          expect(actividadRecuperada!.rama.length).toBe(ramas.length);
          ramas.forEach((rama, index) => {
            expect(actividadRecuperada!.rama[index]).toBe(rama);
          });

          // Limpiar
          await actividad.destroy();
        }
      ),
      { numRuns: 100 }
    );
  }, 60000);

  /**
   * Property 23: Modificación de asociaciones de ramas
   * **Validates: Requirements 7.4**
   * 
   * Para cualquier actividad existente, el sistema debe permitir actualizar 
   * su array de ramas asociadas, y la actualización debe persistirse correctamente.
   */
  it('Property 23: Modificación de asociaciones de ramas', async () => {
    const ramasDisponibles = [
      'desarrollo-software',
      'redes',
      'ciberseguridad',
      'bases-datos',
      'robotica',
      'inteligencia-artificial'
    ];

    const ramasArrayArbitrary = fc.array(
      fc.constantFrom(...ramasDisponibles),
      { minLength: 1, maxLength: 3 }
    ).map(ramas => [...new Set(ramas)]);

    await fc.assert(
      fc.asyncProperty(
        ramasArrayArbitrary,
        ramasArrayArbitrary,
        fc.string({ minLength: 3, maxLength: 50 }),
        async (ramasIniciales, ramasNuevas, title) => {
          // Asegurar que los arrays sean diferentes
          if (JSON.stringify(ramasIniciales) === JSON.stringify(ramasNuevas)) {
            // Modificar ramasNuevas para que sea diferente
            ramasNuevas = ramasNuevas.length > 1 
              ? ramasNuevas.slice(0, -1) 
              : [...ramasNuevas, ramasDisponibles.find(r => !ramasNuevas.includes(r))!];
          }

          const id = `test-update-rama-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          // Crear actividad con ramas iniciales
          const actividad = await Actividad.create({
            id,
            title,
            description: 'Test actualización de ramas',
            rama: ramasIniciales,
            tipo: 'Quiz',
            dificultad: 'medio',
            icono: '📚',
            preguntas: [
              {
                id: 'q1',
                pregunta: 'Test?',
                opciones: ['A', 'B'],
                correcta: 0
              }
            ]
          });

          // Verificar ramas iniciales
          expect(actividad.rama).toEqual(ramasIniciales);

          // Actualizar ramas
          await actividad.update({ rama: ramasNuevas });

          // Recuperar la actividad actualizada
          const actividadActualizada = await Actividad.findByPk(id);
          
          // Verificar que las ramas se actualizaron correctamente
          expect(actividadActualizada).toBeDefined();
          expect(actividadActualizada!.rama).toEqual(ramasNuevas);
          expect(actividadActualizada!.rama).not.toEqual(ramasIniciales);

          // Limpiar
          await actividad.destroy();
        }
      ),
      { numRuns: 100 }
    );
  }, 60000);

  /**
   * Property 9: Persistencia de rama recomendada
   * **Validates: Requirements 4.1**
   * 
   * Para cualquier estudiante que completa el test vocacional, cuando se almacena 
   * el resultado, recuperar el resultado más reciente de ese estudiante debe 
   * retornar la misma rama recomendada (round-trip property).
   */
  it('Property 9: Persistencia de rama recomendada', async () => {
    const ramasDisponibles = [
      'desarrollo-software',
      'redes',
      'ciberseguridad',
      'bases-datos',
      'robotica',
      'inteligencia-artificial'
    ];

    const resultadoTestArbitrary = fc.record({
      ramaRecomendada: fc.constantFrom(...ramasDisponibles),
      puntuaciones: fc.dictionary(
        fc.constantFrom(...ramasDisponibles),
        fc.integer({ min: 0, max: 100 })
      ),
      respuestas: fc.array(
        fc.record({
          preguntaId: fc.integer({ min: 1, max: 20 }),
          respuesta: fc.integer({ min: 0, max: 3 })
        }),
        { minLength: 5, maxLength: 20 }
      )
    });

    await fc.assert(
      fc.asyncProperty(
        resultadoTestArbitrary,
        async (resultadoData) => {
          // Crear usuario de prueba
          const userId = Math.floor(Math.random() * 1000000);
          const usuario = await Usuario.create({
            nombre: 'Test',
            apellido: 'User',
            email: `test${userId}@test.com`,
            password: 'hashedpassword',
            rol: 'student',
            activo: true,
            estado: 'aprobado'
          });

          // Crear resultado del test
          const resultado = await ResultadoTest.create({
            userId: usuario.id,
            ...resultadoData,
            fecha: new Date()
          });

          // Recuperar el resultado más reciente del estudiante
          const resultadoRecuperado = await ResultadoTest.findOne({
            where: { userId: usuario.id },
            order: [['fecha', 'DESC']]
          });

          // Verificar round-trip
          expect(resultadoRecuperado).toBeDefined();
          expect(resultadoRecuperado!.ramaRecomendada).toBe(resultadoData.ramaRecomendada);
          expect(resultadoRecuperado!.puntuaciones).toEqual(resultadoData.puntuaciones);

          // Limpiar
          await resultado.destroy();
          await usuario.destroy();
        }
      ),
      { numRuns: 100 }
    );
  }, 60000);

  /**
   * Property 10: Filtrado de actividades por rama
   * **Validates: Requirements 4.2**
   * 
   * Para cualquier estudiante con rama vocacional asignada, cuando accede a la 
   * lista de actividades, todas las actividades retornadas deben incluir la rama 
   * del estudiante en su array de ramas asociadas.
   */
  it('Property 10: Filtrado de actividades por rama', async () => {
    const ramasDisponibles = [
      'desarrollo-software',
      'redes',
      'ciberseguridad',
      'bases-datos',
      'robotica',
      'inteligencia-artificial'
    ];

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...ramasDisponibles),
        fc.array(
          fc.record({
            title: fc.string({ minLength: 3, maxLength: 30 }),
            ramas: fc.array(
              fc.constantFrom(...ramasDisponibles),
              { minLength: 1, maxLength: 3 }
            ).map(r => [...new Set(r)])
          }),
          { minLength: 5, maxLength: 15 }
        ),
        async (ramaEstudiante, actividadesData) => {
          // Crear actividades
          const actividadesCreadas = [];
          for (const actData of actividadesData) {
            const id = `test-filter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const actividad = await Actividad.create({
              id,
              title: actData.title,
              description: 'Test filtrado',
              rama: actData.ramas,
              tipo: 'Quiz',
              dificultad: 'medio',
              icono: '📚',
              preguntas: [
                {
                  id: 'q1',
                  pregunta: 'Test?',
                  opciones: ['A', 'B'],
                  correcta: 0
                }
              ]
            });
            actividadesCreadas.push(actividad);
          }

          // Filtrar actividades que incluyen la rama del estudiante
          // SQLite JSON: json_each para buscar en arrays
          const actividadesFiltradas = await sequelize.query(
            `SELECT * FROM actividades 
             WHERE EXISTS (
               SELECT 1 FROM json_each(rama) 
               WHERE json_each.value = :ramaEstudiante
             )`,
            {
              replacements: { ramaEstudiante },
              type: QueryTypes.SELECT,
              model: Actividad,
              mapToModel: true
            }
          ) as Actividad[];

          // Verificar que todas las actividades retornadas incluyen la rama del estudiante
          actividadesFiltradas.forEach(actividad => {
            expect(actividad.rama).toContain(ramaEstudiante);
          });

          // Verificar que no se retornaron actividades que no incluyen la rama
          const actividadesEsperadas = actividadesCreadas.filter(a => 
            a.rama.includes(ramaEstudiante)
          );
          expect(actividadesFiltradas.length).toBe(actividadesEsperadas.length);

          // Limpiar
          for (const actividad of actividadesCreadas) {
            await actividad.destroy();
          }
        }
      ),
      { numRuns: 50 } // Menos iteraciones porque crea muchas actividades
    );
  }, 120000); // Timeout más largo
});
