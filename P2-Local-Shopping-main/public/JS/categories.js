// Categories.js

// Define a constant for the base URL based on the environment (local or server)
if (typeof baseUrl === 'undefined') {
    var baseUrl = window.location.origin.includes('localhost') ? '' : '/node9';
}

// getting categories from app.js
async function fetchCategories() {
    try {
        const response = await fetch(`${baseUrl}/categories`);
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const categoryList = await response.json();
        console.log('Fetched categories:', categoryList);

        showCategories(categoryList); // shows categories in HTML
    } catch (error) {
        console.error('Error loading categories:', error);
        alert('Could not load categories. Please try again later.');
    }
}

// shows categories in HTML
function showCategories(categoryList) {
    const sortedList = sortByParent(categoryList); // sorts categories
    const container = document.getElementById('category-list');
    container.innerHTML = '';

    // Goes through the list and creates links for each category
    for (let i = 0; i < sortedList.length; i++) {
        const category = sortedList[i];

        const link = document.createElement('a');
        link.href = '#';
        link.textContent = category.Category_name;
        link.dataset.id = category.Category_ID;
        link.style.display = 'block';

        // click event for categories
        link.addEventListener('click', function (event) {
            event.preventDefault();

            const clickedId = parseInt(event.target.dataset.id);
            const leafIds = findLeafCategories(clickedId, categoryList); // finds leafs

            if (leafIds.length === 0) {
                alert('No products found.');
                return;
            }

            fetchProductsByCategory(leafIds); // gets products from database
        });

        container.appendChild(link);
    }
}

// puts catogories in a new list sorted by parent
function sortByParent(categoryList) {
    // sorted list
    const sorted = [];
    // used list
    const added = new Set();

    function addCategory(parent) {
        // checks if its added already
        if (added.has(parent.Category_ID)) return;

        // Adds the category
        sorted.push(parent);
        added.add(parent.Category_ID);

        // goes through all categories and checks if it is its parent and calls recursively
        for (let i = 0; i < categoryList.length; i++) {
            const item = categoryList[i];
            if (item.Parent_ID === parent.Category_ID) {
                addCategory(item); // Recursive call
            }
        }
    }

    // finds all categories without a parent and calls addCategory
    for (let i = 0; i < categoryList.length; i++) {
        const item = categoryList[i];
        if (item.Parent_ID === null) {
            addCategory(item);
        }
    }

    return sorted;
}

// finds leaf categories (those without children) recursively
function findLeafCategories(startId, categoryList) {
    const result = [];

    function addLeaf(id) {
        let isLeaf = true;

        // checks if the category has children
        for (let i = 0; i < categoryList.length; i++) {
            const item = categoryList[i];
            if (item.Parent_ID === id) {
                isLeaf = false;
                addLeaf(item.Category_ID); // calls recursively for children
            }
        }

        // if it is a leaf category, add it to the result
        if (isLeaf) {
            result.push(id);
        }
    }

    addLeaf(startId); // stars from the clicked category
    return result;
}

// gets products from backend with multiple category IDs
function fetchProductsByCategory(categoryIds) {
    const query = categoryIds.join(',');

    fetch(`${baseUrl}/products/by-category?category_ids=${query}`)
        .then(res => res.json())
        .then(showProducts)
        .catch(err => {
            console.error(err);
            alert('Couldnt fetch products.');
        });
}

// shows products in HTML
function showProducts(productList) {
    const container = document.getElementById('product-list'); // finds the container for products
    container.innerHTML = ''; // empties the container

    if (productList.length === 0) {
        container.textContent = 'No products found.';
        return;
    }

    // Goes through each product and shows them
    for (let i = 0; i < productList.length; i++) {
        const product = productList[i];
        console.log('Rendering product for store:', product);

        const productDiv = document.createElement('div'); // creates a new div for each product
        productDiv.className = 'product'; // adds css
        productDiv.setAttribute('data-name', product.Product_name); // Saves productname as an atrribute
        productDiv.innerHTML = `
            <img id="${product.Product_ID}" src="${product.image}" alt="${product.Product_name}" onclick="redirectToProduct(this.id)">
            <div class="product-name">${product.Product_name}</div>
            <div class="product-location">${product.Description}</div>
        `;
        container.appendChild(productDiv);
    }
}

// Redirect to the product page when a product is clicked
function redirectToProduct(productId) {
    window.location.href = `${baseUrl}/Product/${productId}`;
}

// loads when the site is ready
document.addEventListener('DOMContentLoaded', () => {
    fetchCategories();
});
