// app.js
import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import session from 'express-session';
import MySQLStoreFactory from 'express-mysql-session';
import { getUsers, createUser } from './database.js';
import { createStore } from './database.js';
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
  
app.use(cors({
    origin: ['https://cs-25-sw-2-09.p2datsw.cs.aau.dk', 'http://localhost:3399'],
    credentials: true 
}));

const MySQLStore = MySQLStoreFactory(session);
const sessionStore = new MySQLStore({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
});

app.use(session({
    key: 'session_cookie_name', // Navnet på session-cookien
    secret: 'your_secret_key', // Hemmelig nøgle til at signere sessionen
    store: sessionStore, // Bruger MySQL som session store
    resave: false, // Gør ikke sessionen om, hvis den ikke er ændret
    saveUninitialized: false, // Gem ikke sessionen, før den er initialiseret
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // Sætter cookieens levetid til 1 dag
        secure: false, // False pga HTPP
        httpOnly: true, // Forhindrer adgang til cookien fra JavaScript
    },
}));

// Logger alle indgående anmodninger til fejlfinding
app.use((req, res, next) => {
    console.log(`Received ${req.method} request for ${req.url}`);
    next();
});

// Middleware til at håndtere base-URL
app.use('/node9/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Serverer statiske filer fra 'public'-mappen
app.use(express.static(path.join(__dirname, 'public'), (req, res, next) => {
    console.log(`Static middleware accessed for: ${req.url}`);
    next();
}));

app.use('/img', express.static(path.join(__dirname, 'public/img')));
app.use('/uploads', (req, res, next) => {
    console.log(`Static file request for: ${req.url}`);
    next();
}, express.static(path.join(__dirname, 'public/uploads')));

app.use('/css', express.static(path.join(__dirname, 'public/css')));

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

        req.session.user = {
        id: user.id,
        firstname: user.firstname,
        email: user.email
        };

        res.json({ message: 'Login successful', user });
    } catch (error) {
        console.error('Error in /login route:', error);
        res.status(500).json({ error: 'Could not login' });
    }
});

// Konfiguration af multer til filuploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'public/uploads')); // Gemmer logoer i 'public/uploads'
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const sanitizedFilename = file.originalname.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9.\-_]/g, '');
        cb(null, uniqueSuffix + '-' + sanitizedFilename);
    },
});
const upload = multer({ storage });

// API-rute til oprettelse af ny bruger
app.post(`${baseUrl}/store-signup`, upload.single('logo'), async (req, res) => {
    console.log('Store-Signup request received:', req.body);
    const { Store_name, Store_address, Store_description, email, password } = req.body;

    // Validerer at alle felter er udfyldt
    if (!Store_name || !Store_address || !Store_description || !email || !password) {
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

        // Håndter logo-upload
        let logoUrl = null;
        if (req.file) {
            logoUrl = `/node9/uploads/${req.file.filename}`; //URL til logoet
            console.log('Uploaded logo URL:', logoUrl);
        }
        // Opret butikken i databasen
        const result = await createStore(Store_name, Store_address, Store_description, email, hashedPassword, logoUrl);
        console.log('User created successfully:', result);
        res.status(201).json({ message: 'User created successfully!', userid: result.insertId });
    
    } catch (error) {
        console.error('Error during signup:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Email already exists' });
        }
            // Her fanger vi alle andre fejl
    return res.status(500).json({ 
        error: 'Could not create store', 
        details: error.message,
        stack: error.stack,
    });
    }
});

app.post('/storelogin', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const [rows] = await pool.query("SELECT * FROM Store WHERE email = ?", [email]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Store not found' });
        }

        const store = rows[0];
        const isPasswordValid = await bcrypt.compare(password, store.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        req.session.store = {
            id: store.Store_ID,
            storename: store.Store_name,
            email: store.email,
        };

        res.json({ message: 'Login successful', store: req.session.store });
    } catch (error) {
        console.error('Error in /storelogin route:', error);
        res.status(500).json({ error: 'Could not login' });
    }
});

