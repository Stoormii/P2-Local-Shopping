document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('searchInput');
    const productList = document.getElementById('productList');
    const productForm = document.getElementById('productForm');
    const modal = document.getElementById('productModal');
    const modalTitle = document.getElementById('modalTitle');
    const addProductBtn = document.getElementById('addProductBtn');
    const cancelBtn = document.getElementById('cancelBtn');

    
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
            const response = await fetch('/products');
            console.log('Response status:', response.status); // Log statuskoden
            if (!response.ok) {
                throw new Error(`Server returned status ${response.status}`);
            }
            const data = await response.json();
            console.log('Fetched products:', data); // Log dataen
            products = data; // Opdaterer den lokale `products`-variabel
            renderProducts();
        } catch (error) {
            console.log('Error updating products:', error);
            alert('Could not update products, try again later.');
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
    
        const productData = {
            Product_name: document.getElementById('productName').value,
            Category_Name: document.getElementById('productCategory').value,
            Store_Name: document.getElementById('productStore').value,
            Quantity: parseInt(document.getElementById('productStock').value),
            Description: document.getElementById('productDescription').value,
            Price: parseFloat(document.getElementById('productPrice').value),
            image: document.getElementById('productImage').value || null // Hvis billedet er valgfrit
        };
    
        try {
            let response;
            if (isEditing) {
                console.log('Editing product with ID:', currentProductId);
                // Send PUT-anmodning for at opdatere produktet
                response = await fetch(`/products/${currentProductId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(productData)
                });
            } else {
                // Send POST-anmodning for at oprette et nyt produkt
                response = await fetch('/add-product', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(productData)
                });
            }
    
            if (response.ok) {
                closeModal();
                location.reload(); // Genindlæs siden for at opdatere produktlisten
            } else {
                const error = await response.json();
                console.error('Server error:', error);
                alert('Kunne ikke gemme produktet: ' + error.message);
            }
        } catch (error) {
            console.error('Network error:', error);
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
            const response = await fetch(`/products/${productId}`, {
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

