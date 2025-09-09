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

// OBTENER TODAS LAS PUBLICACIONES CON FILTROS
router.get('/', async (req, res) => {
    try {
        const { 
            CURSOS_ID_CURSO, 
            PROFESORES_ID_PROFESOR, 
            NOMBRE_CURSO, 
            NOMBRE_PROFESOR, 
            page = 1, 
            limit = 10 
        } = req.query;

        let query = `
            SELECT 
                p.*,
                u.NOMBRES as usuario_nombres,
                u.APELLIDOS as usuario_apellidos,
                u.REGISTRO_ACADEMICO as usuario_registro,
                c.NOMBRE_CURSO,
                pr.NOMBRES as profesor_nombres,
                pr.APELLIDOS as profesor_apellidos,
                (SELECT COUNT(*) FROM COMENTARIOS WHERE PUBLICACIONES_ID_PUBLI = p.ID_PUBLI) as total_comentarios
            FROM PUBLICACIONES p
            JOIN USUARIOS u ON p.USUARIOS_ID_USUARIO = u.ID_USUARIO
            JOIN CURSOS c ON p.CURSOS_ID_CURSO = c.ID_CURSO
            JOIN PROFESORES pr ON p.PROFESORES_ID_PROFESOR = pr.ID_PROFESOR
            WHERE 1=1
        `;

        const params = [];

        // Aplicar filtros
        if (CURSOS_ID_CURSO) {
            query += ' AND p.CURSOS_ID_CURSO = ?';
            params.push(CURSOS_ID_CURSO);
        }

        if (PROFESORES_ID_PROFESOR) {
            query += ' AND p.PROFESORES_ID_PROFESOR = ?';
            params.push(PROFESORES_ID_PROFESOR);
        }

        if (NOMBRE_CURSO) {
            query += ' AND c.NOMBRE_CURSO LIKE ?';
            params.push(`%${NOMBRE_CURSO}%`);
        }

        if (NOMBRE_PROFESOR) {
            query += ' AND (pr.NOMBRES LIKE ? OR pr.APELLIDOS LIKE ?)';
            params.push(`%${NOMBRE_PROFESOR}%`, `%${NOMBRE_PROFESOR}%`);
        }

        // Ordenar por fecha (más recientes primero)
        query += ' ORDER BY p.FECHA DESC';

        // Paginación
        const offset = (page - 1) * limit;
        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const [publicaciones] = await pool.execute(query, params);

        // Obtener el total de registros para la paginación
        let countQuery = `
            SELECT COUNT(*) as total
            FROM PUBLICACIONES p
            JOIN USUARIOS u ON p.USUARIOS_ID_USUARIO = u.ID_USUARIO
            JOIN CURSOS c ON p.CURSOS_ID_CURSO = c.ID_CURSO
            JOIN PROFESORES pr ON p.PROFESORES_ID_PROFESOR = pr.ID_PROFESOR
            WHERE 1=1
        `;

        const countParams = [];
        if (CURSOS_ID_CURSO) {
            countQuery += ' AND p.CURSOS_ID_CURSO = ?';
            countParams.push(curso_id);
        }
        if (PROFESORES_ID_PROFESOR) {
            countQuery += ' AND p.PROFESORES_ID_PROFESOR = ?';
            countParams.push(profesor_id);
        }
        if (NOMBRE_CURSO) {
            countQuery += ' AND c.NOMBRE_CURSO LIKE ?';
            countParams.push(`%${NOMBRE_CURSO}%`);
        }
        if (NOMBRE_PROFESOR) {
            countQuery += ' AND (pr.NOMBRES LIKE ? OR pr.APELLIDOS LIKE ?)';
            countParams.push(`%${NOMBRE_PROFESOR}%`, `%${NOMBRE_PROFESOR}%`);
        }

        const [countResult] = await pool.execute(countQuery, countParams);
        const totalRecords = countResult[0].total;

        res.json({
            message: 'Publicaciones obtenidas exitosamente',
            publicaciones: publicaciones,
            pagination: {
                current_page: parseInt(page),
                per_page: parseInt(limit),
                total_records: totalRecords,
                total_pages: Math.ceil(totalRecords / limit)
            }
        });

    } catch (error) {
        console.error('Error al obtener publicaciones:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// OBTENER UNA PUBLICACIÓN POR ID CON SUS COMENTARIOS
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Obtener la publicación
        const [publicaciones] = await pool.execute(
            `SELECT 
                p.*,
                u.NOMBRES as usuario_nombres,
                u.APELLIDOS as usuario_apellidos,
                u.REGISTRO_ACADEMICO as usuario_registro,
                c.NOMBRE_CURSO,
                pr.NOMBRES as profesor_nombres,
                pr.APELLIDOS as profesor_apellidos
             FROM PUBLICACIONES p
             JOIN USUARIOS u ON p.USUARIOS_ID_USUARIO = u.ID_USUARIO
             JOIN CURSOS c ON p.CURSOS_ID_CURSO = c.ID_CURSO
             JOIN PROFESORES pr ON p.PROFESORES_ID_PROFESOR = pr.ID_PROFESOR
             WHERE p.ID_PUBLI = ?`,
            [id]
        );

        if (publicaciones.length === 0) {
            return res.status(404).json({ 
                error: 'Publicación no encontrada' 
            });
        }

        // Obtener los comentarios de la publicación
        const [comentarios] = await pool.execute(
            `SELECT 
                c.*,
                u.NOMBRES as usuario_nombres,
                u.APELLIDOS as usuario_apellidos,
                u.REGISTRO_ACADEMICO as usuario_registro
             FROM COMENTARIOS c
             JOIN USUARIOS u ON c.USUARIOS_ID_USUARIO = u.ID_USUARIO
             WHERE c.PUBLICACIONES_ID_PUBLI = ?
             ORDER BY c.FECHA_COMENTARIO ASC`,
            [id]
        );

        res.json({
            message: 'Publicación obtenida exitosamente',
            publicacion: {
                ...publicaciones[0],
                comentarios: comentarios
            }
        });

    } catch (error) {
        console.error('Error al obtener publicación:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

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

        // Crear la publicación (usando el ID del usuario autenticado desde el token)
        const [result] = await pool.execute(
            `INSERT INTO PUBLICACIONES 
             (MENSAJE, USUARIOS_ID_USUARIO, CURSOS_ID_CURSO, PROFESORES_ID_PROFESOR) 
             VALUES (?, ?, ?, ?)`,
            [
                MENSAJE,
                req.userId,                 // ✅ tomado del token
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



// ACTUALIZAR UNA PUBLICACIÓN (solo el autor puede actualizar)
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { mensaje } = req.body;

        if (!mensaje) {
            return res.status(400).json({ 
                error: 'El mensaje es obligatorio' 
            });
        }

        // Verificar que la publicación existe y pertenece al usuario
        const [publicacion] = await pool.execute(
            'SELECT * FROM PUBLICACIONES WHERE ID_PUBLI = ? AND USUARIOS_ID_USUARIO = ?',
            [id, req.userId]
        );

        if (publicacion.length === 0) {
            return res.status(404).json({ 
                error: 'Publicación no encontrada o no tienes permisos para modificarla' 
            });
        }

        // Actualizar la publicación
        await pool.execute(
            'UPDATE PUBLICACIONES SET MENSAJE = ? WHERE ID_PUBLI = ?',
            [mensaje, id]
        );

        res.json({
            message: 'Publicación actualizada exitosamente'
        });

    } catch (error) {
        console.error('Error al actualizar publicación:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ELIMINAR UNA PUBLICACIÓN (solo el autor puede eliminar)
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que la publicación existe y pertenece al usuario
        const [publicacion] = await pool.execute(
            'SELECT * FROM PUBLICACIONES WHERE ID_PUBLI = ? AND USUARIOS_ID_USUARIO = ?',
            [id, req.userId]
        );

        if (publicacion.length === 0) {
            return res.status(404).json({ 
                error: 'Publicación no encontrada o no tienes permisos para eliminarla' 
            });
        }

        // Eliminar la publicación (los comentarios se eliminarán automáticamente por CASCADE)
        await pool.execute(
            'DELETE FROM PUBLICACIONES WHERE ID_PUBLI = ?',
            [id]
        );

        res.json({
            message: 'Publicación eliminada exitosamente'
        });

    } catch (error) {
        console.error('Error al eliminar publicación:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// OBTENER PUBLICACIONES DE UN USUARIO ESPECÍFICO
router.get('/usuario/:userId', verifyToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const offset = (page - 1) * limit;

        const [publicaciones] = await pool.execute(
            `SELECT 
                p.*,
                u.NOMBRES as usuario_nombres,
                u.APELLIDOS as usuario_apellidos,
                c.NOMBRE_CURSO,
                pr.NOMBRES as profesor_nombres,
                pr.APELLIDOS as profesor_apellidos,
                (SELECT COUNT(*) FROM COMENTARIOS WHERE PUBLICACIONES_ID_PUBLI = p.ID_PUBLI) as total_comentarios
             FROM PUBLICACIONES p
             JOIN USUARIOS u ON p.USUARIOS_ID_USUARIO = u.ID_USUARIO
             JOIN CURSOS c ON p.CURSOS_ID_CURSO = c.ID_CURSO
             JOIN PROFESORES pr ON p.PROFESORES_ID_PROFESOR = pr.ID_PROFESOR
             WHERE p.USUARIOS_ID_USUARIO = ?
             ORDER BY p.FECHA DESC
             LIMIT ? OFFSET ?`,
            [userId, parseInt(limit), offset]
        );

        // Obtener el total de publicaciones del usuario
        const [countResult] = await pool.execute(
            'SELECT COUNT(*) as total FROM PUBLICACIONES WHERE USUARIOS_ID_USUARIO = ?',
            [userId]
        );

        res.json({
            message: 'Publicaciones del usuario obtenidas exitosamente',
            publicaciones: publicaciones,
            pagination: {
                current_page: parseInt(page),
                per_page: parseInt(limit),
                total_records: countResult[0].total,
                total_pages: Math.ceil(countResult[0].total / limit)
            }
        });

    } catch (error) {
        console.error('Error al obtener publicaciones del usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

export default router;