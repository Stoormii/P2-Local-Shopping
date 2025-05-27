// Store-Admin.js
const baseUrl = window.location.origin.includes('localhost')
  ? ''        // Local
  : '/node9'; // Server

let sessionStore = null;
let products      = [];
let categories    = [];    // All categories (leaf)
let currentProductId = null;
let isEditing       = false;

document.addEventListener('DOMContentLoaded', function () {
    const searchInput   = document.getElementById('searchInput');
    const productList   = document.getElementById('productList');
    const productForm   = document.getElementById('productForm');
    const modal         = document.getElementById('productModal');
    const modalTitle    = document.getElementById('modalTitle');
    const addProductBtn = document.getElementById('addProductBtn');
    const cancelBtn     = document.getElementById('cancelBtn');
    const logoutBtn     = document.getElementById('logout-btn');
    const categorySelect= document.getElementById('productCategory');

    // Get session
    async function fetchSessionStore() {
        const res = await fetch(`${baseUrl}/session`, { credentials: 'include' });
        if (!res.ok) throw new Error(`Could not get session: ${res.status}`);
        const data = await res.json();
        if (!data.store) throw new Error('No stores logged in');
        sessionStore = data.store;
    }

    // Get all categories and filter to “leaf”
    async function loadCategories() {
        const res = await fetch(`${baseUrl}/categories`, { credentials: 'include' });
        if (!res.ok) throw new Error(`Status ${res.status} getting the categories`);
        const all = await res.json();
        // “Leaf” = categories without children
        categories = all.filter(c =>
            !all.some(o => o.Parent_ID === c.Category_ID)
        );
        // Fill dropdown
        categorySelect.innerHTML = `
            <option value="">Pick Category</option>
            ${categories.map(c =>
                `<option value="${c.Category_ID}">${c.Category_name}</option>`
            ).join('')}
        `;
    }

    // Get products
    async function fetchProducts() {
        const res = await fetch(`${baseUrl}/products`, { credentials: 'include' });
        if (!res.ok) throw new Error(`Status ${res.status} getting the products`);
        products = await res.json();
        renderProducts();
    }

    // Render products
    function renderProducts(list = products) {
        productList.innerHTML = '';
        if (list.length === 0) {
            productList.innerHTML = '<p class="no-products">No product found</p>';
            return;
        }
        list.forEach(p => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <img src="${p.image||'img/default-image.jpg'}" alt="${p.Product_name}" class="product-image">
                <div class="product-info">
                    <h3>${p.Product_name}</h3>
                    <div>${parseFloat(p.Price).toFixed(2)} DKK</div>
                    <span>${p.Category_name}</span>
                    <div class="actions">
                        <button class="edit-btn" data-id="${p.Product_ID}">Rediger</button>
                        <button class="delete-btn" data-id="${p.Product_ID}">Slet</button>
                    </div>
                </div>
            `;
            productList.appendChild(card);
        });
        document.querySelectorAll('.edit-btn').forEach(b => b.addEventListener('click', handleEditProduct));
        document.querySelectorAll('.delete-btn').forEach(b => b.addEventListener('click', handleDeleteProduct));
    }

    // Upload image
    async function uploadImage(file) {
        const fd = new FormData();
        fd.append('image', file);
        const res = await fetch(`${baseUrl}/upload-image`, {
            method: 'POST', body: fd, credentials: 'include'
        });
        if (!res.ok) throw new Error('Upload errorcode');
        return (await res.json()).imageUrl;
    }

    // Handles form submit 
    async function handleFormSubmit(e) {
        e.preventDefault();
        const imageUrl = document.getElementById('productImage').dataset.imageUrl || null;
        const payload = {
            Product_name: document.getElementById('productName').value,
            Category_ID:  parseInt(categorySelect.value, 10),
            Quantity:     parseInt(document.getElementById('productStock').value, 10),
            Description:  document.getElementById('productDescription').value,
            Price:        parseFloat(document.getElementById('productPrice').value),
            image:        imageUrl,
        };
        const url    = isEditing
            ? `${baseUrl}/products/${currentProductId}`
            : `${baseUrl}/add-product`;
        const method = isEditing ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Unknown error');
        }
        closeModal();
        await fetchProducts();
    }

    // Edit product 
    function handleEditProduct(e) {
        const id = e.target.dataset.id;
        const p  = products.find(x => x.Product_ID == id);
        if (!p) return;
        isEditing = true;
        currentProductId = id;
        modalTitle.textContent = 'Edit product';
        document.getElementById('productName').value        = p.Product_name;
        categorySelect.value                                = p.Category_ID;
        document.getElementById('productStock').value       = p.Quantity;
        document.getElementById('productDescription').value = p.Description;
        document.getElementById('productPrice').value       = p.Price;
        openModal();
    }

    // Delete product 
    async function handleDeleteProduct(e) {
        if (!confirm('Do you want to delete this product?')) return;
        const id = e.target.dataset.id;
        await fetch(`${baseUrl}/products/${id}`, {
            method: 'DELETE', credentials: 'include'
        });
        await fetchProducts();
    }

    // Open/close modal
    function openModal() {
        modal.style.display    = 'flex';
        isEditing              = false;
        currentProductId       = null;
        modalTitle.textContent = 'Add new product';
        productForm.reset();
    }
    function closeModal() {
        modal.style.display = 'none';
        productForm.reset();
        isEditing = false;
        currentProductId = null;
        modalTitle.textContent = 'Add new product';

    }


    // Setup buttons and upload‐listeners
    function setupEventListeners() {
        addProductBtn.addEventListener('click', openModal);
        cancelBtn.addEventListener('click', closeModal);

        
        modal.addEventListener('click', e => {
            if (e.target === modal) closeModal();
        });

        // Close when you click on the escape button
        const closeBtn = modal.querySelector('.close-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', closeModal);
            } 
            
        productForm.addEventListener('submit', handleFormSubmit);
        // Logout‐button
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                await fetch(`${baseUrl}/logout`, { method:'POST', credentials:'include' });
                window.location.href = 'storelogin.html';
            });
        }

        // Upload‐listeners for image
        const imgInput = document.getElementById('productImage');
        imgInput.addEventListener('change', async ev => {
            const url = await uploadImage(ev.target.files[0]);
            document.getElementById('imagePreview').innerHTML = `<img src="${url}" />`;
            imgInput.dataset.imageUrl = url;
        });

        // Search functionality
        searchInput.addEventListener('input', e => {
            const term = e.target.value.toLowerCase();
            const filtered = products.filter(p =>
                p.Product_name.toLowerCase().includes(term) ||
                p.Category_name.toLowerCase().includes(term) ||
                p.Description.toLowerCase().includes(term)
            );
            renderProducts(filtered);
        });
    }

    (async function init() {
        try {
            await fetchSessionStore();
            await loadCategories();
            await fetchProducts();
            setupEventListeners();
        } catch (err) {
            console.error(err);
            alert('You need to be logged in as a store.');
            window.location.href = 'storelogin.html';
        }
    })();

});  
