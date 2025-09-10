import express from "express";
import jwt from "jsonwebtoken";
import pool from "../config/database.js";

const router = express.Router();

router.post('/registro', async (req, res) => {
    try {
        const { usuarioId, cursoId } = req.body;

        // Validaciones básicas
        if (!usuarioId || !cursoId) {
            return res.status(400).json({ 
                error: 'Todos los campos son obligatorios' 
            });
        }

        // Verificar si ya existe el usuario
        const [usuarioExiste] = await pool.execute(
            'SELECT ID_USUARIO FROM USUARIOS WHERE ID_USUARIO = ?',
            [usuarioId]
        );

        if (usuarioExiste.length === 0) {
            return res.status(409).json({ 
                error: 'El usuario no existe' 
            });
        }

        const [cursoExiste] = await pool.execute(
            'SELECT ID_CURSO FROM CURSOS WHERE ID_CURSO = ?',
            [cursoId]
        );
        
        if (cursoExiste.length === 0) {
            return res.status(409).json({ 
                error: 'El curso no existe' 
            });
        }

        const [yaAprobado] = await connection.execute(
            'SELECT * FROM CURSO_APROBADO WHERE USUARIOS_ID_USUARIO = ? AND CURSOS_ID_CURSO = ?',
            [usuarioId, cursoId]
        );

        if (yaAprobado.length > 0) {
            return res.status(409).json({
                error: 'Curso ya aprobado',
                message: 'Este curso ya está registrado como aprobado para este usuario'
            });
        }

        await connection.execute(
            'INSERT INTO CURSO_APROBADO (USUARIOS_ID_USUARIO, CURSOS_ID_CURSO) VALUES (?, ?)',
            [usuarioId, cursoId]
        );

        const [cursoAprobadoInfo] = await connection.execute(`
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
        `, [usuarioId, cursoId]);


        res.status(201).json({
            message: 'Curso aprobado registrado exitosamente',
            userId: result.insertId
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

