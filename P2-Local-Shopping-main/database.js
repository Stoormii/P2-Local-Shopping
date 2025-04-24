// database.js
import mysql from 'mysql2/promise'; // Importerer mysql2 biblioteket for at bruge Promises
import fs from 'fs/promises'; // Importerer fs (file system) for at arbejde med filer asynkront
import dotenv from 'dotenv';
import path from 'path'; // Importerer path-modulet til at håndtere filstier
import { fileURLToPath } from 'url'; // Importerer fileURLToPath fra 'url' moduler til at håndtere URL'er som filer

dotenv.config();

// Får fat i filnavnet og stien til den nuværende fil
const __filename = fileURLToPath(import.meta.url); // Henter filens URL og konverterer den til en sti
const __dirname = path.dirname(__filename); // Får den aktuelle mappen (directory) hvor scriptet er placeret

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
  if (!process.env[env]) { // Hvis en af de nødvendige variabler ikke er defineret
    throw new Error(`Manglende miljøvariabel: ${env}`); // Kast en fejl og stop programmet
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
      connection = await pool.getConnection(); // Henter en forbindelse fra poolen
      const [testResult] = await connection.query('SELECT 1'); // Test for at sikre, at forbindelsen virker
      console.log('Databaseforbindelse succesfuld:', testResult); // Hvis det lykkes, betyder det, at forbindelsen virker

      console.log('Aktuelt forbundet til database:', (await connection.query('SELECT DATABASE()'))[0][0]); // Log hvilken database vi er forbundet til.

      // Finder stien til SQL-filen, der indeholder tabellernes oprettelsesscripts
      const sqlPath = path.join(__dirname, 'userdatabase.sql');
      console.log('Læser SQL-fil fra:', sqlPath); // Udskriv filstien, som bruges til at hente SQL-filen
      const sql = await fs.readFile(sqlPath, 'utf8'); // Læser SQL-filen som en tekststreng

      // Splitter SQL-filen op i individuelle SQL-kommandoer ved semikolon som separator
      const statements = sql.split(';').filter((stmt) => stmt.trim()); // Filtrerer tomme eller mellemrum ud
      for (const statement of statements) { // Itererer over hver SQL-kommando i filen
        if (statement.includes('CREATE TABLE')) { // Hvis SQL-kommandoen indeholder en CREATE TABLE erklæring
          const tableNameMatch = statement.match(/CREATE TABLE IF NOT EXISTS\s+`?(\w+)`?/i); // Forsøg at finde tabelnavnet i CREATE TABLE kommandoen
          if (tableNameMatch) {
            const tableName = tableNameMatch[1]; // Henter tabelnavnet fra matchen
            const exists = await tableExists(tableName); // Tjek om tabellen allerede findes
            if (!exists) {
              console.log(`Tabellen "${tableName}" findes ikke. Opretter...`);
              await connection.query(statement); // Opretter tabellen hvis den ikke findes
              console.log(`Tabellen "${tableName}" oprettet succesfuldt.`); // Logning, når tabellen er oprettet
            } else {
              console.log(`Tabellen "${tableName}" findes allerede. Springer over oprettelse.`); // Logning, hvis tabellen allerede findes
            }
          }
        }
      }

      // Henter og viser alle tabeller i den nuværende database
      const [tables] = await pool.query('SHOW TABLES');
      console.log('Nuværende tabeller i databasen:', tables); // Udskriver listen af tabeller i databasen
    } catch (error) {
      console.error('Fejl ved initialisering af databasen:', error); // Log fejl, hvis initialisering fejler
      throw error; 
    } finally {
      if (connection) connection.release(); // Sørg for, at forbindelsen frigives tilbage til poolen, uanset om der opstod fejl eller ej
    }
  }



// Kører databaseinitialisering ved scriptets opstart
initializeDatabase();


// Funktion til at hente alle brugere ud fra databasen
export async function getUsers() { 
    const[rows] = await pool.query("SELECT * FROM users") // SQL-Query for at hente alle brugere
    return rows                                           // Returnerer bugerne
}

(async () => {
    try {
        const [results] = await pool.query('SELECT 1');
        console.log('Database connection successful:', results);
    } catch (err) {
        console.error('Database connection failed:', err);
    }
})();

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
