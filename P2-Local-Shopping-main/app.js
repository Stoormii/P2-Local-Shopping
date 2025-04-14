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