import mysql from 'mysql2'
import dotenv from 'dotenv'

// Indlæser variabler fra .env fil.
dotenv.config()

console.log('Database config:', {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
});


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

(async () => {
    try {
        const [results] = await pool.query('SELECT 1');
        console.log('Database connection successful:', results);
    } catch (err) {
        console.error('Database connection failed:', err);
    }
})();

// Funktion til at indsætte en ny bruger i databasen
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

export {pool} // Eksporterer poolen til brug i andre filer

//const result = await createUser('Mikkel','email@live.dk','123anc')
//console.log(result)

//Dette herunder er funktionen til at tilføje produkter til databasen, samt ændringerne til Valde´s kode.
// Get category ID from Categories table
export async function getCategoryIdByName(categoryName) {
    const [rows] = await pool.query(
        `SELECT Category_ID FROM Categories WHERE Category_name = ?`,
        [categoryName] // Use category name from Valde's function
    );
    return rows.length > 0 ? rows[0].Category_ID : null; // REt
}

// Get store ID from Store table
export async function getStoreIdByName(storeName) {
    const [rows] = await pool.query(
        `SELECT Store_ID FROM Store WHERE Store_Name = ?`,
        [storeName] // Brug butikkens navn fra Vald´s funktion
    );
    return rows.length > 0 ? rows[0].Store_ID : null; // Return ID, if found
}

export async function createItem(Product_name, Category_Name, Store_Name, Quantity, Description, Price, image) {
    // Find Category_ID based on Category_Name
    const Category_ID = await getCategoryIdByName(Category_Name);
    if (!Category_ID) {
        throw new Error(`Kategorien ${Category_Name} findes ikke i databasen.`);
    }

    // Find Store_ID based på Store_Name
    const Store_ID = await getStoreIdByName(Store_Name);
    if (!Store_ID) {
        throw new Error(`Butikken ${Store_Name} findes ikke i databasen.`);
    }

    // insert product into the database
    const [result] = await pool.query(
        `
        INSERT INTO Product (Product_name, Category_ID, Store_ID, Quantity, Description, Price, image)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [Product_name, Category_ID, Store_ID, Quantity, Description, Price, image]
    );

    return result;
}