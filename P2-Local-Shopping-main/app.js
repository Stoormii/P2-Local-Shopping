import express from 'express';
import cors from 'cors';
import { getUsers, createUser } from './database.js';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import {pool} from './database.js'; // Importer pool fra database.js

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json()); // Så vi kan bruge JSON-Data fra frontend
app.use(cors({
  origin: '*', // Tillader alle domæner (kan ændres til specifikt domæne)
}));         

// Server statiske filer fra public-mappen
app.use(express.static(path.join(__dirname, 'public')));

// Route til roden, der serverer signup.html fra public-mappen
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

app.get("/users", async (req, res) => {
  try {
    const users = await getUsers();
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not fetch users" });
  }
});

app.post("/signup", async (req, res) => {
  console.log('Request body:', req.body);
  const { firstname, email, password } = req.body;
  if (!firstname || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10); // Hash password before storing it in the database
    const result = await createUser(firstname, email, hashedPassword);
    res.status(201).json({ message: "User created successfully!", userid: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: "Email already exists" });
    }
    console.error(error);
    res.status(500).json({ error: "Could not create user" });
  }
});

app.post("/login", async (req, res) => {
  console.log('Login request body:', req.body);
  const { email, password } = req.body;

  if (!email || !password) {
    console.log('Missing email or password in request body');
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    console.log('Database query result:', rows);

    if (rows.length === 0) {
      console.log('User not found in database');
      return res.status(404).json({ error: "User not found" });
    }

    const user = rows[0]; // Få den første bruger fra resultaterne
    console.log('User found:', user);

    // Check if the password is correct
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Password validation result:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('Invalid credentials');
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Hvis login er successful
    res.json({ message: "Login successful", user });
  } catch (error) {
    console.error('Error in /login route:', error);
    res.status(500).json({ error: "Could not login" });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(8080, () => {
  console.log('Server is running on port 8080');
});


// Tilføjelse, for at tilføje produkter til databasen
import { createItem } from './database.js';

app.post('/add-product', async (req, res) => {
    const { Product_name, Category_Name, Store_Name, Quantity, Description, Price, image } = req.body;

    if (!Product_name || !Category_Name || !Store_Name || !Quantity || !Description || !Price) {
        return res.status(400).json({ message: 'All fields needs to be filled.' });
    }

    try {
        const result = await createItem(Product_name, Category_Name, Store_Name, Quantity, Description, Price, image);
        res.status(201).json({ message: 'Product added!', productId: result.insertId });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ message: 'Could not add item.' });
    }
});

app.get('/products', async (req, res) => {
    try {
        const [products] = await pool.query(`
            SELECT p.Product_ID, p.Product_name, p.Quantity, p.Description, p.Price, p.image, 
                   c.Category_name, s.Store_Name
            FROM Product p
            JOIN Categories c ON p.Category_ID = c.Category_ID
            JOIN Store s ON p.Store_ID = s.Store_ID
        `);
        res.status(200).json(products); // Sørg for at returnere status 200
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ message: 'Could not upload products.' });
    }
});

app.delete('/products/:id', async (req, res) => {
    const productId = req.params.id; // Hent produkt-ID fra URL'en

    try {
        const [result] = await pool.query(`
            DELETE FROM Product 
            WHERE Product_ID = ?;
        `, [productId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        res.status(200).json({ message: 'Product deleted successfully.' });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ message: 'Could not delete product.' });
    }
});

app.put('/products/:id', async (req, res) => {
    const productId = req.params.id;
    const { Product_name, Category_Name, Store_Name, Quantity, Description, Price, image } = req.body;

    if (!Product_name || !Category_Name || !Store_Name || !Quantity || !Description || !Price) {
        return res.status(400).json({ message: 'All fields need to be filled.' });
    }

    try {
        // Slå Category_ID op baseret på Category_Name
        const [categoryRows] = await pool.query(
            `SELECT Category_ID FROM Categories WHERE Category_name = ?`,
            [Category_Name]
        );
        if (categoryRows.length === 0) {
            return res.status(400).json({ message: `Category '${Category_Name}' not found.` });
        }
        const Category_ID = categoryRows[0].Category_ID;

        // Slå Store_ID op baseret på Store_Name
        const [storeRows] = await pool.query(
            `SELECT Store_ID FROM Store WHERE Store_Name = ?`,
            [Store_Name]
        );
        if (storeRows.length === 0) {
            return res.status(400).json({ message: `Store '${Store_Name}' not found.` });
        }
        const Store_ID = storeRows[0].Store_ID;

        // Udfør opdateringen
        const [result] = await pool.query(
            `
            UPDATE Product
            SET Product_name = ?, Category_ID = ?, Store_ID = ?, Quantity = ?, Description = ?, Price = ?, image = ?
            WHERE Product_ID = ?;
            `,
            [Product_name, Category_ID, Store_ID, Quantity, Description, Price, image, productId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        res.status(200).json({ message: 'Product updated successfully.' });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ message: 'Could not update product.' });
    }
});



