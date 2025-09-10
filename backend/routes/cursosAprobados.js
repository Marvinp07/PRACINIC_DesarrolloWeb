import express from "express";
import bcrypt from "bcrypt";
import pool from "../config/database.js";

const router = express.Router();

router.post('/registro', async (req, res) => {
    try {
        const { USUARIOS_ID_USUARIO, CURSOS_ID_CURSO } = req.body;

        // Validaciones básicas
        if (!USUARIOS_ID_USUARIO || !CURSOS_ID_CURSO) {
            return res.status(400).json({ 
                error: 'Todos los campos son obligatorios' 
            });
        }

        // Verificar si ya existe el usuario
        const [usuarioExiste] = await pool.execute(
            'SELECT ID_USUARIO FROM USUARIOS WHERE ID_USUARIO = ?',
            [USUARIOS_ID_USUARIO]
        );

        if (usuarioExiste.length === 0) {
            return res.status(409).json({ 
                error: 'El usuario no existe' 
            });
        }

        const [cursoExiste] = await pool.execute(
            'SELECT ID_CURSO FROM CURSOS WHERE ID_CURSO = ?',
            [CURSOS_ID_CURSO]
        );
        
        if (cursoExiste.length === 0) {
            return res.status(409).json({ 
                error: 'El curso no existe' 
            });
        }

        const [yaAprobado] = await pool.execute(
            'SELECT * FROM CURSO_APROBADO WHERE USUARIOS_ID_USUARIO = ? AND CURSOS_ID_CURSO = ?',
            [USUARIOS_ID_USUARIO, CURSOS_ID_CURSO]
        );

        if (yaAprobado.length > 0) {
            return res.status(409).json({
                error: 'Curso ya aprobado',
                message: 'Este curso ya está registrado como aprobado para este usuario'
            });
        }

        await pool.execute(
            'INSERT INTO CURSO_APROBADO (USUARIOS_ID_USUARIO, CURSOS_ID_CURSO) VALUES (?, ?)',
            [USUARIOS_ID_USUARIO, CURSOS_ID_CURSO]
        );

        const [cursoAprobadoInfo] = await pool.execute(`
            SELECT 
                ca.USUARIOS_ID_USUARIO,
                ca.CURSOS_ID_CURSO,
                u.NOMBRES as NOMBRE_USUARIO,
                u.APELLIDOS as APELLIDO_USUARIO,
                u.REGISTRO_ACADEMICO,
                c.NOMBRE_CURSO,
                c.CREDITOS,
                p.NOMBRES as NOMBRE_PROFESOR,
                p.APELLIDOS as APELLIDO_PROFESOR
            FROM CURSO_APROBADO ca
            INNER JOIN USUARIOS u ON ca.USUARIOS_ID_USUARIO = u.ID_USUARIO
            INNER JOIN CURSOS c ON ca.CURSOS_ID_CURSO = c.ID_CURSO
            INNER JOIN PROFESORES p ON c.PROFESORES_ID_PROFESOR = p.ID_PROFESOR
            WHERE ca.USUARIOS_ID_USUARIO = ? AND ca.CURSOS_ID_CURSO = ?
        `, [USUARIOS_ID_USUARIO, CURSOS_ID_CURSO]);

        res.status(201).json({
            message: 'Curso aprobado registrado exitosamente',
            data: cursoAprobadoInfo[0]
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.get('/aprobados/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Validaciones básicas
        if (!id) {
            return res.status(400).json({ 
                error: 'Todos los campos son obligatorios' 
            });
        }

        // Verificar si ya existe el usuario
        const [usuarioExiste] = await pool.execute(
            'SELECT ID_USUARIO FROM USUARIOS WHERE ID_USUARIO = ?',
            [id]
        );

        if (usuarioExiste.length === 0) {
            return res.status(409).json({ 
                error: 'El usuario no existe' 
            });
        }

        const [cursoAprobadoInfo] = await pool.execute(`
            SELECT 
                ca.USUARIOS_ID_USUARIO,
                ca.CURSOS_ID_CURSO,
                u.NOMBRES as NOMBRE_USUARIO,
                u.APELLIDOS as APELLIDO_USUARIO,
                u.REGISTRO_ACADEMICO,
                c.NOMBRE_CURSO,
                c.CREDITOS,
                p.NOMBRES as NOMBRE_PROFESOR,
                p.APELLIDOS as APELLIDO_PROFESOR
            FROM CURSO_APROBADO ca
            INNER JOIN USUARIOS u ON ca.USUARIOS_ID_USUARIO = u.ID_USUARIO
            INNER JOIN CURSOS c ON ca.CURSOS_ID_CURSO = c.ID_CURSO
            INNER JOIN PROFESORES p ON c.PROFESORES_ID_PROFESOR = p.ID_PROFESOR
            WHERE ca.USUARIOS_ID_USUARIO = ?
        `, [id]);

        if (cursoAprobadoInfo.length === 0) {
            return res.status(200).json({
                message: 'El usuario no cuenta con cursos aprobados'
            });
        }

        res.status(201).json({
            message: 'Cursos Aprobados',
            data: cursoAprobadoInfo[0]
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.delete('/borrar-cursos/:id/:cursoId', async (req, res) => {
    try {
        const { id, cursoId } = req.params;

        // Validaciones básicas
        if (!id || !cursoId) {
            return res.status(400).json({ 
                error: 'Todos los campos son obligatorios' 
            });
        }

        // Verificar si ya existe el usuario
        const [usuarioExiste] = await pool.execute(
            'SELECT ID_USUARIO FROM USUARIOS WHERE ID_USUARIO = ?',
            [id]
        );

        if (usuarioExiste.length === 0) {
            return res.status(409).json({ 
                error: 'El usuario no existe' 
            });
        }

        // Verificar si ya existe el usuario
        const [cursoExiste] = await pool.execute(
            'SELECT ID_CURSO FROM CURSOS WHERE ID_CURSO = ?',
            [cursoId]
        );

        if (cursoExiste.length === 0) {
            return res.status(409).json({ 
                error: 'El curso no existe' 
            });
        }

        const [cursoAprobadoInfo] = await pool.execute(`
            SELECT 
                ca.USUARIOS_ID_USUARIO,
                ca.CURSOS_ID_CURSO,
                u.NOMBRES as NOMBRE_USUARIO,
                u.APELLIDOS as APELLIDO_USUARIO,
                u.REGISTRO_ACADEMICO,
                c.NOMBRE_CURSO,
                c.CREDITOS,
                p.NOMBRES as NOMBRE_PROFESOR,
                p.APELLIDOS as APELLIDO_PROFESOR
            FROM CURSO_APROBADO ca
            INNER JOIN USUARIOS u ON ca.USUARIOS_ID_USUARIO = u.ID_USUARIO
            INNER JOIN CURSOS c ON ca.CURSOS_ID_CURSO = c.ID_CURSO
            INNER JOIN PROFESORES p ON c.PROFESORES_ID_PROFESOR = p.ID_PROFESOR
            WHERE ca.USUARIOS_ID_USUARIO = ? AND ca.CURSOS_ID_CURSO = ?
        `, [id, cursoId]);

        const [resultado] = await pool.execute(
            'DELETE FROM CURSO_APROBADO WHERE USUARIOS_ID_USUARIO = ? AND CURSOS_ID_CURSO = ?',
            [id, cursoId]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                error: 'No se pudo eliminar',
                message: 'No se encontró el registro para eliminar'
            });
        }

        res.status(201).json({
            message: 'Cursos Aprobados eliminados correctamente',
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

export default router;


