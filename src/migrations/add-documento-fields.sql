-- Migración para agregar campos de documento a la tabla usuarios
-- Ejecutar esta migración si la tabla usuarios ya existe

-- Agregar columna documentoUrl si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='usuarios' AND column_name='documentoUrl') THEN
        ALTER TABLE usuarios ADD COLUMN "documentoUrl" TEXT;
    END IF;
END $$;

-- Agregar columna documentoNombre si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='usuarios' AND column_name='documentoNombre') THEN
        ALTER TABLE usuarios ADD COLUMN "documentoNombre" VARCHAR(255);
    END IF;
END $$;

-- Verificar que las columnas se hayan agregado
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
AND column_name IN ('documentoUrl', 'documentoNombre');
