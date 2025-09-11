import express from "express";
import pool from "../config/database.js";

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const [cursos] = await pool.execute(
            'SELECT DISTINCT NOMBRE_CURSO FROM CURSOS ORDER BY NOMBRE_CURSO ASC'
        );

        res.json({
            message: 'Cursos obtenidos exitosamente',
            cursos: cursos
        });

    } catch (error) {
        console.error('Error al obtener cursos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.get('/id', async (req, res) => {
    try {
        const [cursos] = await pool.execute(`
            SELECT NOMBRE_CURSO, MAX(ID_CURSO) as ID_CURSO 
                FROM CURSOS 
                GROUP BY NOMBRE_CURSO 
                ORDER BY NOMBRE_CURSO ASC
        `);

        res.json({
            message: 'Cursos obtenidos exitosamente',
            cursos: cursos
        });

    } catch (error) {
        console.error('Error al obtener cursos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

export default router;