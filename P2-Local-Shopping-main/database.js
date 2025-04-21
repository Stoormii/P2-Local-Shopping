// database.js
import mysql from 'mysql2/promise'; // Brug mysql2/promise for korrekt async/await
import 'dotenv/config';

// Databasekonfiguration
console.log('Database config:', {
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'cs-25-sw-2-09@student.aau.dk',
    password: process.env.MYSQL_PASSWORD || 'ye5n@8gKVdikj-NR',
    database: process.env.MYSQL_DATABASE || 'cs_25_sw_2_09',
});

// Opretter forbindelse til MySQL-Databasen
const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'cs-25-sw-2-09@student.aau.dk',
    password: process.env.MYSQL_PASSWORD || 'ye5n@8gKVdikj-NR',
    database: process.env.MYSQL_DATABASE || 'cs_25_sw_2_09',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test forbindelsen
(async () => {
    try {
        const [results] = await pool.query('SELECT 1');
        console.log('Database connection successful:', results);
    } catch (err) {
        console.error('Database connection failed:', err);
    }
})();

// Funktion til at hente alle brugere
export async function getUsers() {
    const [rows] = await pool.query('SELECT * FROM users');
    return rows;
}

// Funktion til at oprette en bruger
export async function createUser(firstname, email, password) {
    try {
        console.log('Inserting user into database:', { firstname, email, password });
        const [result] = await pool.query(`
            INSERT INTO users (firstname, email, password)
            VALUES (?, ?, ?)`,
            [firstname, email, password]
        );
        console.log('User inserted successfully:', result);
        return result;
    } catch (error) {
        console.error('Error in createUser:', error);
        throw error;
    }
}

export { pool };