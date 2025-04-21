// app.js
import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import { getUsers, createUser } from './database.js';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import { pool } from './database.js'; // Importerer databaseforbindelse

// Konverterer filsti for ES-moduler
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Definerer port (brug miljøvariabel eller standard 3399)
const PORT = process.env.PORT || 3399;

// Opretter Express-applikation
const app = express();

// Middleware til at parse JSON-data fra frontend
app.use(express.json());

// CORS-konfiguration til at tillade anmodninger fra specifikt domæne
app.use(cors({
    origin: 'https://cs-25-sw-2-09.p2datsw.cs.aau.dk',
}));

// Logger alle indgående anmodninger til fejlfinding
app.use((req, res, next) => {
    console.log(`Received ${req.method} request for ${req.url}`);
    next();
});

// Serverer statiske filer fra 'public'-mappen
app.use(express.static(path.join(__dirname, 'public'), (req, res, next) => {
    console.log(`Static middleware accessed for: ${req.url}`);
    next();
}));

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

// Fallback-rute: Serverer signup.html for alle ikke-matchet GET-anmodninger
app.get('*', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'signup.html');
    console.log(`Fallback route accessed for: ${req.url}, serving: ${filePath}`);
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error('Error serving signup.html:', err);
            res.status(404).send('File not found');
        }
    });
});

// Global fejlhåndtering
app.use((err, req, res, next) => {
    console.error('Server error:', err.stack);
    res.status(500).send('Something broke!');
});

// Starter serveren på 0.0.0.0 for at fungere med reverse proxy
console.log('Port value:', PORT);
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});