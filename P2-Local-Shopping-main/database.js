import mysql from 'mysql2'
import dotenv from 'dotenv'

// Indlæser variabler fra .env fil.
dotenv.config()

// Opretter forbindelse til MySQL-Databasen.
const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,           // Database host (f.eks. lokalhost)
    user: process.env.MYSQL_USER,           // Database brugernavn
    password: process.env.MYSQL_PASSWORD,   // Database adgangskode
    database: process.env.MYSQL_DATABASE    // Database navn
}).promise()

// Funktion til at hente alle brugere ud fra databasen
export async function getUsers() { 
    const[rows] = await pool.query("SELECT * FROM users") // SQL-Query for at hente alle brugere
    return rows                                           // Returnerer bugerne
}

// Funktion til at indsætte en ny bruger i databasen
export async function createUser(firstname, email, password) {
    try {
        const [result] = await pool.query(`
            INSERT INTO users (firstname, email, password)
            VALUES (?, ?, ?)`,
            [firstname, email, password]
        ); // Indsætter værdierne sikkert i databasen
        return result; // Returnerer kun resultatet
    } catch (error) {
        console.error('Error in createUser:', error);
        throw error; // Kaster fejlen videre for at blive håndteret i app.js
    }
}

export {pool} // Eksporterer poolen til brug i andre filer

//const result = await createUser('Mikkel','email@live.dk','123anc')
//console.log(result)