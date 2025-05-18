// Store-Admin.js
const baseUrl = window.location.origin.includes('localhost')
  ? ''        // Lokalt
  : '/node9'; // Produktion

let sessionStore = null;
let products      = [];
let categories    = [];    // Alle kategorier (leaf)
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

    // Hent session
    async function fetchSessionStore() {
        const res = await fetch(`${baseUrl}/session`, { credentials: 'include' });
        if (!res.ok) throw new Error(`Kunne ikke hente session: ${res.status}`);
        const data = await res.json();
        if (!data.store) throw new Error('Ingen butik logget ind');
        sessionStore = data.store;
    }

    // Hent alle kategorier og filtrer dem til “leaf”
    async function loadCategories() {
        const res = await fetch(`${baseUrl}/categories`, { credentials: 'include' });
        if (!res.ok) throw new Error(`Status ${res.status} ved hent af kategorier`);
        const all = await res.json();
        // “Leaf” = dem der ikke er parent for nogen anden
        categories = all.filter(c =>
            !all.some(o => o.Parent_ID === c.Category_ID)
        );
        // Fyld dropdown
        categorySelect.innerHTML = `
            <option value="">Pick Category</option>
            ${categories.map(c =>
                `<option value="${c.Category_ID}">${c.Category_name}</option>`
            ).join('')}
        `;
    }

    // Hent produkter
    async function fetchProducts() {
        const res = await fetch(`${baseUrl}/products`, { credentials: 'include' });
        if (!res.ok) throw new Error(`Status ${res.status} ved hent af produkter`);
        products = await res.json();
        renderProducts();
    }

    // Tegn produkter
    function renderProducts(list = products) {
        productList.innerHTML = '';
        if (list.length === 0) {
            productList.innerHTML = '<p class="no-products">Ingen produkter fundet</p>';
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

    // Upload billede
    async function uploadImage(file) {
        const fd = new FormData();
        fd.append('image', file);
        const res = await fetch(`${baseUrl}/upload-image`, {
            method: 'POST', body: fd, credentials: 'include'
        });
        if (!res.ok) throw new Error('Upload fejlede');
        return (await res.json()).imageUrl;
    }

    // Håndter formular submit
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
            throw new Error(err.message || 'Ukendt fejl');
        }
        closeModal();
        await fetchProducts();
    }

    // Rediger produkt
    function handleEditProduct(e) {
        const id = e.target.dataset.id;
        const p  = products.find(x => x.Product_ID == id);
        if (!p) return;
        isEditing = true;
        currentProductId = id;
        modalTitle.textContent = 'Rediger produkt';
        document.getElementById('productName').value        = p.Product_name;
        categorySelect.value                                = p.Category_ID;
        document.getElementById('productStock').value       = p.Quantity;
        document.getElementById('productDescription').value = p.Description;
        document.getElementById('productPrice').value       = p.Price;
        openModal();
    }

    // Slet produkt
    async function handleDeleteProduct(e) {
        if (!confirm('Vil du virkelig slette dette produkt?')) return;
        const id = e.target.dataset.id;
        await fetch(`${baseUrl}/products/${id}`, {
            method: 'DELETE', credentials: 'include'
        });
        await fetchProducts();
    }

    // Åbn/luk modal
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


    // Setup knapper & upload‐lyttere
    function setupEventListeners() {
        addProductBtn.addEventListener('click', openModal);
        cancelBtn.addEventListener('click', closeModal);

        
        modal.addEventListener('click', e => {
            if (e.target === modal) closeModal();
        });

        // **Luk når man klikker på krydset**
        const closeBtn = modal.querySelector('.close-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', closeModal);
            } 
            
        productForm.addEventListener('submit', handleFormSubmit);
        // Logout‐knap
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                await fetch(`${baseUrl}/logout`, { method:'POST', credentials:'include' });
                window.location.href = 'storelogin.html';
            });
        }

        // Upload‐lytteren til billede
        const imgInput = document.getElementById('productImage');
        imgInput.addEventListener('change', async ev => {
            const url = await uploadImage(ev.target.files[0]);
            document.getElementById('imagePreview').innerHTML = `<img src="${url}" />`;
            imgInput.dataset.imageUrl = url;
        });

        // Søgefelt
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

    // Init — rækkefølgen er vigtig
    (async function init() {
        try {
            await fetchSessionStore();
            await loadCategories();
            await fetchProducts();
            setupEventListeners();
        } catch (err) {
            console.error(err);
            alert('Du skal være logget ind som butik.');
            window.location.href = 'storelogin.html';
        }
    })();

});  
