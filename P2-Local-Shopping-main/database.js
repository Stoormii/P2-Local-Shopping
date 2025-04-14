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







//Dette herunder er funktionen til at tilføje produkter til databasen, samt ændringerne til Valde´s kode.
// Hent Category_ID fra Categories-tabellen
export async function getCategoryIdByName(categoryName) {
    const [rows] = await pool.query(
        `SELECT Category_ID FROM Categories WHERE Category_name = ?`,
        [categoryName] // Brug kategoriens navn fra Valde´s funktion
    );
    return rows.length > 0 ? rows[0].Category_ID : null; // Returner ID, hvis fundet
}

// Hent Store_ID fra Store-tabellen
export async function getStoreIdByName(storeName) {
    const [rows] = await pool.query(
        `SELECT Store_ID FROM Store WHERE Store_Name = ?`,
        [storeName] // Brug butikkens navn fra Vald´s funktion
    );
    return rows.length > 0 ? rows[0].Store_ID : null; // Returner ID, hvis fundet
}

export async function createItem(Product_name, Category_Name, Store_Name, Quantity, Description, Price, image) {
    // Find Category_ID baseret på Category_Name
    const Category_ID = await getCategoryIdByName(Category_Name);
    if (!Category_ID) {
        throw new Error(`The category ${Category_Name} does not exist in the database.`);
    }

    // Find Store_ID baseret på Store_Name
    const Store_ID = await getStoreIdByName(Store_Name);
    if (!Store_ID) {
        throw new Error(`The store ${Store_Name} does not exist in the database.`);
    }

    // Indsæt produktet i databasen, med de fundne Category_ID og Store_ID
    const result = await pool.query(
        `
        INSERT INTO Product (Product_name, Category_ID, Store_ID, Quantity, Description, Price, image)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [Product_name, Category_ID, Store_ID, Quantity, Description, Price, image]
    );

    return result;
}
    //Ændringer der skal laves i Valde´s kode ;) ;) ;) ;) 
    async function handleFormSubmit(event) {
        event.preventDefault();
    
        // Hent indtastede data fra HTML-formular (Det butiken skriver ind)
        const productData = {
            Product_name: document.getElementById('productName').value,            
            Category_Name: document.getElementById('productCategory').value,      
            Store_Name: document.getElementById('productStore').value,            
            Quantity: parseInt(document.getElementById('productStock').value),    
            Description: document.getElementById('productDescription').value,     
            Price: parseFloat(document.getElementById('productPrice').value),     
            image: document.getElementById('productImage').value                  // URL til billede (Skal kigges yderligere på)
        };
    
        try {
            // Brug fetch til at sende POST-forespørgsel til serveren
            const response = await fetch('/products', { // Ved ikke helt hvad der skal stå her!!
                method: 'POST',                  
                headers: {
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify(productData) 
            });
    
            if (response.ok) {
                // Hvis produktet blev gemt i databasen
                closeModal();        
                renderProducts();    
            } else {
                console.error('Server returned an error:', response.statusText);
            }
        } catch (error) {
            console.error('Error submitting product:', error);
        }
    }
    