import express from 'express';
import cors from 'cors';
import path from 'path';
import { sequelize } from './models';
import preguntasVocacionalesRoutes from './routes/preguntasVocacionales';
import preguntasConocimientoRoutes from './routes/preguntasConocimiento';
import authRoutes from './routes/auth';
import videosRoutes from './routes/videos';
import ramasRoutes from './routes/ramas';
import actividadesRoutes from './routes/actividades';
import resultadosTestRoutes from './routes/resultadosTest';
import progresoActividadesRoutes from './routes/progresoActividades';
import soporteRoutes from './routes/soporte';
import superAdminRoutes from './routes/superAdminRoutes';

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || ['http://localhost:5173', 'http://localhost:8080', 'http://localhost:3000'],
  credentials: true,
  exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Servir archivos estáticos de uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Routes con prefijo para proxy
app.use('/backendGustavo/api/auth', authRoutes);
app.use('/backendGustavo/api/preguntas-vocacionales', preguntasVocacionalesRoutes);
app.use('/backendGustavo/api/preguntas-conocimiento', preguntasConocimientoRoutes);
app.use('/backendGustavo/api/videos', videosRoutes);
app.use('/backendGustavo/api/ramas', ramasRoutes);
app.use('/backendGustavo/api/actividades', actividadesRoutes);
app.use('/backendGustavo/api/resultados-test', resultadosTestRoutes);
app.use('/backendGustavo/api/progreso-actividades', progresoActividadesRoutes);
app.use('/backendGustavo/api/soporte', soporteRoutes);
app.use('/backendGustavo/api/super-admin', superAdminRoutes);
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/preguntas-vocacionales', preguntasVocacionalesRoutes);
app.use('/api/preguntas-conocimiento', preguntasConocimientoRoutes);
app.use('/api/videos', videosRoutes);
app.use('/api/ramas', ramasRoutes);
app.use('/api/actividades', actividadesRoutes);
app.use('/api/resultados-test', resultadosTestRoutes);
app.use('/api/progreso-actividades', progresoActividadesRoutes);
app.use('/api/soporte', soporteRoutes);
app.use('/api/super-admin', superAdminRoutes);

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize database and start server
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    await sequelize.sync();
    console.log('✅ Database synchronized');
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
};

// Only start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
