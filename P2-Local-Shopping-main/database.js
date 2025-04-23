// database.js
import mysql from 'mysql2/promise'; // Importerer mysql2 biblioteket for at bruge Promises
import fs from 'fs/promises'; // Importerer fs (file system) for at arbejde med filer asynkront
import 'dotenv/config'; // Importerer dotenv konfigurationen, så miljøvariabler kan bruges
import path from 'path'; // Importerer path-modulet til at håndtere filstier
import { fileURLToPath } from 'url'; // Importerer fileURLToPath fra 'url' moduler til at håndtere URL'er som filer

// Får fat i filnavnet og stien til den nuværende fil
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Udskrivning af databasekonfigurationen, så man kan tjekke, hvad der bliver brugt
console.log('Database config:', {
    host: process.env.MYSQL_HOST || 'localhost', // Værtsadresse (default er localhost)
    user: process.env.MYSQL_USER || 'cs-25-sw-2-09@student.aau.dk', // Bruger (kommer fra miljøvariabler)
    password: process.env.MYSQL_PASSWORD || 'ye5n@8gKVdikj-NR', // Adgangskode (kommer fra miljøvariabler)
    database: process.env.MYSQL_DATABASE || 'cs_25_sw_2_09', // Databasenavn (kommer fra miljøvariabler)
});

// Opretter en MySQL forbindelse med en forbindelse pool
const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'cs-25-sw-2-09@student.aau.dk',
    password: process.env.MYSQL_PASSWORD || 'ye5n@8gKVdikj-NR',
    database: process.env.MYSQL_DATABASE || 'cs_25_sw_2_09',
    waitForConnections: true, // Vent på ledige forbindelser
    connectionLimit: 10, // Maksimalt 10 samtidige forbindelser
    queueLimit: 0, // Ubegrænset kø af ventende forbindelser
});

// Funktion til at tjekke, om en tabel findes i databasen
async function tableExists(tableName) {
    try {
        // Henter en forbindelse fra poolen
        const connection = await pool.getConnection();
        // Udfører en forespørgsel for at tjekke om tabellen eksisterer
        const [rows] = await connection.query(`
            SELECT COUNT(*) AS count 
            FROM information_schema.tables
            WHERE table_schema = ? AND table_name = ?`,
            [process.env.MYSQL_DATABASE, tableName] // Bruger den valgte database og tabellens navn
        );
        connection.release(); // Løslader forbindelsen tilbage til poolen
        return rows[0].count > 0; // Returnerer true, hvis tabellen findes, ellers false
    } catch (error) {
        console.error(`Error checking table "${tableName}" existence:`, error);
        return false;
    }
}

// Funktion til at initialisere databasen, oprette tabeller, hvis de ikke findes
async function initializeDatabase() {
    let connection;
    try {
        // Finder stien til SQL-filen, der indeholder tabellernes skabelon
        const sqlPath = path.join(__dirname, 'userdatabase.sql');
        console.log('Reading SQL file from:', sqlPath);
        // Læser SQL-filen asynkront
        const sql = await fs.readFile(sqlPath, 'utf8');
        console.log('SQL file loaded. Length:', sql.length);

        // Henter en forbindelse fra poolen
        connection = await pool.getConnection();

        // Ekstraherer tabelnavnene fra SQL-filen
        const tableNames = [...sql.matchAll(/CREATE TABLE IF NOT EXISTS\s+`?(\w+)`?/gi)].map(match => match[1]);
        console.log('Tables to check:', tableNames);

        // Tjekker hver tabel, om den findes, og opretter den, hvis ikke
        for (const tableName of tableNames) {
            const exists = await tableExists(tableName);
            if (!exists) {
                console.log(`Table "${tableName}" does not exist. Creating...`);
                // Hvis tabellen ikke findes, køres SQL-kommandoen for at oprette den
                await connection.query(sql);
                console.log(`Table "${tableName}" created successfully.`);
            } else {
                console.log(`Table "${tableName}" already exists. Skipping creation.`);
            }
        }

        // Henter en liste over alle tabeller i databasen
        const [tables] = await pool.query("SHOW TABLES");
        console.log('Current tables in DB:', tables);
    } catch (error) {
        console.error('Error initializing database:', error);
    } finally {
        if (connection) connection.release(); // Sørger for, at forbindelsen frigives til poolen
    }
}

// Kører databaseinitialisering ved scriptets opstart
initializeDatabase();

// Test af databaseforbindelse ved at sende en simpel forespørgsel
(async () => {
    try {
        const [results] = await pool.query('SELECT 1');
        console.log('Database connection successful:', results); // Hvis forespørgslen lykkes, betyder det, at forbindelsen virker
    } catch (err) {
        console.error('Database connection failed:', err); // Håndterer fejl, hvis forbindelsen fejler
    }
})();

// CRUD (Create, Read, Update, Delete) funktioner

// Funktion til at hente alle brugere fra databasen
export async function getUsers() {
    const [rows] = await pool.query('SELECT * FROM users');
    return rows; // Returnerer alle brugere som et array af rækker
}

// Funktion til at oprette en ny bruger i databasen
export async function createUser(firstname, email, password) {
    try {
        console.log('Inserting user into database:', { firstname, email });
        const [result] = await pool.query(`
            INSERT INTO users (firstname, email, password)
            VALUES (?, ?, ?)`, 
            [firstname, email, password]
        );
        console.log('User inserted successfully:', result);
        return result; // Returnerer resultatet af indsættelsen
    } catch (error) {
        console.error('Error in createUser:', error); // Håndterer fejl
        throw error; // Kaster fejlen videre, så den kan håndteres andetsteds
    }
}

// Eksportere poolen, så den kan bruges andre steder i applikationen
export { pool };
