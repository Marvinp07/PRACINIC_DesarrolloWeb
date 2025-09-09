import express from "express";
import jwt from "jsonwebtoken";
import pool from "../config/database.js";

const router = express.Router();

// Middleware para verificar JWT
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
        req.userId = decoded.userId;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Token inválido' });
    }
};

// OBTENER TODOS LOS PROFESORES
router.get('/', async (req, res) => {
    try {
        const [profesores] = await pool.execute(
            'SELECT * FROM PROFESORES ORDER BY APELLIDOS, NOMBRES'
        );

        res.json({
            message: 'Profesores obtenidos exitosamente',
            profesores: profesores
        });

    } catch (error) {
        console.error('Error al obtener profesores:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// OBTENER UN PROFESOR POR ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [profesores] = await pool.execute(
            'SELECT * FROM PROFESORES WHERE ID_PROFESOR = ?',
            [id]
        );

        if (profesores.length === 0) {
            return res.status(404).json({ 
                error: 'Profesor no encontrado' 
            });
        }

        res.json({
            message: 'Profesor obtenido exitosamente',
            profesor: profesores[0]
        });

    } catch (error) {
        console.error('Error al obtener profesor:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// BUSCAR PROFESORES POR NOMBRE O APELLIDO
router.get('/buscar/:termino', async (req, res) => {
    try {
        const { termino } = req.params;

        const [profesores] = await pool.execute(
            `SELECT * FROM PROFESORES 
             WHERE NOMBRES LIKE ? OR APELLIDOS LIKE ? 
             ORDER BY APELLIDOS, NOMBRES`,
            [`%${termino}%`, `%${termino}%`]
        );

        res.json({
            message: 'Búsqueda completada',
            profesores: profesores,
            total: profesores.length
        });

    } catch (error) {
        console.error('Error al buscar profesores:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});


// BUSCAR CURSOS IMPARTIDOS POR UN PROFESOR
router.get('/:id/cursos', async (req, res) => {
    try {
        const { id } = req.params;

        const [cursos] = await pool.execute(
            `SELECT c.ID_CURSO, c.NOMBRE_CURSO
             FROM CURSOS c
             INNER JOIN PROFESORES p ON c.PROFESORES_ID_PROFESOR = p.ID_PROFESOR
             WHERE p.ID_PROFESOR = ?`,
            [id]
        );

        res.json({
            message: 'Cursos Encontrados',
            profesorId: id,
            cursos,
            total: cursos.length
        });

    } catch (error) {
        console.error('Error al obtener cursos del profesor:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

export default router;