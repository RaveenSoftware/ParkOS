-- Script de setup para ParkOS en PostgreSQL local
-- Ejecutar como superusuario: psql -U postgres -f setup_db.sql

-- 1. Crear usuario si no existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'parkos_user') THEN
    CREATE ROLE parkos_user WITH LOGIN PASSWORD 'parkos_password';
  END IF;
END
$$;

-- 2. Crear base de datos si no existe
SELECT 'CREATE DATABASE parkos_db OWNER parkos_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'parkos_db')\gexec

-- 3. Dar permisos
GRANT ALL PRIVILEGES ON DATABASE parkos_db TO parkos_user;

\echo '✅ Usuario parkos_user y base de datos parkos_db creados correctamente'
\echo '   Ahora ejecuta: cd backend && npm run seed'
