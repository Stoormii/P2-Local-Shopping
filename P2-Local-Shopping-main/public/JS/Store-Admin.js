// Store-Admin.js

// Global state
let sessionStore = null;
let products = [];         // Alle produkter fra serveren
let currentProductId = null;
let isEditing = false;
let categories = [];       // Alle kategorier fra serveren (kun “leaf”)

// Kør når DOM er klar
document.addEventListener('DOMContentLoaded', function () {
    const searchInput      = document.getElementById('searchInput');
    const productList      = document.getElementById('productList');
    const productForm      = document.getElementById('productForm');
    const modal            = document.getElementById('productModal');
    const modalTitle       = document.getElementById('modalTitle');
    const addProductBtn    = document.getElementById('addProductBtn');
    const cancelBtn        = document.getElementById('cancelBtn');
    const logoutBtn        = document.getElementById('logout-btn');
    const BASE_URL         = window.location.origin.includes('localhost') ? '' : '/node9';

    // 1) Hent og udfyld kategorier
    async function loadCategories() {
        try {
            const res = await fetch(`${baseUrl}/categories`, { credentials: 'include' });
            if (!res.ok) {
            // prøv at parse fejl-body
                let errBody;
                try { errBody = await res.json(); } catch(_){ errBody = await res.text(); }
                console.error('Kategorien fetch fejlede, body:', errBody);
                throw new Error(`Server returnerede status ${res.status}`);
            }
            categories = await res.json();         
        } catch (error) {
          console.error('Error fetching categories:', error);
          alert('Kunne ikke hente kategorier. Se konsollen for detaljer.');
        }
    }


    // 2) Hent butikkens session (skal være før overhovedet fetchProducts)
    async function fetchSessionStore() {
        const res = await fetch(`${BASE_URL}/session`, { credentials: 'include' });
        if (!res.ok) throw new Error(`Kunne ikke hente session: ${res.status}`);
        const data = await res.json();
        if (data.store) {
            sessionStore = data.store;
        } else {
            throw new Error('Ingen butik logget ind');
        }
    }

    // 3) Hent produkter
    async function fetchProducts() {
        try {
            const res = await fetch(`${BASE_URL}/products`, { credentials: 'include' });
            if (!res.ok) throw new Error(`Server returned status ${res.status}`);
            products = await res.json();
            renderProducts();
        } catch (error) {
            console.error('Error fetching products:', error);
            alert('Kunne ikke hente produkter. Prøv igen senere.');
        }
    }

    // 4) Opsæt knapper/interaktions-lyttere
    function setupEventListeners() {
        addProductBtn.addEventListener('click', openModal);
        cancelBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
        productForm.addEventListener('submit', handleFormSubmit);

        // Logout
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                await fetch(`${BASE_URL}/logout`, { method: 'POST', credentials: 'include' });
                window.location.href = 'storelogin.html';
            });
        }

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

    // 5) Tegn produkterne ud
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
                    <div>
                        <button class="edit-btn" data-id="${p.Product_ID}">Rediger</button>
                        <button class="delete-btn" data-id="${p.Product_ID}">Slet</button>
                    </div>
                </div>
            `;
            productList.appendChild(card);
        });
        // Tilføj lyttere til rediger/slet
        document.querySelectorAll('.edit-btn').forEach(b => b.addEventListener('click', handleEditProduct));
        document.querySelectorAll('.delete-btn').forEach(b => b.addEventListener('click', handleDeleteProduct));
    }

    // 6) Åbn/luk modal
    function openModal() {
        modal.style.display = 'flex';
        isEditing = false;
        currentProductId = null;
        modalTitle.textContent = 'Tilføj nyt produkt';
        productForm.reset();
    }
    function closeModal() {
        modal.style.display = 'none';
    }

    // 7) Håndter “submit” (opret/ændr)
    async function handleFormSubmit(e) {
        e.preventDefault();
        const imageUrl = document.getElementById('productImage').dataset.imageUrl || null;
        const payload = {
            Product_name:  document.getElementById('productName').value,
            Category_ID:   parseInt(document.getElementById('productCategory').value, 10),
            Quantity:      parseInt(document.getElementById('productStock').value, 10),
            Description:   document.getElementById('productDescription').value,
            Price:         parseFloat(document.getElementById('productPrice').value),
            image:         imageUrl,
        };
        const url    = isEditing ? `${BASE_URL}/products/${currentProductId}` : `${BASE_URL}/add-product`;
        const method = isEditing ? 'PUT' : 'POST';
        try {
            const res = await fetch(url, {
                method,
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                const { message } = await res.json();
                throw new Error(message);
            }
            closeModal();
            await fetchProducts();
        } catch (err) {
            alert('Kunne ikke gemme produkt: ' + err.message);
        }
    }

    // 8) Fyld modal med eksisterende data ved redigering
    function handleEditProduct(e) {
        const id = e.target.dataset.id;
        const p  = products.find(x => x.Product_ID == id);
        if (!p) return;
        isEditing = true;
        currentProductId = id;
        modalTitle.textContent = 'Rediger produkt';
        document.getElementById('productName').value        = p.Product_name;
        document.getElementById('productCategory').value    = p.Category_ID;
        document.getElementById('productStock').value       = p.Quantity;
        document.getElementById('productDescription').value = p.Description;
        document.getElementById('productPrice').value       = p.Price;
        openModal();
    }

    // 9) Slet produkt
    async function handleDeleteProduct(e) {
        if (!confirm('Vil du virkelig slette?')) return;
        const id = e.target.dataset.id;
        await fetch(`${BASE_URL}/products/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        await fetchProducts();
    }

    // 10) Upload billede
    async function uploadImage(file) {
        const fd = new FormData();
        fd.append('image', file);
        const res = await fetch(`${BASE_URL}/upload-image`, {
            method: 'POST', body: fd, credentials: 'include'
        });
        if (!res.ok) throw new Error('Upload fejlede');
        return (await res.json()).imageUrl;
    }
    // Lyttere til fil-input
    const imgInput = document.getElementById('productImage');
    if (imgInput) {
        imgInput.addEventListener('change', async ev => {
            const url = await uploadImage(ev.target.files[0]);
            document.getElementById('imagePreview').innerHTML = `<img src="${url}" />`;
            imgInput.dataset.imageUrl = url;
        });
    }

    // 11) Init — rækkefølgen er vigtig!
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
