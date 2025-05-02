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
            <img id=store.store_ID src="${store.image}" alt="${store.store_name}" onclick="redirect2(this.id)">
            <div class="shop-name">${store.store_name}</div>
            <div class="shop-location">${store.store_address}</div>`;
        carousel.appendChild(storeDiv);
    });
}

document.addEventListener('DOMContentLoaded', fetchStores);
