// Definerer en konstant BASE_URL baseret på miljøet (lokalt eller server)
// Hvis URL'en indeholder 'localhost', bruges en tom streng, ellers bruges '/node9'
/* const BASE_URL = window.location.origin.includes('localhost')
    ? '' // Lokalt miljø
    : '/node9'; // Servermiljø

const BASE_URL = window.location.origin.includes('localhost') */

const baseUrl = window.location.origin.includes('localhost')
? '' // Lokalt miljø
: '/node9'; // Servermiljø

async function fetchStores() {
    try {
        const response = await fetch(`${baseUrl}/store`); // Fetch data from the backend
        if (!response.ok) {
            throw new Error(`Server returned status ${response.status}`);
        }

        const stores = await response.json();
        console.log('Fetched stores:', stores);
        renderStores(stores); // Call the render function to display the stores
    } catch (error) {
        console.error('Error fetching stores:', error);
        alert('Could not fetch stores. Please try again later.');
    }
}

function renderStores(stores) {
    console.log('Rendering stores:', stores); // Debugging log
    const carousel = document.getElementById('carousel2');
    carousel.innerHTML = '';

    if (stores.length === 0) {
        carousel.innerHTML = '<p>No stores found.</p>';
        return;
    }

    stores.forEach(store => {
        console.log('Rendering store:', store); // Debugging log
        const storeDiv = document.createElement('div');
        storeDiv.className = 'Shops';
        storeDiv.setAttribute('data-name', store.store_name);
        storeDiv.innerHTML = `
            <img id=${store.store_ID} src="${store.image}" alt="${store.store_name}" onclick="redirect2(this.id)">
            <div class="shop-name">${store.store_name}</div>
            <div class="shop-location">${store.store_address}</div>`;
        carousel.appendChild(storeDiv);
    });
}

document.addEventListener('DOMContentLoaded', fetchStores);



//kopi af ovenstående for products

async function fetchTopProducts() {
    try {
        // Fetch the top 5 products from the backend
        const response = await fetch(`${baseUrl}/top-products`);
        if (!response.ok) {
            throw new Error(`Server returned status ${response.status}`);
        }

        const products = await response.json();
        console.log('Fetched top products:', products);
        renderTopProducts(products); // Call the render function to display the products
    } catch (error) {
        console.error('Error fetching top products:', error);
        alert('Could not fetch top products. Please try again later.');
    }
}

function renderTopProducts(products) {
    console.log('Rendering top products:', products); // Debugging log
    const carousel = document.getElementById('carousel');
    carousel.innerHTML = ''; // Clear existing content

    if (products.length === 0) {
        carousel.innerHTML = '<p>No products found.</p>';
        return;
    }

    products.forEach(product => {
        console.log('Rendering product:', product); // Debugging log
        const productDiv = document.createElement('div');
        productDiv.className = 'product';
        productDiv.setAttribute('data-name', product.Product_name);
        productDiv.innerHTML = `
            <img id=${product.Product_ID} src="${product.image}" alt="${product.Product_name}" onclick="redirectToProduct(this.id)">
            <div class="product-name">${product.Product_name}</div>
            <div class="product-location">${product.Description}</div>`;
        carousel.appendChild(productDiv);
    });
}

// Redirect to the product page when a product is clicked
function redirectToProduct(productId) {
    window.location.href = `${baseUrl}/Product/${productId}`;
}

// Fetch and render the top products when the page loads
document.addEventListener('DOMContentLoaded', fetchTopProducts);


//samme for store
async function fetchTopProductsForStore(storeId) {
    try {
        // Fetch the top 10 products for the specified store
        const response = await fetch(`${baseUrl}/top-products/${storeId}`);
        if (!response.ok) {
            throw new Error(`Server returned status ${response.status}`);
        }

        const products = await response.json();
        console.log(`Fetched top products for store ${storeId}:`, products);
        renderTopProductsForStore(products); // Call the render function to display the products
    } catch (error) {
        console.error(`Error fetching top products for store ${storeId}:`, error);
        alert('Could not fetch top products for the store. Please try again later.');
    }
}

function renderTopProductsForStore(products) {
    console.log('Rendering top products for store:', products); // Debugging log
    const carousel = document.getElementById('store-carousel'); // Ensure this ID exists in your HTML
    carousel.innerHTML = ''; // Clear existing content

    if (products.length === 0) {
        carousel.innerHTML = '<p>No products found for this store.</p>';
        return;
    }

    products.forEach(product => {
        console.log('Rendering product for store:', product); // Debugging log
        const productDiv = document.createElement('div');
        productDiv.className = 'product';
        productDiv.setAttribute('data-name', product.Product_name);
        productDiv.innerHTML = `
            <img id=${product.Product_ID} src="${product.image}" alt="${product.Product_name}" onclick="redirectToProduct(this.id)">
            <div class="product-name">${product.Product_name}</div>
            <div class="product-location">${product.Description}</div>`;
        carousel.appendChild(productDiv);
    });
}

// samme for category
async function fetchTopProductsForCategory(categoryId) {
    try {
        // Fetch the top 10 products for the specified category
        const response = await fetch(`${baseUrl}/top-products-category/${categoryId}`);
        if (!response.ok) {
            throw new Error(`Server returned status ${response.status}`);
        }

        const products = await response.json();
        console.log(`Fetched top products for category ${categoryId}:`, products);
        renderTopProductsForCategory(products); // Call the render function to display the products
    } catch (error) {
        console.error(`Error fetching top products for category ${categoryId}:`, error);
        alert('Could not fetch top products for the category. Please try again later.');
    }
}

function renderTopProductsForCategory(products) {
    console.log('Rendering top products for category:', products); // Debugging log
    const carousel = document.getElementById('category-carousel'); // Ensure this ID exists in your HTML
    carousel.innerHTML = ''; // Clear existing content

    if (products.length === 0) {
        carousel.innerHTML = '<p>No products found for this category.</p>';
        return;
    }

    products.forEach(product => {
        console.log('Rendering product for category:', product); // Debugging log
        const productDiv = document.createElement('div');
        productDiv.className = 'product';
        productDiv.setAttribute('data-name', product.Product_name);
        productDiv.innerHTML = `
            <img id=${product.Product_ID} src="${product.image}" alt="${product.Product_name}" onclick="redirectToProduct(this.id)">
            <div class="product-name">${product.Product_name}</div>
            <div class="product-location">${product.Description}</div>`;
        carousel.appendChild(productDiv);
    });
}
