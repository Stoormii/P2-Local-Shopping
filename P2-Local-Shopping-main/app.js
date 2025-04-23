import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import { getUsers, createUser } from './database.js';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import { pool } from './database.js'; // Importer pool fra database.js
import multer from 'multer'; // Import multer for image uploads

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3399; // Matches mod_proxy.conf for /node9

const app = express();

app.use(express.json()); // Så vi kan bruge JSON-Data fra frontend
app.use(cors({
  origin: '*', // Tillader alle domæner (kan ændres til specifikt domæne)
}));

// Serve static files directly from the public directory
app.use(express.static(path.join(__dirname, 'public'), (req, res, next) => {
  console.log(`Static middleware accessed for: ${req.url}`);
  next();
}));

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'public/uploads')); // Save images in the 'public/uploads' folder
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    },
});
const upload = multer({ storage });

app.post('/upload-image', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const imageUrl = `/uploads/${req.file.filename}`; // Relative URL to the uploaded image
    res.status(200).json({ imageUrl });
});

// API-ruter (uden /node9 prefix, da reverse proxy fjerner det)
app.get('/users', async (req, res) => {
  try {
    const users = await getUsers();
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not fetch users" });
  }
});

app.post('/signup', async (req, res) => {
  console.log('Signup request received:', req.body);
  const { firstname, email, password } = req.body;

  if (!firstname || !email || !password) {
      console.log('Missing fields in request body');
      return res.status(400).json({ error: 'All fields are required' });
  }

  try {
      const hashedPassword = await bcrypt.hash(password, 10);
      console.log('Hashed password:', hashedPassword);
      const result = await createUser(firstname, email, hashedPassword);
      console.log('User created successfully:', result);
      res.status(201).json({ message: 'User created successfully!', userid: result.insertId });
  } catch (error) {
      console.error('Error during signup:', error);
      if (error.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({ error: 'Email already exists' });
      }
      res.status(500).json({ error: 'Could not create user' });
  }
});

app.post('/login', async (req, res) => {
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

    const user = rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Password validation result:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('Invalid credentials');
      return res.status(401).json({ error: "Invalid credentials" });
    }

    res.json({ message: "Login successful", user });
  } catch (error) {
    console.error('Error in /login route:', error);
    res.status(500).json({ error: "Could not login" });
  }
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
        res.status(200).json(products); // Returner JSON-data
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

// Fallback route for frontend - server signup.html hvis ingen af de øvrige ruter matches
app.get('*', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'signup.html');
    console.log(`Fallback route accessed for: ${req.url}, serving: ${filePath}`);
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error(`Error serving signup.html: ${err}`);
            res.status(404).send('File not found');
        }
    });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start server på 0.0.0.0 så den virker via reverse proxy
console.log("Port Value:", PORT);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});

const response = await fetch('http://localhost:3399/products');