// JS/searchbarre.js

// This function is called when the user submits the search form or presses the search button
function searchItems() {
    const searchBar = document.getElementById('searchBar');
    const query = searchBar.value.trim();
  
    if (query) {
      // Redirect to the search results page with the query as a URL parameter
      const encodedQuery = encodeURIComponent(query);
      window.location.href = `search-result.html?query=${encodedQuery}`;
    }
  }
