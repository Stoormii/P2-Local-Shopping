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
                        <button class="edit-btn" data-id="${p.Product_ID}">Edit</button>
                        <button class="delete-btn" data-id="${p.Product_ID}">Delete</button>
                        <button class="quantity-btn" data-id="${p.Product_ID}">Quantity</button>
                    </div>
                </div>
            `;
            productList.appendChild(card);
        });
        document.querySelectorAll('.edit-btn').forEach(b => b.addEventListener('click', handleEditProduct));
        document.querySelectorAll('.delete-btn').forEach(b => b.addEventListener('click', handleDeleteProduct));
        document.querySelectorAll('.quantity-btn').forEach(b => b.addEventListener('click', handleSizes));
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

        // Fill form with product data
        document.getElementById('productName').value        = p.Product_name;
        categorySelect.value                                = p.Category_ID;
        document.getElementById('productDescription').value = p.Description;
        document.getElementById('productPrice').value       = p.Price;
        document.getElementById('productImage').dataset.imageUrl = p.image || '';

        document.getElementById('imagePreview').innerHTML = p.image
        ? `<img src="${p.image}" alt="Preview" />`
        : '';
        openModal(true);
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

    async function handleSizes(e) {
        const id = e.target.dataset.id;
        currentProductId = id;
        const modal = document.getElementById('quantityModal');
        const container = document.getElementById('sizeInputs');
        container.innerHTML = '';
        modal.style.display = 'flex';

        try {
            const res = await fetch(`${baseUrl}/product-sizes/${id}`, { credentials: 'include' });
            const sizes = await res.json();

            sizes.forEach(s => {
                const row = document.createElement('div');
                row.classList.add('size-row');
                row.innerHTML = `
                    <input type="text" class="size-input" value="${s.Size}" placeholder="Size">
                    <input type="number" class="quantity-input" value="${s.Quantity}" placeholder="Quantity" min="0">
                `;
                container.appendChild(row);
            });

            AddNewRow(container); // Adds empty row at the end
        } catch (err) {
            console.error('Error loading sizes:', err);
            AddNewRow(container); // Still add one row in case of error
        }
    }


    function AddNewRow(container) {
        const row = document.createElement('div');
        row.classList.add('size-row');

        row.innerHTML = `
            <input type="text" class="size-input" placeholder="Size">
            <input type="number" class="quantity-input" placeholder="Quantity" min="0">
        `;
        
        const sizeInput = row.querySelector('.size-input');
        const qtyInput = row.querySelector('.quantity-input');

        function checkAndAdd() {
            const filled = sizeInput.value.trim() || qtyInput.value.trim();
            const isLast = container.lastElementChild === row;
            if (filled && isLast) {
                AddNewRow(container);
            }
        }

        sizeInput.addEventListener('input', checkAndAdd);
        qtyInput.addEventListener('input', checkAndAdd);

        container.appendChild(row);
    }

    // Open/close modal
    function openModal(isEdit = false) {
        modal.style.display = 'flex';
        if (!isEdit) {
            productForm.reset(); // kun reset ved oprettelse
            document.getElementById('imagePreview').innerHTML = ''; // ryd preview
            modalTitle.textContent = 'Add new product';
            isEditing = false;
            currentProductId = null;
        }
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
        // Quantity modal: close button
const closeQuantityModal = document.getElementById('closeQuantityModal');
if (closeQuantityModal) {
    closeQuantityModal.addEventListener('click', () => {
        document.getElementById('quantityModal').style.display = 'none';
    });
}

        // Save sizes to backend
        const saveSizesBtn = document.getElementById('saveSizesBtn');
        if (saveSizesBtn) {
            saveSizesBtn.addEventListener('click', async () => {
                const rows = document.querySelectorAll('.size-row');
                const sizes = Array.from(rows).map(row => ({
                    size: row.querySelector('.size-input').value.trim(),
                    quantity: parseInt(row.querySelector('.quantity-input').value.trim(), 10)
                })).filter(entry => entry.size && !isNaN(entry.quantity));

                console.log('Sizes received:', sizes);

                const res = await fetch(`${baseUrl}/product-sizes/${currentProductId}`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sizes })
                });

                if (res.ok) {
                    alert('Sizes saved!');
                    document.getElementById('quantityModal').style.display = 'none';
                } else {
                    alert('Error saving sizes');
                }
    });
}
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
