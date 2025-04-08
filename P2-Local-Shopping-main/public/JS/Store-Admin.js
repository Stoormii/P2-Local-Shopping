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
            id: 1,
            name: 'Trøje',
            price: 900.0,
            category: 'tøj',
            description: 'Den er sku okay',
            stock: 9999,
            image: ''
        },
        {
            id: 2,
            name: 'bukser',
            price: 199.5,
            category: 'tøj',
            description: 'Kan anbefale',
            stock: 8,
            image: ''
        }
    ];

    let currentProductId = null;
    let isEditing = false;

   
    function init() {
        renderProducts();
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
                <img src="${product.image}" alt="${product.name}" class="product-image">
                <div class="product-info">
                    <h3 class="product-title">${product.name}</h3>
                    <div class="product-price">${product.price.toFixed(2)} DKK</div>
                    <span class="product-category">${getCategoryName(product.category)}</span>
                    <div class="product-actions">
                        <button class="action-btn edit-btn" data-id="${product.id}">
                            <i class="fas fa-edit"></i> Rediger
                        </button>
                        <button class="action-btn delete-btn" data-id="${product.id}">
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

    
    function handleFormSubmit(event) {
        event.preventDefault();

        const name = document.getElementById('productName').value;
        const price = parseFloat(document.getElementById('productPrice').value);
        const category = document.getElementById('productCategory').value;
        const stock = parseInt(document.getElementById('productStock').value);
        const description = document.getElementById('productDescription').value;

        if (isEditing) {
            // Update existing product
            const product = products.find(p => p.id === currentProductId);
            product.name = name;
            product.price = price;
            product.category = category;
            product.stock = stock;
            product.description = description;
        } else {
            // Add new product
            const newProduct = {
                id: Date.now(),
                name,
                price,
                category,
                stock,
                description,
                image: ''
            };
            products.push(newProduct);
        }

        closeModal();
        renderProducts();
    }

    // Handle edit product
    function handleEditProduct(event) {
        const productId = parseInt(event.target.closest('button').dataset.id);
        const product = products.find(p => p.id === productId);

        currentProductId = productId;
        isEditing = true;

        document.getElementById('productName').value = product.name;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productCategory').value = product.category;
        document.getElementById('productStock').value = product.stock;
        document.getElementById('productDescription').value = product.description;

        modalTitle.textContent = 'Rediger produkt';
        openModal();
    }

    
    function handleDeleteProduct(event) {
        const productId = parseInt(event.target.closest('button').dataset.id);
        products = products.filter(p => p.id !== productId);
        renderProducts();
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

