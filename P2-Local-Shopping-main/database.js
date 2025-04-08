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
    return rows                                           // Returnerer brugere
}

// Funktion til at indsætte en ny bruger i databasen
export async function createUser(firstname, email, password){
    const result = await pool.query(`
    INSERT INTO users(firstname, email, password)
    VALUES(?,?,?)`,
     [firstname, email, password]) // Indsætter værdierne sikkert i databasen
    return result
}

// Funktion til at indsætte items i databasen (Skal ændres, når jeg har funktionen til at hente items)
// Skal ændres, så den kan hente fra en fil, når serveren er oppe og køre
export async function createItem(Product_name, Category_ID, Store_ID, Quantity, Description, Price, image) {
    const result = await pool.query(`
        INSERT INTO Products(Product_name, Category_ID, Store_ID, Quantity, Description, Price, image)
        VALUES(?,?,?,?,?,?,?)`,
    )
    return result
}

//Funktion til at lave en ordre (Skal ændres, når funktionen til at foretage køb er lavet)
export async function createOrder(Order_Date, Delivery_ID, Customer_ID, Order_Total) {
    const result = await pool.query(`
        INSERT INTO Orders(Order_Date, Delivery_ID, Customer_ID, Order_Total)
        VALUES(?,?,?,?)`,)
}

export {pool} // Eksporterer poolen til brug i andre filer

//const result = await createUser('Mikkel','email@live.dk','123anc')
//console.log(result)