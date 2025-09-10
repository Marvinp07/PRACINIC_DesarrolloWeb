import express from "express";
import pool from "../config/database.js";

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const [cursos] = await pool.execute(
            'SELECT * FROM CURSOS ORDER BY NOMBRE_CURSO ASC'
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

export default router;