app.get('/session', (req, res) => {
    if (req.session.user) {
        res.json({ LoggedIn: true, user: req.session.user });
    } else if (req.session.store) {
        res.json({ LoggedIn: true, store: req.session.store });
    } else {
        res.json({ LoggedIn: false });
    }
});

// API-rute til at logge ud
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({ error: 'Could not log out' });
        }
        res.clearCookie('session_cookie_name'); // matcher din session config
        res.json({ message: 'Logged out successfully' });
    });
});


// Serve the redirect.js file
app.get('/js/redirect.js', (req, res) => {
 res.sendFile(path.join(__dirname, 'redirect.js'));
});
// Route to serve item details - test af w
app.get('/Product/:ID', async (req, res) => {
 const ProductID = req.params.ID;


 try {
     // Increment the view counter for the product
    await pool.query("UPDATE Product SET views = views + 1 WHERE Product_ID = ?", [ProductID]);
   // Query the database for the item with the given ID
   const [rows] = await pool.query("SELECT * FROM Product WHERE Product_ID = ?", [ProductID]);


   if (rows.length === 0) {
     console.log(`Item with ID ${ProductID} not found`);
     return res.status(404).send("Item not found");
   }


   const item = rows[0];
// Fetch top products from the same store
   const [storeProducts] = await pool.query(
    "SELECT * FROM Product WHERE Store_ID = ? AND Product_ID != ? ORDER BY views DESC LIMIT 10",
    [item.Store_ID, ProductID]
);

// Fetch top products from the same category
const [categoryProducts] = await pool.query(
    "SELECT * FROM Product WHERE Category_ID = ? AND Product_ID != ? ORDER BY views DESC LIMIT 10",
    [item.Category_ID, ProductID]
);
// Dynamically generate the size selection HTML based on Product_ID
let sizeSelectionHTML = '';
   
if (item.Category_ID) {
    // Query to check if the category has a parent with Parent_ID = 1 and the parent itself has Parent_ID IS NULL
    const [categoryCheck] = await pool.query(
        `
        WITH RECURSIVE  category_path (Category_ID, Parent_ID) AS (
        SELECT Category_ID, Parent_ID
        FROM Categories 
        WHERE Category_ID = ? 

        UNION ALL

        SELECT c.Category_ID, c.Parent_ID
        FROM Categories c
        INNER JOIN category_path cp ON c.Category_ID = cp.Parent_ID
        )
        SELECT 1 FROM category_path c WHERE Category_ID = 1 LIMIT 1;
        `,
        [item.Category_ID]
    );

    if (categoryCheck.length > 0 ) { 
    sizeSelectionHTML = `

        <div class="form-group">
            <label for="productCategory">Size:</label>
            <select id="productCategory" required>
                <option value="">Choose Size</option>
                <option value="s">Small (S)</option>
                <option value="m">Medium (M)</option>
                <option value="l">Large (L)</option>
                <option value="xl">Extra Large (XL)</option>
            </select>
            <ul style="list-style: none; padding: 0;">
                <li><a href="#" class="btn">Fit</a></li> 
             </ul>
            
            
        </div>
    `;
}
}
// Generate HTML for the "Other products from the same store" carousel
const storeProductsHTML = storeProducts.map(product => `
    <div class="product">
        <img id="${product.Product_ID}" src="${product.image}" alt="${product.Product_name}" onclick="window.location.href='${product.Product_ID}'">
        <h2>${product.Product_name}</h2>
        <p><strong>Price: ${product.Price} DKK</strong></p>
<button 
                     class="btn addCart" 
                     data-id="${product.Product_ID}"
                     data-name="${product.Product_name}"
                     data-price="${product.Price}"
                     data-image="${product.image}"                    
                     data-store-id="${product.Store_ID}"
                     >Add to Order 
                     </button>    </div>
`).join('');

// Generate HTML for the "Similar items from the same category" carousel
const categoryProductsHTML = categoryProducts.map(product => `
    <div class="product">
        <img id="${product.Product_ID}" src="${product.image}" alt="${product.Product_name}" onclick="window.location.href='${product.Product_ID}'">
        <h2>${product.Product_name}</h2>
        <p><strong>Price: ${product.Price} DKK</strong></p>
<button 
                     class="btn addCart" 
                     data-id="${product.Product_ID}"
                     data-name="${product.Product_name}"
                     data-price="${product.Price}"
                     data-image="${product.image}"                    
                     data-store-id="${product.Store_ID}"
                     >Add to Order 
                     </button>    </div>
`).join('');

 // Dynamically render the HTML template with the item data
   const htmlContent = `
     <!DOCTYPE html>
     <html lang="en">
     <head>
         <meta charset="UTF-8">
         <title>${item.Product_name}</title>
         <link rel="stylesheet" href="https://cs-25-sw-2-09.p2datsw.cs.aau.dk/node9/css/Cart.css">
         <link rel="stylesheet" href="https://cs-25-sw-2-09.p2datsw.cs.aau.dk/node9/css/ValentinoStylesheet.css">
     </head>
     <body>
     <div class="main-container">
        <header class="topnav">
            <a class="active" href="https://cs-25-sw-2-09.p2datsw.cs.aau.dk/node9/frontpage.html">Shop Local</a>
            <a href="https://cs-25-sw-2-09.p2datsw.cs.aau.dk/node9/categories.html">Categories</a>
            <div class="icon-cart">
                <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 20">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 15a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm0 0h8m-8 0-1-4m9 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-9-4h10l2-7H3m2 7L3 4m0 0-.792-3H1"/>
                </svg>
                <span>0</span>
            </div>

            <div class="cartTab">
            <h1>Shopping Cart</h1>
            <div class="listCart"></div>
            <div class="btn">
                <button class="close">CLOSE</button>
                <button class="reserve" id="reserveButton">Reserve items</button>
            </div>
        </div>


           <div class="search-container">

                <form onsubmit="event.preventDefault(); searchItems();" class="search-form">
                    <button type="submit" class="search-button">🔍</button>
                    <input type="text" id="searchBar" class="search-input" placeholder="Search...">
                </form>
            </div>
            
            <div id="results" class="search-results"></div>
            <div class="account-dropdown">
                <button class="account-btn">
                    <img src="https://cs-25-sw-2-09.p2datsw.cs.aau.dk/node9/img/person_24dp_000000_FILL1_wght400_GRAD200_opsz24.png" alt="Account" width="35" height="35">
                </button>
                <div class="account-menu" id="account-menu">
                    <!--Bliver opdateret dunamisk i validation.js -->
                </div>
            </div>
                            

        </header>
        <script src="https://cs-25-sw-2-09.p2datsw.cs.aau.dk/node9/JS/Cart.js" defer></script>
        <script src="https://cs-25-sw-2-09.p2datsw.cs.aau.dk/node9/JS/searchbarre.js" defer></script>
                <script src="https://cs-25-sw-2-09.p2datsw.cs.aau.dk/node9/JS/Test.js" defer></script>
                <script src="https://cs-25-sw-2-09.p2datsw.cs.aau.dk/node9/JS/validation.js" defer></script>


             <div class="product">
  <div class="product-left">
    <img src="${item.image}" alt="${item.Product_name}">
  </div>
  <div class="product-right">
    <h1>${item.Product_name}</h1>
    <p><strong>Price: ${item.Price} DKK</strong></p>
    ${sizeSelectionHTML}
    <h2>Specifications:</h2>
    <ul>
      <li>${item.Description}</li>
    </ul>
    <button class="btn addCart" 
            data-id="${item.Product_ID}"
            data-name="${item.Product_name}"
            data-price="${item.Price}"
            data-image="${item.image}"                    
            data-store-id="${item.Store_ID}">
      Add to Order
    </button>
  </div>
</div>

          <div class="other-products">
                    <h1>Other products from the same store</h1>
                    <div class="products-container">
                        ${storeProductsHTML}
                    </div>
                </div>

                <div class="other-products">
                    <h1>Similar items from the same category</h1>
                    <div class="products-container">
                        ${categoryProductsHTML}
                    </div>
                </div>
</div>
     <script src="/JS/redirect.js"></script>
     </body>
     </html>
   `;


   res.send(htmlContent);
 } catch (error) {
   console.error(`Error fetching item with ID ${ProductID}:`, error);
   res.status(500).send("Internal Server Error");
 }
});

