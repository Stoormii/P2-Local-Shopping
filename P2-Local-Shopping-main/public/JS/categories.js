// Definerer en konstant BASE_URL baseret på miljøet (lokalt eller server)
// Hvis URL'en indeholder 'localhost', bruges en tom streng, ellers bruges '/node9'
/* const BASE_URL = window.location.origin.includes('localhost')
    ? '' // Lokalt miljø
    : '/node9'; // Servermiljø

const BASE_URL = window.location.origin.includes('localhost') */

if (typeof baseUrl === 'undefined') {
    var baseUrl = window.location.origin.includes('localhost') ? '' : '/node9';
}
// henterer kategorierne fra app.js

// henterer kategorierne fra app.js
async function fetchCategories() {
    try {
        const response = await fetch(`${baseUrl}/categories`);
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const categoryList = await response.json();
        console.log('Fetched categories:', categoryList);

        showCategories(categoryList); // viser dem på siden
    } catch (error) {
        console.error('Error loading categories:', error);
        alert('Could not load categories. Please try again later.');
    }
}

// viser kategorierne i HTML
function showCategories(categoryList) {
    const sortedList = sortByParent(categoryList); // sætter rækkefølgen parent → child
    const container = document.getElementById('category-list');
    container.innerHTML = '';

    // Går gennem listen og laver links
    for (let i = 0; i < sortedList.length; i++) {
        const category = sortedList[i];

        const link = document.createElement('a');
        link.href = '#'; // så siden ikke opdateres
        link.textContent = category.Category_name;
        link.dataset.id = category.Category_ID;
        link.style.display = 'block';

        // klik på kategori
        link.addEventListener('click', function (event) {
            event.preventDefault();

            const clickedId = parseInt(event.target.dataset.id);
            const leafIds = findLeafCategories(clickedId, categoryList); // finder leafs

            if (leafIds.length === 0) {
                alert('Ingen produkter fundet.');
                return;
            }

            fetchProductsByCategory(leafIds); // henter produkter
        });

        container.appendChild(link);
    }
}

// putter kategorierne i rækkefølge
function sortByParent(categoryList) {
    // sorterer kategorierne i en ny liste
    const sorted = [];
    // holder kun unikke navne og bruges til at holde styr på hvilke kategorier der er tilføjet
    const added = new Set();

    function addCategory(parent) {
        // Tjekker om den er tilføjet allerede
        if (added.has(parent.Category_ID)) return;

        // Tilføjer den 
        sorted.push(parent);
        added.add(parent.Category_ID);

        // Gennemgår alle kategorierne og tjekker om det er dens parent samt kalder rekursivt
        for (let i = 0; i < categoryList.length; i++) {
            const item = categoryList[i];
            if (item.Parent_ID === parent.Category_ID) {
                addCategory(item); // Rekursiv kald
            }
        }
    }

    // finder alle kategorier uden parent og kalder addCategory
    for (let i = 0; i < categoryList.length; i++) {
        const item = categoryList[i];
        if (item.Parent_ID === null) {
            addCategory(item);
        }
    }

    return sorted;
}

// finder leaf-kategorier (dem uden børn) rekursivt
function findLeafCategories(startId, categoryList) {
    const result = [];

    function addLeaf(id) {
        let isLeaf = true;

        // Tjekker om den har børn
        for (let i = 0; i < categoryList.length; i++) {
            const item = categoryList[i];
            if (item.Parent_ID === id) {
                isLeaf = false;
                addLeaf(item.Category_ID); // kalder på barnet
            }
        }

        // Hvis den ikke har børn er den et leaf
        if (isLeaf) {
            result.push(id);
        }
    }

    addLeaf(startId); // starter fra den klikkede kategori
    return result;
}

// henter produkter fra backend med flere kategori-id'er
function fetchProductsByCategory(categoryIds) {
    const query = categoryIds.join(','); // laver f.eks. "5,6,7"

    fetch(`${baseUrl}/products/by-category?category_ids=${query}`)
        .then(res => res.json())
        .then(showProducts)
        .catch(err => {
            console.error(err);
            alert('Kunne ikke hente produkter.');
        });
}

// viser produkterne på siden
function showProducts(productList) {
    const container = document.getElementById('product-list'); // Finder containeren i HTML
    container.innerHTML = ''; // Tømmer indholdet før nye produkter vises

    if (productList.length === 0) {
        container.textContent = 'Ingen produkter fundet.';
        return;
    }

    // Gennemgår hvert produkt og viser dem
    for (let i = 0; i < productList.length; i++) {
        const product = productList[i];
        console.log('Rendering product for store:', product); // Debug - viser hvilket produkt der vises

        const productDiv = document.createElement('div'); // Opretter en div til produktet
        productDiv.className = 'product'; // Tilføjer CSS-klasse
        productDiv.setAttribute('data-name', product.Product_name); // Gemmer produktnavn som attribut
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

// loader når siden starter
document.addEventListener('DOMContentLoaded', () => {
    fetchCategories();
});
