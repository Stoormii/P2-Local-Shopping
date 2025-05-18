// Store-Admin.js
let sessionStore = null;

document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('searchInput');
    const productList = document.getElementById('productList');
    const productForm = document.getElementById('productForm');
    const modal = document.getElementById('productModal');
    const modalTitle = document.getElementById('modalTitle');
    const addProductBtn = document.getElementById('addProductBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const logoutBtn = document.getElementById('logout-btn');

    const baseUrl = window.location.origin.includes('localhost')
        ? '' // Lokalt miljø
        : '/node9'; // Servermiljø

    let products = []; // Holder alle produkter hentet fra serveren
    let currentProductId = null; // ID på det produkt der redigeres
    let isEditing = false; // Flag om man er i redigeringstilstand

    async function fetchProducts() {
        try {
            const response = await fetch(`${baseUrl}/products`);
            if (!response.ok) throw new Error(`Server returned status ${response.status}`);
            const data = await response.json();
            products = data;
            renderProducts();
        } catch (error) {
            console.error('Error fetching products:', error);
            alert('Kunne ikke hente produkter. Tjek serveren eller prøv igen senere.');
        }
    }

    async function fetchSessionStore() {
    const res = await fetch(`${baseUrl}/session`);
    if (!res.ok) {
        throw new Error(`Kunne ikke hente session: ${res.status}`);
    }
    const data = await res.json();
    if (data.store) {
        sessionStore = data.store;
    } else {
        throw new Error('Ingen butik logget ind');
    }
}

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                const response = await fetch(`${baseUrl}/logout`, { method: 'POST' });
                if (response.ok) {
                    window.location.href = 'storelogin.html';
                } else {
                    alert('Kunne ikke logge ud.');
                }
            } catch (error) {
                console.error('Fejl ved logout:', error);
                alert('Noget gik galt under logout.');
            }
        });
    }

  async function init() {
    try {
        await fetchSessionStore();  // <- nyt
        await fetchProducts();
        setupEventListeners();
    } catch (err) {
        alert('Du skal være logget ind som butik for at redigere produkter.');
        console.error(err);
    }
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
                        <button class="action-btn edit-btn" data-id="${product.Product_ID}"><i class="fas fa-edit"></i> Rediger</button>
                        <button class="action-btn delete-btn" data-id="${product.Product_ID}"><i class="fas fa-trash"></i> Slet</button>
                    </div>
                </div>
            `;
            productList.appendChild(productCard);
        });

        setupProductActionListeners();
    }

    function getCategoryName(categoryValue) {
        const categoryMap = {
            'tøj': 'Tøj',
            'drugs': 'Drugs',
            'andre': 'Andre'
        };
        return categoryMap[categoryValue] || 'Ukendt';
    }

    function setupEventListeners() {
        addProductBtn.addEventListener('click', () => openModal());
        cancelBtn.addEventListener('click', () => closeModal());

        const closeBtn = document.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => closeModal());
        }

        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeModal();
            }
        });

        productForm.addEventListener('submit', handleFormSubmit);
    }

    function setupProductActionListeners() {
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', handleEditProduct);
        });

        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', handleDeleteProduct);
        });
    }

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredProducts = products.filter(product => {
            return product.Product_name.toLowerCase().includes(searchTerm) ||
                   product.Category_name.toLowerCase().includes(searchTerm) ||
                   product.Description.toLowerCase().includes(searchTerm);
        });
        renderProducts(filteredProducts);
    });

    async function handleFormSubmit(event) {
        event.preventDefault();

        const imageUrl = document.getElementById('productImage').dataset.imageUrl || null;
        const productData = {
            Product_name: document.getElementById('productName').value,
            Category_Name: document.getElementById('productCategory').value,
            Quantity: parseInt(document.getElementById('productStock').value),
            Description: document.getElementById('productDescription').value,
            Price: parseFloat(document.getElementById('productPrice').value),
            image: imageUrl,
        };

        try {
            const url = isEditing ? `${baseUrl}/products/${currentProductId}` : `${baseUrl}/add-product`;
            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });

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

    function handleEditProduct(event) {
        const productId = event.target.closest('button').dataset.id;
        const product = products.find(p => p.Product_ID == productId);
        if (!product) return;

        currentProductId = productId;
        isEditing = true;

        document.getElementById('productName').value = product.Product_name;
        document.getElementById('productCategory').value = product.Category_name;
        document.getElementById('productStock').value = product.Quantity;
        document.getElementById('productDescription').value = product.Description;
        document.getElementById('productPrice').value = product.Price;

        modalTitle.textContent = 'Rediger produkt';
        openModal();
    }

    async function handleDeleteProduct(event) {
        const productId = event.target.closest('button').dataset.id;
        if (!confirm('Er du sikker på, at du vil slette dette produkt?')) return;

        try {
            const response = await fetch(`${baseUrl}/products/${productId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                alert('Produktet blev slettet!');
                location.reload();
            } else {
                const error = await response.json();
                alert('Kunne ikke slette produktet: ' + error.message);
            }
        } catch (error) {
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

            if (!response.ok) throw new Error('Upload fejlede');
            const data = await response.json();
            return data.imageUrl;
        } catch (error) {
            alert('Kunne ikke uploade billedet.');
            return null;
        }
    }

    const productImageInput = document.getElementById('productImage');
    if (productImageInput) {
        productImageInput.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (file) {
                const imageUrl = await uploadImage(file);
                if (imageUrl) {
                    document.getElementById('imagePreview').innerHTML = `<img src="${imageUrl}" alt="Preview" />`;
                    productImageInput.dataset.imageUrl = imageUrl;
                }
            }
        });
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
