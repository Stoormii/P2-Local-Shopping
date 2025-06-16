// Database.js
import mysql from 'mysql2/promise';// Importing mysql2 to handle MySQL database operations with promises
import fs from 'fs/promises'; // Import fs (file system) so that we can work with files asynchronous
import dotenv from 'dotenv';
import path from 'path'; // Importing path-module to hande filepaths
import { fileURLToPath } from 'url'; // Importing fileURLToPath from 'url' modules to handle URL's as files.

dotenv.config();
// Grab filename and directory name of the current file
const __filename = fileURLToPath(import.meta.url); // Gets the URL of the file an converts it as a path 
const __dirname = path.dirname(__filename); // Get the actual directory where the script is places.

// Prints out the databaseconfiguration to the console, so that we can se which databease is used.
console.log('Database config:', {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
});

//  Creates a MYSQL connections using pool.
const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true, // Wait for free connections.
    connectionLimit: 10, // Maximum of 10 connections at once. M
    queueLimit: 0, // Unlimited queue length for waiting connections.
});

// Validtate the ENV variables, so that we know that the database is configured correctly.
const requiredEnv = ['MYSQL_HOST', 'MYSQL_USER', 'MYSQL_PASSWORD', 'MYSQL_DATABASE'];
requiredEnv.forEach((env) => {
  if (!process.env[env]) { // Incsase the environment variable is not set
    throw new Error(`Manglende miljøvariabel: ${env}`); // Throw an error, so that we know which variable is missing.
  }
});


// Function to theck if a table exists in the database. 
async function tableExists(tableName) {
    try {
        // Grabs a connection from the pool
        const connection = await pool.getConnection();
        // Make a request to check if the table exists.
        const [rows] = await connection.query(`
            SELECT COUNT(*) AS count 
            FROM information_schema.tables
            WHERE table_schema = ? AND table_name = ?`,
            [process.env.MYSQL_DATABASE, tableName] // Use the chosen database and the tablename.
        );
        connection.release(); // Free the connection back to the pool
        return rows[0].count > 0; // If the table exists return true else return false. Returnerer true, hvis tabellen findes, ellers false
    } catch (error) {
        console.error(`Error checking table "${tableName}" existence:`, error);
        return false;
    }
}

// Function to intialise the database and create tables if they do not exist.
async function initializeDatabase() {
    let connection;
    try {
      connection = await pool.getConnection(); // Grab a connection from the pool
      const [testResult] = await connection.query('SELECT 1'); // Test the connection by running a simple query
      console.log('Databaseforbindelse succesfuld:', testResult); // If it s successful, log the result

      console.log('Aktuelt forbundet til database:', (await connection.query('SELECT DATABASE()'))[0][0]); // Log which database we are connected to

      // Find the path to the SQL file that contains the table creation scripts
      const sqlPath = path.join(__dirname, 'userdatabase.sql');
      console.log('Læser SQL-fil fra:', sqlPath); // Print the directorypath, thats used to grab the SQL-file
      const sql = await fs.readFile(sqlPath, 'utf8'); // Reading the SQL file as a string
      // Split the SQL file into individual SQL commands using semicolon as a separator
      const statements = sql.split(';').filter((stmt) => stmt.trim()); // Filter empty and space out
      for (const statement of statements) { // Iterates over each SQL-command in the file
        if (statement.includes('CREATE TABLE')) { // If the SQL-command includes CREATE TABLE statement
          const tableNameMatch = statement.match(/CREATE TABLE IF NOT EXISTS\s+`?(\w+)`?/i); // Find the tablename in CREATA TABLE
          if (tableNameMatch) {
            const tableName = tableNameMatch[1]; // Get the tablename from the match 
            const exists = await tableExists(tableName); // check of the table already exists
            if (!exists) {
              console.log(`Tabellen "${tableName}" findes ikke. Opretter...`);
              await connection.query(statement); // Creates table if it does not exist. 
              console.log(`Tabellen "${tableName}" oprettet succesfuldt.`); // Logging when the table is created
            } else {
              console.log(`Tabellen "${tableName}" findes allerede. Springer over oprettelse.`); // Logging if the table exists
            }
          }
        }
      }
      // Gets and displays all tables in the current database
      const [tables] = await pool.query('SHOW TABLES');
      console.log('Nuværende tabeller i databasen:', tables); // Prints all tables in the database.
    } catch (error) {
      console.error('Fejl ved initialisering af databasen:', error); // Log error if something goes wrong
      throw error; 
    } finally {
      if (connection) connection.release(); // Ensure that the connection is freed to the pool.
    }
  }