// Route to serve store details
// Funktionen til at vise Google API maps
app.get('/store/:id', async (req, res) => {
    const storeId = req.params.id;

    try {
        const [rows] = await pool.query("SELECT * FROM Store WHERE Store_ID = ?", [storeId]);

        if (rows.length === 0) {
            console.log(`Store with ID ${storeId} not found`);
            return res.status(404).send("Store not found");
        }

        const Store = rows[0];

        const apiKey = 'AIzaSyC4b-MK0S4IejMk4x8rRTJyVkTadnbh5rQ';
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(Store.Store_address)}&key=${apiKey}`;

        const geocodeResponse = await fetch(geocodeUrl);
        const geocodeData = await geocodeResponse.json();

        if (geocodeData.status !== 'OK' || !geocodeData.results.length) {
            console.error(`Geocoding API error: ${geocodeData.status}`);
            return res.status(400).send("Invalid address. Could not fetch coordinates for the store address.");
        }

        const location = geocodeData.results[0].geometry.location;

        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${Store.Store_name}</title>
    <link rel="stylesheet" href="/css/store-template.css">
    <style>
        #map {
            height: 400px;
            width: 50%;
            margin-top: 20px;
            align-items: center;
        }
    </style>
    <script>
        function initMap() {
            const storeLocation = { lat: ${location.lat}, lng: ${location.lng} };
            const map = new google.maps.Map(document.getElementById('map'), {
                zoom: 15,
                center: storeLocation,
            });
            new google.maps.Marker({
                position: storeLocation,
                map: map,
                title: "${Store.Store_name}",
            });
        }
    </script>
    <script async defer src="https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap"></script>
</head>
<body>
    <div class="store">
        <div class="text-container">
            <h1>${Store.Store_name}</h1>
            <p class="description">
            Description: ${Store.Store_description}</p>
            <p class="location"><strong>Location: ${Store.Store_address}</strong></p>
        </div>
        <img src="${Store.image}" alt="${Store.Store_name}">
    </div>
    <div id="map"></div>
</body>
</html>
`;

        res.send(htmlContent);
    } catch (error) {
        console.error(`Error fetching store with ID ${storeId}:`, error);
        res.status(500).send("Internal Server Error");
    }
});

