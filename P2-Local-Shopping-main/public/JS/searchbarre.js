// This function is called when the user submits the search form or presses the search button
async function searchItems() {
    const searchBar = document.getElementById('searchBar');
    const query = searchBar.value.trim();

    if (query) {
        try {
            const baseUrl = window.location.hostname === 'localhost' ? '' : '/node9'; 
            console.log('Base URL:', baseUrl); // Debugging log
            const encodedQuery = encodeURIComponent(query);
            console.log('Sending search query:', query); // Debugging log
            const response = await fetch(`${baseUrl}/search?q=${encodedQuery}`); 

            if (!response.ok) {
                throw new Error(`Server returned status ${response.status}`);
            }

            const products = await response.json();
            console.log('Search results:', products); // Debugging log
            renderSearchResults(products); // Call the render function to display the results
        } catch (error) {
            console.error('Error fetching search results:', error);
            alert('Could not fetch search results. Please try again later.');
        }
    } else {
        alert('Please enter a search query.');
    }
}
  
  
  // Function to render search results dynamically
  function renderSearchResults(products) {
    const resultsContainer = document.getElementById('results');
    if (!resultsContainer) {
        console.error("Results container not found in the DOM.");
        return;
    }

    resultsContainer.innerHTML = ''; // Clear previous results

    if (products.length === 0) {
        resultsContainer.innerHTML = '<p>No products found.</p>';
        return;
    }

    products.forEach(product => {
        const productDiv = document.createElement('div');
        productDiv.className = 'product-square';
        productDiv.innerHTML = `
                             <img class="product-image" id="${product.Product_ID}" src="${product.image}" alt="${product.Product_name}" onclick="redirect1(this.id)">
                <h3 class="product-name" onclick="redirect1(${product.Product_ID})">${product.Product_name}</h3>
        `;
        resultsContainer.appendChild(productDiv);
    });
}
