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

// CREAR UNA PUBLICACIÓN
router.post('/', verifyToken, async (req, res) => {
    try {
        const { CURSOS_ID_CURSO, PROFESORES_ID_PROFESOR, MENSAJE } = req.body;

        if (!MENSAJE) {
            return res.status(400).json({ error: 'El mensaje es obligatorio' });
        }

        // Validar curso si se envió
        if (CURSOS_ID_CURSO) {
            const [curso] = await pool.execute(
                "SELECT * FROM CURSOS WHERE ID_CURSO = ?",
                [CURSOS_ID_CURSO]
            );
            if (curso.length === 0) {
                return res.status(404).json({ error: "Curso no encontrado" });
            }
        }

        // Validar profesor si se envió
        if (PROFESORES_ID_PROFESOR) {
            const [profesor] = await pool.execute(
                "SELECT * FROM PROFESORES WHERE ID_PROFESOR = ?",
                [PROFESORES_ID_PROFESOR]
            );
            if (profesor.length === 0) {
                return res.status(404).json({ error: "Profesor no encontrado" });
            }
        }

        // Crear la publicación
        const [result] = await pool.execute(
            `INSERT INTO PUBLICACIONES 
             (MENSAJE, USUARIOS_ID_USUARIO, CURSOS_ID_CURSO, PROFESORES_ID_PROFESOR) 
             VALUES (?, ?, ?, ?)`,
            [
                MENSAJE,
                req.userId,
                CURSOS_ID_CURSO || null,
                PROFESORES_ID_PROFESOR || null
            ]
        );

        // Devolver la publicación creada
        const [nuevaPublicacion] = await pool.execute(
            `SELECT 
                p.*,
                u.NOMBRES as usuario_nombres,
                u.APELLIDOS as usuario_apellidos,
                c.NOMBRE_CURSO,
                pr.NOMBRES as profesor_nombres,
                pr.APELLIDOS as profesor_apellidos
             FROM PUBLICACIONES p
             JOIN USUARIOS u ON p.USUARIOS_ID_USUARIO = u.ID_USUARIO
             LEFT JOIN CURSOS c ON p.CURSOS_ID_CURSO = c.ID_CURSO
             LEFT JOIN PROFESORES pr ON p.PROFESORES_ID_PROFESOR = pr.ID_PROFESOR
             WHERE p.ID_PUBLI = ?`,
            [result.insertId]
        );

        res.status(201).json({
            message: 'Publicación creada exitosamente',
            publicacion: nuevaPublicacion[0]
        });

    } catch (error) {
        console.error('Error al crear publicación:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// OBTENER TODAS LAS PUBLICACIONES
router.get("/obtenerPublicaciones", async (req, res) => {
    try {
        const [rows] = await pool.query(`            
            SELECT p.ID_PUBLI, p.MENSAJE, p.FECHA,
            u.NOMBRES as estudiante, c.NOMBRE_CURSO, pr.NOMBRES AS Nombre, pr.APELLIDOS AS Apellido
            FROM PUBLICACIONES p
            JOIN USUARIOS u ON p.USUARIOS_ID_USUARIO= u.ID_USUARIO
            LEFT JOIN CURSOS c on p.CURSOS_ID_CURSO = c.ID_CURSO
            LEFT JOIN PROFESORES pr on p.PROFESORES_ID_PROFESOR= pr.ID_PROFESOR
            ORDER BY p.FECHA DESC ;`, 
            [req.params.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// OBTENER LAS PUBLICACIONES DE UN USUARIO
router.get("/usuarios/:registroAcademico", verifyToken, async (req, res) => {
    try {
        const { registroAcademico } = req.params;

        // Validar que el userId sea un número válido
        if (isNaN(registroAcademico) || registroAcademico <= 0) {
            return res.status(400).json({ 
                error: 'Registro académico del usuario inválido' 
            });
        }

        const [registroExists] = await pool.execute(
            'SELECT REGISTRO_ACADEMICO FROM USUARIOS WHERE REGISTRO_ACADEMICO = ?',
            [registroAcademico]
        );

        if (registroExists.length === 0) {
            return res.status(404).json({
                error: 'Usuario no encontrado'
            });
        }

        const [publicaciones] = await pool.execute(`
            SELECT 
                p.ID_PUBLI,
                p.MENSAJE,
                p.FECHA,
                u.NOMBRES,
                u.APELLIDOS,
                u.REGISTRO_ACADEMICO,
                p.CURSOS_ID_CURSO AS ID_CURSO,
                c.NOMBRE_CURSO,
                p.PROFESORES_ID_PROFESOR AS ID_PROFESOR,
                pr.NOMBRES AS NOMBRE,
                pr.APELLIDOS AS APELLIDO
            FROM PUBLICACIONES p
            JOIN USUARIOS u ON p.USUARIOS_ID_USUARIO = u.ID_USUARIO
            LEFT JOIN CURSOS c ON p.CURSOS_ID_CURSO = c.ID_CURSO
            LEFT JOIN PROFESORES pr ON p.PROFESORES_ID_PROFESOR = pr.ID_PROFESOR
            WHERE u.REGISTRO_ACADEMICO = ?
            ORDER BY p.FECHA DESC
        `, [registroAcademico]);

        res.json({
            message: 'Publicaciones obtenidas exitosamente',
            publicaciones: publicaciones.map(pub => ({
                id: pub.ID_PUBLI,
                mensaje: pub.MENSAJE,
                fecha_creacion: pub.FECHA,
                curso: pub.ID_CURSO ? {
                    id: pub.ID_CURSO,
                    nombre: pub.NOMBRE_CURSO,
                } : null,
                profesor: pub.ID_PROFESOR ? {
                    id: pub.ID_PROFESOR,
                    nombre: pub.NOMBRE,
                    apellido: pub.APELLIDO
                } : null,
                autor: {
                    nombres: pub.NOMBRES,
                    apellidos: pub.APELLIDOS,
                    registro_academico: pub.REGISTRO_ACADEMICO
                }
            }))
        });

    } catch (err) {
        console.error('Error al obtener publicaciones del usuario:', err);
        res.status(500).json({ error: err.message });
    }
});

router.get("/cursos/:cursoNombre", verifyToken, async (req, res) => {
    try {
        const { cursoNombre } = req.params;

        const [cursoExists] = await pool.execute(
            'SELECT NOMBRE_CURSO FROM CURSOS WHERE NOMBRE_CURSO = ?',
            [cursoNombre]
        );

        const [publicaciones] = await pool.execute(`
            SELECT 
                p.ID_PUBLI,
                p.MENSAJE,
                p.FECHA,
                u.NOMBRES,
                u.APELLIDOS,
                u.REGISTRO_ACADEMICO,
                p.CURSOS_ID_CURSO AS ID_CURSO,
                c.NOMBRE_CURSO
            FROM PUBLICACIONES p
            JOIN USUARIOS u ON p.USUARIOS_ID_USUARIO = u.ID_USUARIO
            LEFT JOIN CURSOS c ON p.CURSOS_ID_CURSO = c.ID_CURSO
            WHERE c.NOMBRE_CURSO = ?
            ORDER BY p.FECHA DESC
        `, [cursoNombre]);

        res.json({
            message: 'Publicaciones obtenidas exitosamente',
            curso: cursoExists[0],
            publicaciones: publicaciones.map(pub => ({
                id: pub.ID_PUBLI,
                mensaje: pub.MENSAJE,
                fecha_creacion: pub.FECHA,
                curso: {
                    id: pub.ID_CURSO,
                    nombre: pub.NOMBRE_CURSO,
                },
                autor: {
                    nombres: pub.NOMBRES,
                    apellidos: pub.APELLIDOS,
                    registro_academico: pub.REGISTRO_ACADEMICO
                }
            }))
        });

    } catch (err) {
        console.error('Error al obtener publicaciones del curso:', err);
        res.status(500).json({ error: err.message });
    }
});

router.get("/profesores/:profesorNombre/:profesorApellido", verifyToken, async (req, res) => {
    try {
        const { profesorNombre, profesorApellido } = req.params;

        const [profesorNombreExists] = await pool.execute(
            'SELECT NOMBRES FROM PROFESORES WHERE NOMBRES = ?',
            [profesorNombre]
        );

        const [profesorApellidoExists] = await pool.execute(
            'SELECT APELLIDOS FROM PROFESORES WHERE APELLIDOS = ?',
            [profesorApellido]
        );

        if (profesorNombreExists.length === 0) {
            return res.status(404).json({
                error: 'Profesor no encontrado con ese nombre'
            });
        }

        if (profesorApellidoExists.length === 0) {
            return res.status(404).json({
                error: 'Profesor no encontrado con ese apellido'
            });
        }

        const [publicaciones] = await pool.execute(`
            SELECT 
                p.ID_PUBLI,
                p.MENSAJE,
                p.FECHA,
                u.NOMBRES,
                u.APELLIDOS,
                u.REGISTRO_ACADEMICO,
                p.PROFESORES_ID_PROFESOR AS ID_PROFESOR,
                pr.NOMBRES AS NOMBRE,
                pr.APELLIDOS AS APELLIDO
            FROM PUBLICACIONES p
            JOIN USUARIOS u ON p.USUARIOS_ID_USUARIO = u.ID_USUARIO
            LEFT JOIN PROFESORES pr ON p.PROFESORES_ID_PROFESOR = pr.ID_PROFESOR
            WHERE pr.NOMBRES = ? OR pr.APELLIDOS = ?
            ORDER BY p.FECHA DESC
        `, [profesorNombre, profesorApellido]);

        res.json({
            message: 'Publicaciones obtenidas exitosamente',
            publicaciones: publicaciones.map(pub => ({
                id: pub.ID_PUBLI,
                mensaje: pub.MENSAJE,
                fecha_creacion: pub.FECHA,
                profesor: {
                    id: pub.ID_PROFESOR,
                    nombre: pub.NOMBRE,
                    apellido: pub.APELLIDO
                },
                autor: {
                    nombres: pub.NOMBRES,
                    apellidos: pub.APELLIDOS,
                    registro_academico: pub.REGISTRO_ACADEMICO
                }
            }))
        });

    } catch (err) {
        console.error('Error al obtener publicaciones del curso:', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;