// Route to get the top 10 products with the highest views
app.get('/top-products', async (req, res) => {
    try {
        // Query to fetch the top 10 products based on the views counter
        const [rows] = await pool.query("SELECT * FROM Product ORDER BY views DESC LIMIT 10");
        res.json(rows); // Send the products as JSON
    } catch (error) {
        console.error('Error fetching top products:', error);
        res.status(500).send("Internal Server Error");
    }
});

// Route to get the top 10 products for a specific store
app.get('/top-products/:storeId', async (req, res) => {
    const storeId = req.params.storeId; // Get the Store_ID from the URL parameter

    try {
        // Query to fetch the top 10 products from the specified store, ordered by views
        const [rows] = await pool.query(
            "SELECT * FROM Product WHERE Store_ID = ? ORDER BY views DESC LIMIT 10",
            [storeId]
        );

        res.json(rows); // Send the products as JSON
    } catch (error) {
        console.error(`Error fetching top products for store ${storeId}:`, error);
        res.status(500).send("Internal Server Error");
    }
});

// Route to get the top 10 products from same category
app.get('/top-products/:categoryId', async (req, res) => {
    const categoryId = req.params.categoryId; // Get the Store_ID from the URL parameter

    try {
        // Query to fetch the top 10 products from the specified store, ordered by views
        const [rows] = await pool.query(
            "SELECT * FROM Product WHERE Category_ID = ? ORDER BY views DESC LIMIT 10",
            [storeId]
        );

        res.json(rows); // Send the products as JSON
    } catch (error) {
        console.error(`Error fetching top products for store ${storeId}:`, error);
        res.status(500).send("Internal Server Error");
    }
});

