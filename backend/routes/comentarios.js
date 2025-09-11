import express from "express";
import pool from "../config/database.js";

const router = express.Router();

router.post("/crearComentario", async (req, res) => {
    try {
        const { PUBLICACIONES_ID_PUBLI, USUARIOS_ID_USUARIO, MENSAJE_COMENTARIO } = req.body;

        if (!PUBLICACIONES_ID_PUBLI || !USUARIOS_ID_USUARIO || !MENSAJE_COMENTARIO) {
            return res.status(400).json({ error: "Faltan datos obligatorios" });
        }

        await pool.query(
            "INSERT INTO COMENTARIOS (PUBLICACIONES_ID_PUBLI, USUARIOS_ID_USUARIO, MENSAJE_COMENTARIO) VALUES (?, ?, ?)",
            [PUBLICACIONES_ID_PUBLI, USUARIOS_ID_USUARIO, MENSAJE_COMENTARIO]
        );
        res.status(201).json({ message: "Comentario creado con éxito" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get("/publicacion/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: "Faltan datos obligatorios" });
        }

        // Verificar si ya existe el usuario
        const [publicacionExiste] = await pool.execute(
            'SELECT ID_PUBLI FROM PUBLICACIONES WHERE ID_PUBLI = ?',
            [id]
        );

        if (publicacionExiste.length === 0) {
            return res.status(409).json({ 
                error: 'La publicación no existe' 
            });
        }

        const [publicacionInfo] = await pool.execute(`
            SELECT 
                p.ID_PUBLI,
                p.MENSAJE,
                p.FECHA,
                p.USUARIOS_ID_USUARIO,
                p.CURSOS_ID_CURSO,
                p.PROFESORES_ID_PROFESOR,
                u.NOMBRES AS AUTOR_NOMBRES,
                u.APELLIDOS AS AUTOR_APELLIDOS,
                u.REGISTRO_ACADEMICO AS AUTOR_REGISTRO,
                c.NOMBRE_CURSO,
                pr.NOMBRES AS NOMBRE_PROFESOR
            FROM PUBLICACIONES p
            JOIN USUARIOS u ON p.USUARIOS_ID_USUARIO = u.ID_USUARIO
            LEFT JOIN CURSOS c ON p.CURSOS_ID_CURSO = c.ID_CURSO
            LEFT JOIN PROFESORES pr ON p.PROFESORES_ID_PROFESOR = pr.ID_PROFESOR
            WHERE p.ID_PUBLI = ?
        `, [id]);

        const [comentarios] = await pool.execute(`
            SELECT 
                com.ID_COMENTARIO,
                com.MENSAJE_COMENTARIO,
                com.FECHA_COMENTARIO,
                u.NOMBRES AS COMENTARIO_AUTOR_NOMBRES,
                u.APELLIDOS AS COMENTARIO_AUTOR_APELLIDOS,
                u.REGISTRO_ACADEMICO AS COMENTARIO_AUTOR_REGISTRO
            FROM COMENTARIOS com
            JOIN USUARIOS u ON com.USUARIOS_ID_USUARIO = u.ID_USUARIO
            WHERE com.PUBLICACIONES_ID_PUBLI = ?
            ORDER BY com.FECHA_COMENTARIO ASC
        `, [id]);

        const [countResult] = await pool.execute(
            'SELECT COUNT(*) as total FROM COMENTARIOS WHERE PUBLICACIONES_ID_PUBLI = ?',
            [id]
        );

        const totalComentarios = countResult[0].total;

        const publicacion = publicacionInfo[0];

        res.json({
            message: 'Publicación y comentarios obtenidos exitosamente',
            publicacion: {
                id: publicacion.ID_PUBLI,
                mensaje: publicacion.MENSAJE,
                fecha: publicacion.FECHA,
                autor: {
                    nombres: publicacion.AUTOR_NOMBRES,
                    apellidos: publicacion.AUTOR_APELLIDOS,
                    registro_academico: publicacion.AUTOR_REGISTRO
                },
                curso: publicacion.CURSOS_ID_CURSO ? {
                    id: publicacion.CURSOS_ID_CURSO,
                    nombre: publicacion.NOMBRE_CURSO
                } : null,
                profesor: publicacion.PROFESORES_ID_PROFESOR ? {
                    id: publicacion.PROFESORES_ID_PROFESOR,
                    nombre: publicacion.NOMBRE_PROFESOR
                } : null
            },
            comentarios: {
                total: totalComentarios,
                lista: comentarios.map(com => ({
                    id: com.ID_COMENTARIO,
                    mensaje: com.MENSAJE_COMENTARIO,
                    fecha: com.FECHA_COMENTARIO,
                    autor: {
                        nombres: com.COMENTARIO_AUTOR_NOMBRES,
                        apellidos: com.COMENTARIO_AUTOR_APELLIDOS,
                        registro_academico: com.COMENTARIO_AUTOR_REGISTRO
                    }
                }))
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;