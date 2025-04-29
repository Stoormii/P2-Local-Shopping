document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('searchInput');
    const productList = document.getElementById('productList');
    const productForm = document.getElementById('productForm');
    const modal = document.getElementById('productModal');
    const modalTitle = document.getElementById('modalTitle');
    const addProductBtn = document.getElementById('addProductBtn');
    const cancelBtn = document.getElementById('cancelBtn');

    const baseUrl = window.location.origin.includes('localhost')
        ? '' // Lokalt miljø
        : '/node9'; // Servermiljø

    let products = [
        {
            Product_ID: 0,
            Product_name: 'Standard',
            Quantity: 0,
            Description: '',
            Price: '',
            image: '',
            Category_name:'',
            Store_Name:''
        }
    ];

    let currentProductId = null;
    let isEditing = false;

    async function fetchProducts() {
        try {
            const response = await fetch(`${baseUrl}/products`);
            console.log('Response status:', response.status);

            if (!response.ok) {
                throw new Error(`Server returned status ${response.status}`);
            }

            const data = await response.json();
            console.log('Fetched products:', data);
            products = data;
            renderProducts();
        } catch (error) {
            console.error('Error fetching products:', error);
            alert('Kunne ikke hente produkter. Tjek serveren eller prøv igen senere.');
        }
    }

    function init() {
        fetchProducts(); 
        setupEventListeners();
    }

    function renderProducts(filteredProducts = null) {
        const productsToRender = filteredProducts || products;
        productList.innerHTML = '';

        if (productsToRender.length === 0) {
            productList.innerHTML = '<p class="no-products">Ingen produkter fundet</p>';
            return;
        }

        productsToRender.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
            <img src="${product.image || 'img/default-image.jpg'}" alt="${product.Product_name}" class="product-image">
            <div class="product-info">
                <h3 class="product-title">${product.Product_name}</h3>
                <div class="product-price">${parseFloat(product.Price).toFixed(2)} DKK</div>
                <span class="product-category">${product.Category_name}</span>
                <div class="product-actions">
                    <button class="action-btn edit-btn" data-id="${product.Product_ID}">
                        <i class="fas fa-edit"></i> Rediger
                    </button>
                    <button class="action-btn delete-btn" data-id="${product.Product_ID}">
                        <i class="fas fa-trash"></i> Slet
                    </button>
                </div>
            </div>
        `;
            productList.appendChild(productCard);
        });

        setupProductActionListeners();
    }

    // Get category name from value
    function getCategoryName(categoryValue) {
        const categoryMap = {
            'tøj': 'Tøj',
            'drugs': 'Drugs',
            'andre': 'Andre'
        };
        return categoryMap[categoryValue] || 'Ukendt';
    }

    function setupEventListeners() {
        addProductBtn.addEventListener('click', () => {
            console.log('Tilføj produkt-knap blev trykket.');
            openModal();
        });

        cancelBtn.addEventListener('click', () => {
            closeModal();
        });

        // Close modal when clicking on the x button
        const closeBtn = document.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => {
            closeModal();
        });

        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeModal();
            }
        });

        productForm.addEventListener('submit', handleFormSubmit);
    }

    // Set up listeners for edit and delete buttons
    function setupProductActionListeners() {
        const editButtons = document.querySelectorAll('.edit-btn');
        const deleteButtons = document.querySelectorAll('.delete-btn');

        editButtons.forEach(button => {
            button.addEventListener('click', handleEditProduct);
        });

        deleteButtons.forEach(button => {
            button.addEventListener('click', handleDeleteProduct);
        });
    }
    //search funktion
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
    
        const filteredProducts = products.filter(product => {
            // Søg efter navn, kategori og beskrivelse
            return product.name.toLowerCase().includes(searchTerm) ||
                product.category.toLowerCase().includes(searchTerm) ||
                product.description.toLowerCase().includes(searchTerm) ||
                getCategoryName(product.category).toLowerCase().includes(searchTerm);
        });
    
        renderProducts(filteredProducts);
    });

    
     //Ændringer der skal laves i Valde´s kode ;) ;) ;) ;) 
     async function handleFormSubmit(event) {
        event.preventDefault();

        const imageUrl = document.getElementById('productImage').dataset.imageUrl || null;

        const productData = {
            Product_name: document.getElementById('productName').value,
            Category_Name: document.getElementById('productCategory').value,
            Store_Name: document.getElementById('productStore').value,
            Quantity: parseInt(document.getElementById('productStock').value),
            Description: document.getElementById('productDescription').value,
            Price: parseFloat(document.getElementById('productPrice').value),
            image: imageUrl, // Use the uploaded image URL
        };

        try {
            let response;
            if (isEditing) {
                response = await fetch(`${baseUrl}/products/${currentProductId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(productData),
                });
            } else {
                response = await fetch(`${baseUrl}/add-product`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(productData),
                });
            }

            if (response.ok) {
                closeModal();
                location.reload();
            } else {
                const error = await response.json();
                alert('Kunne ikke gemme produktet: ' + error.message);
            }
        } catch (error) {
            alert('Netværksfejl. Prøv igen senere.');
        }
    }

    // Handle edit product
    function handleEditProduct(event) {
        const button = event.target.closest('button');
        if (!button) {
            console.error('Kunne ikke finde knappen for redigering.');
            return;
        }
        const productId = button.dataset.id;
        const product = products.find(p => p.Product_ID == productId);
    
        if (!product) {
            console.error('Kunne ikke finde produktet.');
            return;
        }
    
        currentProductId = productId;
        isEditing = true;
    
        // Udfyld formularen med produktets data
        document.getElementById('productName').value = product.Product_name;
        document.getElementById('productCategory').value = product.Category_name;
        document.getElementById('productStore').value = product.Store_Name;
        document.getElementById('productStock').value = product.Quantity;
        document.getElementById('productDescription').value = product.Description;
        document.getElementById('productPrice').value = product.Price;
    
        modalTitle.textContent = 'Rediger produkt';
        openModal();
    }

    
    async function handleDeleteProduct(event) {
        const button = event.target.closest('button');
        if (!button) {
            console.error('Kunne ikke finde knappen for sletning.');
            return;
        }
        const productId = button.dataset.id;

        if (!confirm('Er du sikker på, at du vil slette dette produkt?')) {
            return; // Stop, hvis brugeren annullerer
        }

        try {
            const response = await fetch(`${baseUrl}/products/${productId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                alert('Produktet blev slettet!');
                location.reload(); // Genindlæs siden for at opdatere produktlisten
            } else {
                const error = await response.json();
                console.error('Server error:', error);
                alert('Kunne ikke slette produktet: ' + error.message);
            }
        } catch (error) {
            console.error('Network error:', error);
            alert('Netværksfejl. Prøv igen senere.');
        }
    }

    async function uploadImage(file) {
        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch(`${baseUrl}/upload-image`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                console.error('Response status:', response.status);
                throw new Error('Failed to upload image');
            }

            const data = await response.json();
            return data.imageUrl; // Returner den fulde URL
        } catch (error) {
            console.error('Image upload error:', error);
            alert('Kunne ikke uploade billedet. Prøv igen.');
            return null;
        }
    }

    document.getElementById('productImage').addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (file) {
            const imageUrl = await uploadImage(file);
            if (imageUrl) {
                document.getElementById('imagePreview').innerHTML = `<img src="${imageUrl}" alt="Preview" />`;
                document.getElementById('productImage').dataset.imageUrl = imageUrl; // Store the URL for later use
            }
        }
    });
    
    function openModal() {
        modal.style.display = 'flex';
    }

    function closeModal() {
        modal.style.display = 'none';
        productForm.reset();
        isEditing = false;
        currentProductId = null;
        modalTitle.textContent = 'Tilføj nyt produkt';
    }

    init();
});

// Sørg for, at API-ruterne er defineret før fallback-ruten
app.get('/products', async (req, res) => {
    console.log('GET /products route accessed');
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

// Fallback-rute skal være sidst
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