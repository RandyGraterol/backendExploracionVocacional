/**
 * Script to apply performance indexes to the database
 * Run with: npx ts-node src/scripts/apply-indexes.ts
 */

import sequelize from '../config/database';

async function applyIndexes() {
  try {
    console.log('Applying performance indexes...');

    // ProgresoActividad: Composite index for duplicate checking and progress lookup
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_progreso_user_actividad 
      ON progreso_actividades(userId, actividadId)
    `);
    console.log('✓ Created index: idx_progreso_user_actividad');

    // ProgresoActividad: Index for user progress history
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_progreso_user 
      ON progreso_actividades(userId)
    `);
    console.log('✓ Created index: idx_progreso_user');

    // ResultadoTest: Index for getting student's recommended rama
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_resultado_user 
      ON resultados_test(userId)
    `);
    console.log('✓ Created index: idx_resultado_user');

    // Video: Index for filtering videos by rama
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_video_rama 
      ON videos(rama)
    `);
    console.log('✓ Created index: idx_video_rama');

    // Verify indexes were created
    const [indexes] = await sequelize.query(`
      SELECT name, tbl_name, sql 
      FROM sqlite_master 
      WHERE type = 'index' 
      AND name LIKE 'idx_%'
      ORDER BY tbl_name, name
    `);

    console.log('\nCreated indexes:');
    console.table(indexes);

    console.log('\n✅ All performance indexes applied successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error applying indexes:', error);
    process.exit(1);
  }
}

applyIndexes();
