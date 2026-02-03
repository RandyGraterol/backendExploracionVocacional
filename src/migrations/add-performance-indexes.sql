-- Performance Optimization Indexes
-- Date: 2024-02-02
-- Purpose: Add indexes to improve query performance for frequently accessed data

-- ProgresoActividad: Composite index for duplicate checking and progress lookup
-- Used in: Checking if progress already exists, updating existing progress
CREATE INDEX IF NOT EXISTS idx_progreso_user_actividad 
ON progreso_actividades(userId, actividadId);

-- ProgresoActividad: Index for user progress history
-- Used in: Getting all progress for a user, ordered by date
CREATE INDEX IF NOT EXISTS idx_progreso_user 
ON progreso_actividades(userId);

-- ResultadoTest: Index for getting student's recommended rama
-- Used in: Filtering activities by student's recommended rama (very frequent query)
CREATE INDEX IF NOT EXISTS idx_resultado_user 
ON resultados_test(userId);

-- Video: Index for filtering videos by rama
-- Used in: Getting videos for student dashboard filtered by rama
CREATE INDEX IF NOT EXISTS idx_video_rama 
ON videos(rama);

-- Verify indexes were created
SELECT name, tbl_name, sql 
FROM sqlite_master 
WHERE type = 'index' 
AND name LIKE 'idx_%'
ORDER BY tbl_name, name;
