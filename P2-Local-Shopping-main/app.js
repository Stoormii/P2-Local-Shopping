import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import { getUsers, createUser } from './database.js';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import { pool } from './database.js'; // Importer pool fra database.js

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE_PATH = '/node9';
const PORT = process.env.PORT || 3399; // fallback hvis PORT ikke er sat i .env

const app = express();

app.use(express.json()); // Så vi kan bruge JSON-Data fra frontend
app.use(cors({
  origin: '*', // Tillader alle domæner (kan ændres til specifikt domæne)
}));

// API-ruter skal defineres før fallback-ruten for at undgå overskrivning
app.get(`${BASE_PATH}/users`, async (req, res) => {
  try {
    const users = await getUsers();
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not fetch users" });
  }
});

app.post(`${BASE_PATH}/signup`, async (req, res) => {
  console.log('Request body:', req.body);
  const { firstname, email, password } = req.body;
  if (!firstname || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
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

app.post(`${BASE_PATH}/login`, async (req, res) => {
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

// Server statiske filer fra public-mappen under /node9
app.use(BASE_PATH, express.static(path.join(__dirname, 'public')));

// Fallback route for frontend - server signup.html hvis ingen af de øvrige ruter matches
app.get(`${BASE_PATH}/*`, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'signup.html'));
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
