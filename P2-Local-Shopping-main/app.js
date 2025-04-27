// app.js
import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import { getUsers, createUser } from './database.js';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import { pool } from './database.js'; // Importerer databaseforbindelse
import multer from 'multer'; // Import multer for image uploads
import { initializeDatabase } from './database.js'; // Eksporter initializeDatabase fra database.js
import { createItem } from './database.js'; // Importer createItem-funktionen

// Konverterer filsti for ES-moduler
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3399; // Matches mod_proxy.conf for /node9

const baseUrl = process.env.BASE_URL || ''; // Brug miljøvariabel eller tom streng som standard

// Opretter Express-applikation
const app = express();

app.set('trust proxy', true); // Sørger for, at req.protocol respekterer X-Forwarded-Proto-headeren

// Middleware til at parse JSON-data fra frontend
app.use(express.json());

// CORS-konfiguration til at tillade anmodninger fra specifikt domæne
app.use(cors({
    origin: ['https://cs-25-sw-2-09.p2datsw.cs.aau.dk', 'http://localhost:3399'],
}));

// Logger alle indgående anmodninger til fejlfinding
app.use((req, res, next) => {
    console.log(`Received ${req.method} request for ${req.url}`);
    next();
});

// Middleware til at håndtere base-URL
app.use(baseUrl, express.static(path.join(__dirname, 'public')));

// Serverer statiske filer fra 'public'-mappen
app.use(express.static(path.join(__dirname, 'public'), (req, res, next) => {
    console.log(`Static middleware accessed for: ${req.url}`);
    next();
}));

app.use('/img', express.static(path.join(__dirname, 'public/img')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Håndter anmodninger til /favicon.ico
app.get('/favicon.ico', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'favicon.ico');
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error('Error serving favicon.ico:', err);
            res.status(404).end();
        }
    });
});

// API-rute til at hente alle brugere
app.get('/users', async (req, res) => {
    try {
        const users = await getUsers();
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Could not fetch users' });
    }
});

// API-rute til oprettelse af ny bruger
app.post('/signup', async (req, res) => {
    console.log('Signup request received:', req.body);
    const { firstname, email, password } = req.body;

    // Validerer at alle felter er udfyldt
    if (!firstname || !email || !password) {
        console.log('Missing fields in request body');
        return res.status(400).json({ error: 'All fields are required' });
    }

    // Validerer adgangskodelængde på serveren
    if (password.length < 8) {
        console.log('Password too short');
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    try {
        // Hash adgangskode
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('Hashed password:', hashedPassword);
        // Opret bruger i databasen
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

// API-rute til login
app.post('/login', async (req, res) => {
    console.log('Login request received:', req.body);
    const { email, password } = req.body;

    // Validerer at alle felter er udfyldt
    if (!email || !password) {
        console.log('Missing email or password in request body');
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        // Hent bruger fra databasen baseret på email
        const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
        console.log('Database query result:', rows);

        if (rows.length === 0) {
            console.log('User not found in database');
            return res.status(404).json({ error: 'User not found' });
        }

        const user = rows[0];
        // Valider adgangskode
        const isPasswordValid = await bcrypt.compare(password, user.password);
        console.log('Password validation result:', isPasswordValid);

        if (!isPasswordValid) {
            console.log('Invalid credentials');
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        res.json({ message: 'Login successful', user });
    } catch (error) {
        console.error('Error in /login route:', error);
        res.status(500).json({ error: 'Could not login' });
    }
});

// Global fejlhåndtering
// Tilføjelse, for at tilføje produkter til databasen

app.post('/add-product', async (req, res) => {
    const { Product_name, Category_Name, Store_Name, Quantity, Description, Price, image } = req.body;

    // Valider input
    if (!Product_name || !Category_Name || !Store_Name || !Quantity || !Description || !Price) {
        return res.status(400).json({ message: 'Alle felter skal udfyldes.' });
    }

    try {
        // Kald createItem-funktionen for at tilføje produktet til databasen
        const result = await createItem(Product_name, Category_Name, Store_Name, Quantity, Description, Price, image);
        res.status(201).json({ message: 'Produkt tilføjet succesfuldt.', productId: result.insertId });
    } catch (error) {
        console.error('Fejl ved tilføjelse af produkt:', error);
        res.status(500).json({ message: 'Kunne ikke tilføje produktet.' });
    }
});

app.get('/products', async (req, res) => {
    try {
        console.log('Fetching products from database...');
        const [products] = await pool.query(`
            SELECT p.Product_ID, p.Product_name, p.Quantity, p.Description, p.Price, p.image, 
                   c.Category_name, s.Store_Name
            FROM Product p
            JOIN Categories c ON p.Category_ID = c.Category_ID
            JOIN Store s ON p.Store_ID = s.Store_ID
        `);
        console.log('Products fetched:', products); // Debug-log
        res.status(200).json(products);
    } catch (error) {
        console.error('Database error in /products:', error);
        res.status(500).json({ message: 'Could not fetch products.' });
    }
});

app.delete('/products/:id', async (req, res) => {
    const productId = req.params.id;

    try {
        const [result] = await pool.query(
            `DELETE FROM Product WHERE Product_ID = ?`,
            [productId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Produktet blev ikke fundet.' });
        }

        res.status(200).json({ message: 'Produktet blev slettet.' });
    } catch (error) {
        console.error('Fejl ved sletning af produkt:', error);
        res.status(500).json({ message: 'Kunne ikke slette produktet.' });
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

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'public/uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const sanitizedFilename = file.originalname.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9.\-_]/g, '');
        cb(null, uniqueSuffix + '-' + sanitizedFilename);
    },
});
const upload = multer({ storage });

app.post('/upload-image', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // URL til at gemme billedet
        const imageUrl = `https://cs-25-sw-2-09.p2datsw.cs.aau.dk/uploads/${req.file.filename}`;
        console.log('Generated image URL:', imageUrl);

        res.status(200).json({ imageUrl });
    } catch (error) {
        console.error('Error in /upload-image route:', error);
        res.status(500).json({ message: 'Could not upload image' });
    }
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err.stack);
    res.status(500).send('Something broke!');
});

// Starter serveren på 0.0.0.0 for at fungere med reverse proxy
console.log('Port value:', PORT);

(async () => {
    try {
        console.log('Initialiserer databasen...');
        await initializeDatabase(); // Vent på, at databasen bliver initialiseret
        console.log('Databasen er initialiseret.');

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Fejl under databaseinitialisering:', error);
        process.exit(1); // Stop serveren, hvis initialisering fejler
    }
})();
