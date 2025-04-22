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

//This function is used to redirect the user to the item page when they click on an image
function redirect1(imageId){
  window.location.href = `items/${imageId}`;
  }

// Route to serve item details - test af w
app.get('/item/:id', async (req, res) => {
  const itemId = req.params.id;

  try {
    // Query the database for the item with the given ID
    const [rows] = await pool.query("SELECT * FROM items WHERE item_id = ?", [itemId]);

    if (rows.length === 0) {
      console.log(`Item with ID ${itemId} not found`);
      return res.status(404).send("Item not found");
    }

    const item = rows[0];

    // Dynamically render the HTML template with the item data
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <title>${item.item_name}</title>
          <link rel="stylesheet" href="/css/lassemedhattenstyles.css">
      </head>
      <body>
          <div class="logo">
              <a href="frontpage.html"> <img src="img/logo.png" alt="vores logo"> </a>
          </div>

          <div class="product">
              <h1>${item.item_name}</h1>
              <img src="img/${item.item_picture}" alt="${item.item_name}">
              <p><strong>Price: ${item.item_price} DKK</strong></p>
              <div class="form-group">
                  <label for="productCategory">Size:</label>
                  <select id="productCategory" required>
                      <option value="">Choose Size</option>
                      <option value="s">Small (S)</option>
                      <option value="m">Medium (M)</option>
                      <option value="l">Large (L)</option>
                      <option value="xl">Extra Large (XL)</option>
                  </select>
                  <p><a href="Basket.html" class="btn">Add to Order</a></p>
              </div>
              <h2>Specifications:</h2>
              <ul style="list-style: none; padding: 0;">
                  <li><a href="#" class="btn">Fit</a></li>
                  <li><a href="#" class="btn">Other info</a></li>
              </ul>
          </div>

          <div class="other-products">
              <h1>Other products from...</h1>
              <div class="products-container">
                  <!-- Example of other products -->
                  <div class="product">
                      <img src="img/BlackShirt.jpg" alt="Black Shirt">
                      <h2>Another Black Shirt</h2>
                      <p><strong>Price: $99.99</strong></p>
                      <p><a href="#" class="btn">View</a></p>
                      <p><a href="#" class="btn">Add to Order</a></p>
                  </div>
              </div>
          </div>
      </body>
      </html>
    `;

    res.send(htmlContent);
  } catch (error) {
    console.error(`Error fetching item with ID ${itemId}:`, error);
    res.status(500).send("Internal Server Error");
  }
});


//This function is used to redirect the user to the store page when they click on an image
function redirect2(imageId){
  window.location.href = `store/${imageId}`;
  }

// Route to serve store details
app.get('/store/:id', async (req, res) => {
  const storeId = req.params.id; // Get the store ID from the URL parameter

  try {
    // Query the database for the store with the given ID
    const [rows] = await pool.query("SELECT * FROM store WHERE store_id = ?", [storeId]);

    if (rows.length === 0) {
      console.log(`Store with ID ${storeId} not found`);
      return res.status(404).send("Store not found");
    }

    const store = rows[0]; // Get the first row from the query result

    // Dynamically render the HTML template with the store data
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <title>${store.store_name}</title>
          <link rel="stylesheet" href="/css/lassemedhattenstyles.css">
      </head>
      <body>
          <div class="logo">
              <a href="frontpage.html"> <img src="img/logo.png" alt="Our logo"> </a>
          </div>

          <div class="store">
              <h1>${store.store_name}</h1>
              <img src="img/${store.store_image}" alt="${store.store_name}">
              <p><strong>Location: ${store.store_location}</strong></p>
              <p>${store.store_description}</p>
          </div>

          
      </body>
      </html>
    `;

    res.send(htmlContent);
  } catch (error) {
    console.error(`Error fetching store with ID ${storeId}:`, error);
    res.status(500).send("Internal Server Error");
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


