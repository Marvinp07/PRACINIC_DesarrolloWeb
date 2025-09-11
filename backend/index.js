import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { testConnection } from "./config/database.js";

// Importar rutas
import usuariosRoutes from "./routes/usuarios.js";
import profesoresRoutes from "./routes/profesores.js";
import cursosRoutes from "./routes/cursos.js";
import publicacionesRoutes from "./routes/publicaciones.js";
import comentariosRoutes from "./routes/comentarios.js";
import cursosAprobadosRoutes from "./routes/cursosAprobados.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware para logging de requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Rutas principales
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/profesores', profesoresRoutes);
app.use('/api/cursos', cursosRoutes);
app.use('/api/publicaciones', publicacionesRoutes);
app.use('/api/comentarios', comentariosRoutes);
app.use('/api/cursos-aprobados', cursosAprobadosRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
    res.json({ 
        message: 'API de Evaluación de Catedráticos funcionando correctamente',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// Ruta para verificar estado de la BD
app.get('/health', async (req, res) => {
    const dbStatus = await testConnection();
    res.json({ 
        status: 'OK',
        database: dbStatus ? 'Connected' : 'Disconnected',
        timestamp: new Date().toISOString()
    });
});

// Middleware para manejo de errores
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        error: 'Error interno del servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Error interno'
    });
});

// Middleware para rutas no encontradas
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Ruta no encontrada',
        path: req.path
    });
});

// Iniciar servidor
const startServer = async () => {
    try {
        // Verificar conexión a la base de datos
        const dbConnected = await testConnection();
        if (!dbConnected) {
            console.error('No se pudo conectar a la base de datos');
            process.exit(1);
        }

        app.listen(PORT, () => {
            console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
            console.log(`📊 Health check disponible en http://localhost:${PORT}/health`);
        });
    } catch (error) {
        console.error('Error al iniciar el servidor:', error);
        process.exit(1);
    }
};

startServer();