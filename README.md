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

## Endpoints

### Health Check
- `GET /api/health` - Verificar estado del servidor

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
│   ├── seeds/
│   │   └── seed.ts          # Script de población
│   └── app.ts               # Entry point
├── database.sqlite          # Base de datos (generado)
├── package.json
└── tsconfig.json
```

## Datos de seed

El script de seed incluye:
- 5 preguntas vocacionales (para determinar afinidad con ramas)
- 18 preguntas de conocimiento técnico (3 por cada rama)
