// database.js
import mysql from 'mysql2/promise'; // Importerer mysql2 biblioteket for at bruge Promises
import fs from 'fs/promises'; // Importerer fs (file system) for at arbejde med filer asynkront
import dotenv from 'dotenv';
import path from 'path'; // Importerer path-modulet til at håndtere filstier
import { fileURLToPath } from 'url'; // Importerer fileURLToPath fra 'url' moduler til at håndtere URL'er som filer

dotenv.config();

// Får fat i filnavnet og stien til den nuværende fil
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Udskrivning af databasekonfigurationen, så man kan tjekke, hvad der bliver brugt
console.log('Database config:', {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
});

// Opretter en MySQL forbindelse med en forbindelse pool
const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true, // Vent på ledige forbindelser
    connectionLimit: 10, // Maksimalt 10 samtidige forbindelser
    queueLimit: 0, // Ubegrænset kø af ventende forbindelser
});

// Valider miljøvariabler
const requiredEnv = ['MYSQL_HOST', 'MYSQL_USER', 'MYSQL_PASSWORD', 'MYSQL_DATABASE'];
requiredEnv.forEach((env) => {
  if (!process.env[env]) {
    throw new Error(`Manglende miljøvariabel: ${env}`);
  }
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
      connection = await pool.getConnection();
      const [testResult] = await connection.query('SELECT 1');
      console.log('Databaseforbindelse succesfuld:', testResult);
      console.log('Aktuelt forbundet til database:', (await connection.query('SELECT DATABASE()'))[0][0]);
  
      const sqlPath = path.join(__dirname, 'userdatabase.sql');
      console.log('Læser SQL-fil fra:', sqlPath);
      const sql = await fs.readFile(sqlPath, 'utf8');
      console.log('SQL-fil indlæst. Længde:', sql.length);
  
      const statements = sql.split(';').filter((stmt) => stmt.trim());
      for (const statement of statements) {
        if (statement.includes('CREATE TABLE')) {
          const tableNameMatch = statement.match(/CREATE TABLE IF NOT EXISTS\s+`?(\w+)`?/i);
          if (tableNameMatch) {
            const tableName = tableNameMatch[1];
            const exists = await tableExists(tableName);
            if (!exists) {
              console.log(`Tabellen "${tableName}" findes ikke. Opretter...`);
              await connection.query(statement);
              console.log(`Tabellen "${tableName}" oprettet succesfuldt.`);
            } else {
              console.log(`Tabellen "${tableName}" findes allerede. Springer over oprettelse.`);
            }
          }
        }
      }
  
      const [tables] = await pool.query('SHOW TABLES');
      console.log('Nuværende tabeller i databasen:', tables);
    } catch (error) {
      console.error('Fejl ved initialisering af databasen:', error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }



// Kører databaseinitialisering ved scriptets opstart
initializeDatabase();


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
