/**
 * Migración para convertir el campo 'rama' de STRING a JSON (array)
 * 
 * Esta migración convierte valores string existentes a arrays JSON
 * Ejemplo: "desarrollo-software" -> ["desarrollo-software"]
 * 
 * Requirements: 4.5, 7.1
 */

import sequelize from '../config/database';
import { QueryTypes } from 'sequelize';
import Actividad from '../models/Actividad';

export async function migrateRamaToArray(): Promise<void> {
  console.log('Iniciando migración de campo rama a array...');
  
  try {
    // Obtener todas las actividades
    const actividades = await sequelize.query<{ id: string; rama: any }>(
      'SELECT id, rama FROM actividades',
      { type: QueryTypes.SELECT }
    );
    
    console.log(`Encontradas ${actividades.length} actividades para migrar`);
    
    let migrated = 0;
    let skipped = 0;
    
    for (const actividad of actividades) {
      try {
        // Verificar si ya es un array (JSON)
        let ramaValue = actividad.rama;
        
        // Si es string, intentar parsearlo como JSON
        if (typeof ramaValue === 'string') {
          try {
            ramaValue = JSON.parse(ramaValue);
          } catch {
            // No es JSON válido, es un string simple
          }
        }
        
        // Si ya es un array, saltar
        if (Array.isArray(ramaValue)) {
          console.log(`  Actividad ${actividad.id}: Ya es array, saltando`);
          skipped++;
          continue;
        }
        
        // Convertir string a array
        const ramaArray = [ramaValue];
        
        // Actualizar en la base de datos
        await sequelize.query(
          'UPDATE actividades SET rama = ? WHERE id = ?',
          {
            replacements: [JSON.stringify(ramaArray), actividad.id],
            type: QueryTypes.UPDATE
          }
        );
        
        console.log(`  Actividad ${actividad.id}: "${ramaValue}" -> ${JSON.stringify(ramaArray)}`);
        migrated++;
        
      } catch (error) {
        console.error(`  Error migrando actividad ${actividad.id}:`, error);
      }
    }
    
    console.log(`\nMigración completada:`);
    console.log(`  - Migradas: ${migrated}`);
    console.log(`  - Saltadas: ${skipped}`);
    console.log(`  - Total: ${actividades.length}`);
    
  } catch (error) {
    console.error('Error durante la migración:', error);
    throw error;
  }
}

// Ejecutar migración si se llama directamente
if (require.main === module) {
  migrateRamaToArray()
    .then(() => {
      console.log('Migración exitosa');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migración fallida:', error);
      process.exit(1);
    });
}
