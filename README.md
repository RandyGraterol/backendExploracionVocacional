# Backend - Test Vocacional API

API REST para el módulo de test vocacional con Express, TypeScript, Sequelize y SQLite3.

## Requisitos

- Node.js 18+
- npm

## Instalación

```bash
cd backend
npm install
```

## Comandos disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia el servidor en modo desarrollo con hot-reload |
| `npm run build` | Compila TypeScript a JavaScript |
| `npm start` | Ejecuta el servidor compilado (producción) |
| `npm run seed` | Puebla la base de datos con datos iniciales |
| `npm test` | Ejecuta los tests (incluye property-based tests) |

## Uso rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Poblar la base de datos
npm run seed

# 3. Iniciar el servidor
npm run dev
```

El servidor estará disponible en `http://localhost:3001`

## Nuevas Funcionalidades

### Sistema de Roles
- **super_admin**: Puede crear administradores y tiene acceso completo al sistema
- **admin**: Puede gestionar actividades, videos y contenido (no puede crear otros admins)
- **student**: Puede realizar actividades y tests vocacionales

### Tipos de Actividades
El sistema ahora soporta múltiples tipos de actividades:
- **Quiz**: Preguntas de opción múltiple
- **Ordenamiento**: Arrastrar y soltar elementos en orden correcto
- **Simulación**: Simulaciones interactivas (red, algoritmo, sistema)
- **Práctica**: Ejercicios de código con tests automatizados
- **Desafío**: Emparejar conceptos con definiciones

### Filtrado por Rama Vocacional
- Las actividades se filtran automáticamente según la rama recomendada del estudiante
- Las actividades pueden asociarse a múltiples ramas vocacionales
- Los videos se filtran por rama en el dashboard del estudiante

### Sistema de Videos Mejorado
- Validación de formato .mp4
- Streaming con soporte de Range requests
- Reproducción con controles estándar HTML5
- Filtrado automático por rama vocacional

## Endpoints

### Health Check
- `GET /api/health` - Verificar estado del servidor

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar nuevo usuario
- `POST /api/auth/create-admin` - Crear administrador (solo super_admin)

### Actividades
- `GET /api/actividades` - Obtener actividades (filtradas por rama para estudiantes)
- `GET /api/actividades/:id` - Obtener actividad por ID
- `POST /api/actividades` - Crear actividad (admin/super_admin)
- `PUT /api/actividades/:id` - Actualizar actividad (admin/super_admin)
- `DELETE /api/actividades/:id` - Eliminar actividad (admin/super_admin)

### Videos
- `GET /api/videos` - Obtener videos
- `GET /api/videos/stream/:filename` - Streaming de video
- `POST /api/videos` - Subir video (admin/super_admin)
- `DELETE /api/videos/:id` - Eliminar video (admin/super_admin)

### Preguntas Vocacionales
- `GET /api/preguntas-vocacionales` - Obtener todas
- `GET /api/preguntas-vocacionales/:id` - Obtener por ID
- `POST /api/preguntas-vocacionales` - Crear nueva
- `PUT /api/preguntas-vocacionales/:id` - Actualizar
- `DELETE /api/preguntas-vocacionales/:id` - Eliminar

### Preguntas de Conocimiento
- `GET /api/preguntas-conocimiento` - Obtener todas
- `GET /api/preguntas-conocimiento?rama=desarrollo` - Filtrar por rama
- `GET /api/preguntas-conocimiento/:id` - Obtener por ID
- `POST /api/preguntas-conocimiento` - Crear nueva
- `PUT /api/preguntas-conocimiento/:id` - Actualizar
- `DELETE /api/preguntas-conocimiento/:id` - Eliminar

### Progreso de Actividades
- `GET /api/progreso-actividades/user/:userId` - Obtener progreso por usuario
- `POST /api/progreso-actividades` - Registrar progreso
- `DELETE /api/progreso-actividades/:id` - Eliminar progreso

## Ramas disponibles

- `desarrollo` - Desarrollo de Software
- `redes` - Redes
- `ciberseguridad` - Ciberseguridad
- `bases-datos` - Bases de Datos
- `robotica` - Robótica
- `ia` - Inteligencia Artificial

## Estructura del proyecto

```
backend/
├── src/
│   ├── config/
│   │   └── database.ts      # Configuración Sequelize
│   ├── controllers/         # Lógica de negocio
│   ├── models/              # Modelos Sequelize
│   ├── routes/              # Rutas Express
│   ├── middleware/          # Middleware de autenticación y autorización
│   ├── seeds/
│   │   └── seed.ts          # Script de población
│   ├── tests/               # Tests unitarios y property-based tests
│   └── app.ts               # Entry point
├── database.sqlite          # Base de datos (generado)
├── uploads/                 # Archivos subidos (videos, documentos)
├── package.json
└── tsconfig.json
```

## Datos de seed

El script de seed incluye:
- 1 usuario super_admin (superadmin@exploracion.com)
- 1 usuario admin de ejemplo
- 1 usuario estudiante de ejemplo
- 5 preguntas vocacionales (para determinar afinidad con ramas)
- 18 preguntas de conocimiento técnico (3 por cada rama)
- Actividades de ejemplo de diferentes tipos
- Videos de ejemplo por rama

## Testing

El proyecto incluye tests completos:
- **Unit tests**: Tests de componentes específicos
- **Property-based tests**: Tests que verifican propiedades universales con múltiples iteraciones
- **Integration tests**: Tests end-to-end de flujos completos

Ejecutar tests:
```bash
npm test
```
