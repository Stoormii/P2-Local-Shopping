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

// Serve the redirect.js file
app.get('/js/redirect.js', (req, res) => {
 res.sendFile(path.join(__dirname, 'redirect.js'));
});
// Route to serve item details - test af w
app.get('/Product/:ID', async (req, res) => {
 const ProductID = req.params.ID;


 try {
   // Query the database for the item with the given ID
   const [rows] = await pool.query("SELECT * FROM Product WHERE Product_ID = ?", [ProductID]);


   if (rows.length === 0) {
     console.log(`Item with ID ${ProductID} not found`);
     return res.status(404).send("Item not found");
   }


   const item = rows[0];


 // Dynamically render the HTML template with the item data
   const htmlContent = `
     <!DOCTYPE html>
     <html lang="en">
     <head>
         <meta charset="UTF-8">
         <title>${item.Product_name}</title>
         <link rel="stylesheet" href="/css/lassemedhattenstyles.css">
     </head>
     <body>
         <div class="logo">
             <a href="/frontpage.html"> <img src="https://cs-25-sw-2-09.p2datsw.cs.aau.dk/node9/img/logo.png" alt="vores logo"> </a>
         </div>


         <div class="product">
             <h1>${item.Product_name}</h1>
            
             <img src="${item.image}" alt="${item.Product_name}">
             <p><strong>Price: ${item.Price} DKK</strong></p>
             <div class="form-group">
                 <label for="productCategory">Size:</label>
                 <select id="productCategory" required>
                     <option value="">Choose Size</option>
                     <option value="s">Small (S)</option>
                     <option value="m">Medium (M)</option>
                     <option value="l">Large (L)</option>
                     <option value="xl">Extra Large (XL)</option>
                 </select>
                 <p><a href="/Basket.html" class="btn">Add to Order</a></p>
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
       <div class="product">
           <img src="https://cs-25-sw-2-09.p2datsw.cs.aau.dk/node9/img/BlackShirt.jpg" alt="Black Shirt">
           <h2>Other Black Shirt</h2>
           <p><strong>Price: $99.99</strong></p>
           <p><a href="/IP2.html" class="btn">View</a></p>
           <p><a href="Basket.html" class="btn">Add to Order</a></p>
       </div>
      
       <div class="product">
           <img src="https://cs-25-sw-2-09.p2datsw.cs.aau.dk/node9/img/BlackShirt.jpg" alt="Black Shirt">
           <h2>Another Black Shirt</h2>
           <p><strong>Price: $99.99</strong></p>
           <p><a href="#" class="btn">View</a></p>
           <p><a href="#" class="btn">Add to Order</a></p>
       </div>
       <div class="product">
           <img src="https://cs-25-sw-2-09.p2datsw.cs.aau.dk/node9/img/BlackShirt.jpg" alt="Black Shirt">
           <h2>Another Black Shirt</h2>
           <p><strong>Price: $99.99</strong></p>
           <p><a href="#" class="btn">View</a></p>
           <p><a href="#" class="btn">Add to Order</a></p>
       </div>
     
      
   </div>
</div>






<div class="other-products">
   <h1>Similar items</h1>
   <div class="products-container">
       <div class="product">
           <img src="https://cs-25-sw-2-09.p2datsw.cs.aau.dk/node9/img/BlackShirt.jpg" alt="Black Shirt">
           <h2>Other Black Shirt</h2>
           <p><strong>Price: $99.99</strong></p>
           <p><a href="#" class="btn">View</a></p>
           <p><a href="#" class="btn">Add to Order</a></p>
       </div>
      
       <div class="product">
           <img src="https://cs-25-sw-2-09.p2datsw.cs.aau.dk/node9/img/BlackShirt.jpg" alt="Black Shirt">
           <h2>Another Black Shirt</h2>
           <p><strong>Price: $99.99</strong></p>
           <p><a href="#" class="btn">View</a></p>
           <p><a href="#" class="btn">Add to Order</a></p>
       </div>
       <div class="product">
           <img src="https://cs-25-sw-2-09.p2datsw.cs.aau.dk/node9/img/BlackShirt.jpg" alt="Black Shirt">
           <h2>Another Black Shirt</h2>
           <p><strong>Price: $99.99</strong></p>
           <p><a href="#" class="btn">View</a></p>
           <p><a href="#" class="btn">Add to Order</a></p>
       </div>
       <div class="product">
           <img src="https://cs-25-sw-2-09.p2datsw.cs.aau.dk/node9/img/BlackShirt.jpg" alt="Black Shirt">
           <h2>Another Black Shirt</h2>
           <p><strong>Price: $99.99</strong></p>
           <p><a href="#" class="btn">View</a></p>
           <p><a href="#" class="btn">Add to Order</a></p>
       </div>
       <div class="product">
           <img src="https://cs-25-sw-2-09.p2datsw.cs.aau.dk/node9/img/BlackShirt.jpg" alt="Black Shirt">
           <h2>Another Black Shirt</h2>
           <p><strong>Price: $99.99</strong></p>
           <p><a href="#" class="btn">View</a></p>
           <p><a href="#" class="btn">Add to Order</a></p>
       </div>
       <div class="product">
           <img src="https://cs-25-sw-2-09.p2datsw.cs.aau.dk/node9/img/BlackShirt.jpg" alt="Black Shirt">
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
   console.error(`Error fetching item with ID ${ProductID}:`, error);
   res.status(500).send("Internal Server Error");
 }
});








// Route to serve store details
app.get('/store/:id', async (req, res) => {
 const storeId = req.params.id; // Get the store ID from the URL parameter


 try {
   // Query the database for the store with the given ID
   const [rows] = await pool.query("SELECT * FROM Store WHERE Store_ID = ?", [storeId]);


   if (rows.length === 0) {
     console.log(`Store with ID ${storeId} not found`);
     return res.status(404).send("Store not found");
   }


   const Store = rows[0]; // Get the first row from the query result


   // Dynamically render the HTML template with the store data
   const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
   <meta charset="UTF-8">
   <title>${Store.Store_name}</title>
   <link rel="stylesheet" href="/css/store-template.css">
</head>
<body>
   <div class="logo">
       <a href="/frontpage.html"> <img src="https://cs-25-sw-2-09.p2datsw.cs.aau.dk/node9/img/logo.png" alt="Our logo"> </a>
   </div>
   <div class="store">
       <div class="text-container">
       <h1>${Store.Store_name}</h1>
       <p class="description">${Store.Store_description}</p>
       <p class="location"><strong>Location: ${Store.Store_address}</strong></p>
       </div>
       <img src="https://cs-25-sw-2-09.p2datsw.cs.aau.dk/node9/${Store.image}" alt="${Store.Store_name}">
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
