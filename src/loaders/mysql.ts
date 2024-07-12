import { config } from "dotenv";
import mysql from "mysql2/promise";
config();
export default async function mysqlLoader() {
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE,
            waitForConnections: true,
            connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || "10", 10),
            queueLimit: 0,
        });

        // 연결 풀에서 연결을 가져와서 테스트해볼 수 있습니다.
        const connection = await pool.getConnection();
        console.log("MySQL 연결 성공!");
        connection.release(); // 연결을 사용한 후 반드시 해제해야 합니다.

        return pool;
    } catch (err) {
        console.error("MySQL 연결 오류:", err);
        throw err;
    }
}