//search route
app.get('/search', async (req, res) => {
    const searchQuery = req.query.q; // Get the search query from the URL parameter


    try {
        // Query the database for products matching the search query
        const [rows] = await pool.query(
            "SELECT * FROM Product WHERE Product_name LIKE ?",
            [`%${searchQuery}%`]
        );


        res.json(rows); // Send the matching products as JSON
    } catch (error) {
        console.error('Error searching for products:', error);
        res.status(500).send("Internal Server Error");
    }
});
// Route to add new orders
app.post('/Orders', async (req, res) => {
    const orders = req.body.Orders; // Retrieve the basket items from the request body
 
 
 
 
    try {
        // Step 1: Insert a single entry into the Orders table
        const insertOrderSQL = "INSERT INTO Orders (id) VALUES (?)";
        const [orderResult] = await pool.query(insertOrderSQL, [orders[0].id]); // Use the first item's `id` for the order
 
 
 
 
        const newOrderID = orderResult.insertId; // Get the newly created Order_ID
 
 
 
 
        // Step 2: Insert all items into the Order_product table with the same Order_ID
        const insertOrderProductSQL = "INSERT INTO Order_Product (Order_ID, Store_ID, Product_ID, Quantity) VALUES (?, ?, ?, ?)";
        for (let order of orders) {
            await pool.query(insertOrderProductSQL, [newOrderID, order.Store_ID, order.Product_ID, order.Quantity]);
        }
 
 
 
 
        res.json({ message: "Order added successfully!", Order_ID: newOrderID });
    } catch (error) {
        console.error("Error inserting order:", error);
        res.status(500).json({ error: "Database error!" });
    }
 });
// Route to get all orders for store - used in Orders.js for store
app.get('/Orders', async (req, res) => {
    if (!req.session.store) {
        return res.status(401).json({ message: "Not logged in as a store." });
    }

    const storeId = req.session.store.id; // Get the Store_ID of the logged-in store

    try {
        // Query to fetch orders that have products from the logged-in store
        const [rows] = await pool.query(
            `
            SELECT DISTINCT o.Order_id, o.id
            FROM Orders o
            JOIN Order_Product op ON o.Order_id = op.Order_id
            WHERE op.Store_id = ? AND op.STATUS = 'reserved'
            ORDER BY o.Order_id DESC
            `,
            [storeId]
        );

        if (rows.length === 0) {
            return res.json([]);
        }

        res.json(rows); // Send the filtered orders as JSON
    } catch (error) {
        console.error('Error fetching orders for store:', error);
        res.status(500).json({ message: 'Database error! Could not fetch orders.' });
    }
});

