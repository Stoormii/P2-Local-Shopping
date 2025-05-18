// This function is called when the user submits the search form or presses the search button
async function searchItems() {
    const searchBar = document.getElementById('searchBar');
    const query = searchBar.value.trim();

    if (query) {
        try {
            // Fetch search results from the backend
            const encodedQuery = encodeURIComponent(query);
            console.log('Sending search query:', query); // Debugging log
            const response = await fetch(`/search?q=${encodedQuery}`);

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
            <h3>${product.Product_name}</h3>
        `;
        resultsContainer.appendChild(productDiv);
    });
}
