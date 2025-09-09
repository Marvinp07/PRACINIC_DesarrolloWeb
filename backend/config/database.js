import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "root",
    database: process.env.DB_NAME || "practica_web",
    waitForConnections: true,
    connectionLimit: 10
});

export const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log("Conexión exitosa a la base de datos");
        connection.release();
        return true;
    } catch (error) {
        console.error("Error conectando a la base de datos:", error.message);
        return false;
    }
};

export default pool;