// Function to get all users out from the database
export async function getUsers() { 
    const[rows] = await pool.query("SELECT * FROM users") // SQL query to select all users from the users table
    return rows                                           // Return the rows, which contains all users
}

(async () => {
    try {
        const [results] = await pool.query('SELECT 1');
        console.log('Database connection successful:', results);
    } catch (err) {
        console.error('Database connection failed:', err);
    }
})();

// Function to create a new user in the database
export async function createUser(firstname, email, password) {
    try {
        console.log('Inserting user into database:', { firstname, email });
        const [result] = await pool.query(`
            INSERT INTO users (firstname, email, password)
            VALUES (?, ?, ?)`, 
            [firstname, email, password]
        );
        console.log('User inserted successfully:', result);
        return result; // Return the result of the query, which includes metadata such as insertId
    } catch (error) {
        console.error('Error in createUser:', error); // Handle error
        throw error; // Throw error to be handled by the caller
    }
}

// Export the pool for use in other modules
export { pool };

// Eksport initializeDatabase function to be used in other modules
export { initializeDatabase };
// The functionality beneath is to add products into the database,
// Get category ID from Categories table
export async function getCategoryIdByName(categoryName) {
    const [rows] = await pool.query(
        `SELECT Category_ID FROM Categories WHERE Category_name = ?`,
        [categoryName] // Use category name from Valde's function
    );
    return rows.length > 0 ? rows[0].Category_ID : null; // REt
}

export async function createItem(
  Product_name,
  Category_ID,
  Store_ID,      
  Description,
  Price,
  image
) {
// If the category was not found, throw an error to stop the operation
if (!Category_ID) {
  throw new Error(`Category '${Category_Name}' does not exist in the database.`);
}

  // Check if we have a valid Store_ID
  if (!Store_ID) {
    throw new Error(`Ingen gyldigt Store_ID modtaget.`);
  }

// Insert a new product into the Product table
const [result] = await pool.query(
  // SQL query with placeholders to safely insert values
  `INSERT INTO Product
     (Product_name, Category_ID, Store_ID, Description, Price, image)
   VALUES (?, ?, ?, ?, ?, ?)`,
  // The actual values to be inserted, in the same order as the columns above
  [Product_name, Category_ID, Store_ID, Description, Price, image]
);

// Return the result of the query, which includes metadata such as insertId
return result;
}

export async function createStore(Store_name, Store_address, Store_description, email, password, logoUrl) {
    try {
        console.log('Inserting store into database:', { Store_name, email });
        const [result] = await pool.query(`
            INSERT INTO Store (Store_name, Store_address, Store_description, email, password, image)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [Store_name, Store_address, Store_description, email, password, logoUrl]
        );
        console.log('Store inserted successfully:', result);
        return result;
    } catch (error) {
        console.error('Error in createStore:', error);
        throw error;
    }
}

// Function to get all sizes and quantities for a given product
export async function getProductSizes(productId) {
    try {
        const [rows] = await pool.query(
            `SELECT Size, Quantity FROM Product_Size WHERE Product_ID = ?`,
            [productId]
        );
        return rows; // Return all sizes for the specified product
    } catch (error) {
        console.error('Error in getProductSizes:', error); // Log error if something goes wrong
        throw error;
    }
}

// Function to save or update product sizes (insert if new, update if exists)
export async function saveProductSizes(productId, sizes) {
    const connection = await pool.getConnection(); // Grab a connection from the pool
    try {
        await connection.beginTransaction(); // Start transaction

        for (const { size, quantity } of sizes) {
            if (!size || isNaN(quantity)) continue; // Skip invalid rows

            await connection.query(
                `INSERT INTO Product_Size (Product_ID, Size, Quantity)
                 VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE Quantity = VALUES(Quantity)`,
                [productId, size, quantity]
            );
        }

        await connection.commit(); // Commit the transaction
    } catch (error) {
        await connection.rollback(); // Roll back on error
        console.error('Error in saveProductSizes:', error);
        throw error;
    } finally {
        connection.release(); // Always release connection
    }
}

// Function to delete empty sizes for a product
export async function deleteEmptySizes(productId) {
    try {
        await pool.query(
            `DELETE FROM Product_Size WHERE Product_ID = ? AND (Size = '' OR Quantity IS NULL OR Quantity = 0)`,
            [productId]
        );
    } catch (error) {
        console.error('Error in deleteEmptySizes:', error);
        throw error;
    }
}