//route for getting order products
app.get('/OrderProducts/:Store_ID/:Order_ID', async (req, res) => {
    const { Store_ID, Order_ID } = req.params;


    try {
        // Query the database for products in the given store and order
        const [rows] = await pool.query(
            `SELECT op.*, p.Product_name, p.Price, p.image, s.Store_name
             FROM Order_Product op
             JOIN Product p ON op.Product_ID = p.Product_ID
             JOIN Store s ON op.Store_ID = s.Store_ID
             WHERE op.Store_ID = ? AND op.Order_ID = ?`,
            [Store_ID, Order_ID]
        );


        if (rows.length === 0) {
            return res.status(404).send("<h1>No products found for this store and order.</h1>");
        }


        // Generate HTML for the products
        const productsHTML = rows.map(product => `
            <div class="product">
                <img src="${product.image}" alt="${product.Product_name}" style="width: 150px; height: 150px;">
                <h2>${product.Product_name}</h2>
                <p>Price: ${product.Price} DKK</p>
                <p>Quantity: ${product.Quantity}</p>
                <button onclick="updateStatus(${product.Order_id}, ${product.Product_ID}, ${product.Store_ID}, this)">
                ${product.Status === 'picked_up' ? 'Picked up' : 'reserved'}
                </button>
            </div>
        `).join('');

        const StoreName = rows[0].Store_name;

        // Generate the full HTML template
        const htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Order Products</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 20px;
                        padding: 0;
                    }
                    .product {
                        border: 1px solid #ddd;
                        border-radius: 10px;
                        padding: 10px;
                        margin: 10px;
                        display: inline-block;
                        text-align: center;
                        width: 200px;
                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    }
                    .product img {
                        border-radius: 10px;
                        margin-bottom: 10px;
                    }
                </style>
            </head>
            <body>
            <nav class="navbar">
  <nav class="navbar">
  <ul class="nav-links left">
    <li><a href="StoreFrontPage.html" id="home-link">Home</a></li>
    <li><a href="Store-Admin.html" id="product-link">Products</a></li>
    <li><a href="salesprojekt.html" id="neworder-link">New orders</a></li>
  </ul>
  <ul class="nav-links right">
    <li><button id="logout-btn" class="logout-button">Logout</button></li>
  </ul>
</nav>
<script>
const navLinks = document.querySelectorAll('.nav-links a');


navLinks.forEach(link => {
link.addEventListener('click', () => {
 
  navLinks.forEach(nav => nav.classList.remove('active'));


 
  link.classList.add('active');
});
});</script>

                <h1>Products for ${StoreName}, Order ID: ${Order_ID}</h1>
                <div class="products-container">
                    ${productsHTML}


                </div>
 <script src="https://cs-25-sw-2-09.p2datsw.cs.aau.dk/node9/JS/updateStatus.js"></script>
<script src="https://cs-25-sw-2-09.p2datsw.cs.aau.dk/node9/JS/storefrontpage.js"></script>
            </body>
            </html>
        `;


        res.send(htmlContent); // Send the generated HTML as the response
    } catch (error) {
        console.error("Error fetching order products:", error);
        res.status(500).send("<h1>Database error! Could not fetch products.</h1>");
    }
});
// to change Status on button click
app.put('/OrderProducts/:Order_ID/:Product_ID/:Store_ID/status', async (req, res) => {
    const { Order_ID, Product_ID, Store_ID } = req.params;
    const { status } = req.body;

    try {
        const [result] = await pool.query(
            `UPDATE Order_Product
             SET Status = ?
             WHERE Order_id = ? AND Product_ID = ? AND Store_ID = ?`,
            [status, Order_ID, Product_ID, Store_ID]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "No matching record found." });
        }

        res.json({ message: "Status updated successfully." });
    } catch (error) {
        console.error("Error updating status:", error);
        res.status(500).json({ message: "Database error." });
    }
});
// Global fejlhåndtering
// Tilføjelse, for at tilføje produkter til databasen

// Tilføj produkt — automatisk knyttet til det loggede storeId
app.post('/add-product', async (req, res) => {
  // Tjek at butikken er logget ind
  if (!req.session.store) {
    return res.status(401).json({ message: 'Du skal være logget ind som butik.' });
  }

  const storeId = req.session.store.id;            // <-- her henter vi Store_ID
  const { Product_name, Category_ID, Quantity, Description, Price, image } = req.body;

  // Valider at de påkrævede felter er med
  if (!Product_name || !Category_ID || !Quantity || !Description || !Price) {
    return res.status(400).json({ message: 'Alle felter skal udfyldes.' });
  }

  try {
    // Giv createItem dit storeId i stedet for et navn
    const result = await createItem(
      Product_name,
      Category_ID,
      storeId,      
      Quantity,
      Description,
      Price,
      image
    );

    res.status(201).json({
      message: 'Produkt tilføjet succesfuldt.',
      productId: result.insertId
    });
  } catch (error) {
    console.error('Fejl ved tilføjelse af produkt:', error);
    res.status(500).json({ message: 'Kunne ikke tilføje produktet.' });
  }
});

//Route for products in storeadmin
app.get('/products', async (req, res) => {
    if (!req.session.store) {
        return res.status(401).json({ message: "Not logged in as a store." });
    }
    const storeId = req.session.store.id; // Get the Store_ID of the logged-in store

    try {
        console.log('Fetching products with LEFT JOIN...');
        const [products] = await pool.query(`
            SELECT p.Product_ID, p.Product_name, p.Quantity, p.Description, p.Price, p.image, p.Store_ID,
                   c.Category_name, s.Store_Name
            FROM Product p
            LEFT JOIN Categories c ON p.Category_ID = c.Category_ID
            LEFT JOIN Store s ON p.Store_ID = s.Store_ID
            WHERE p.Store_ID = ?
        `, [storeId]);
        console.log('Products fetched:', products);
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
  const {
    Product_name,
    Category_ID,    // nu ID og ikke Name
    Quantity,
    Description,
    Price,
    image
  } = req.body;

  // Valider at de påkrævede felter er med
  if (!Product_name || !Number.isInteger(Category_ID) || !Quantity || !Description || !Price) {
    return res.status(400).json({ message: 'Alle felter skal udfyldes korrekt.' });
  }

  try {
    // Udfør opdateringen med ID’er direkte
    const [result] = await pool.query(
      `UPDATE Product
         SET Product_name = ?,
             Category_ID  = ?,
             Quantity     = ?,
             Description  = ?,
             Price        = ?,
             image        = ?
       WHERE Product_ID = ?`,
      [Product_name, Category_ID, Quantity, Description, Price, image, productId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Produkt ikke fundet.' });
    }

    res.json({ message: 'Produkt opdateret.' });
  } catch (err) {
    console.error('Fejl ved opdatering af produkt:', err);
    res.status(500).json({ message: 'Kunne ikke opdatere produktet.' });
  }
});



app.post('/upload-image', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Bemærk ændringen fra /uploads/ til /node9/uploads/
        const imageUrl = `https://cs-25-sw-2-09.p2datsw.cs.aau.dk/node9/uploads/${req.file.filename}`;

        console.log('Generated image URL:', imageUrl); // (godt til debugging)
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

app.get('/store', async (req, res) => {
    try {
        console.log('Fetching stores from database...');
        const [store] = await pool.query(`
            SELECT store_ID, store_name, store_address, image
            FROM Store
        `);
        console.log('Stores fetched:', store); // Debug-log
        res.status(200).json(store);
    } catch (error) {
        console.error('Database error in /stores:', error);
        res.status(500).json({ message: 'Could not fetch stores.' });
    }
});

app.get('/categories', async (req, res) => {
    try {
        console.log('Fetching categories from database...');
        const [store] = await pool.query(`
            SELECT Category_ID, Category_name, Parent_ID
            FROM Categories
        `);
        console.log('categories fetched:', store); // Debug-log
        res.status(200).json(store);
    } catch (error) {
        console.error('Database error in /categories:', error);
        res.status(500).json({ message: 'Could not fetch categories.' });
    }
});

// Henter produkter baseret på én eller flere kategori-ID'er
app.get('/products/by-category', async (req, res) => {
    try {
        const ids = req.query.category_ids;

        if (!ids) {
            return res.status(400).json({ message: 'No category_ids provided' });
        }

        // Laver ID-strengen til en liste: "5,6,7" → [5, 6, 7]
        const idList = ids.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));

        if (idList.length === 0) {
            return res.status(400).json({ message: 'Invalid category_ids' });
        }

        // Bruges med parameter-binding (?) for sikkerhed
        const placeholders = idList.map(() => '?').join(',');
        const query = `
            SELECT * FROM Product
            WHERE Category_ID IN (${placeholders})
        `;

        const [products] = await pool.query(query, idList);

        res.status(200).json(products);
    } catch (error) {
        console.error('Fejl i /products/by-category:', error);
        res.status(500).json({ message: 'Kunne ikke hente produkter' });
    }
});
