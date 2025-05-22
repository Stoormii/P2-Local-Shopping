// Store items in localStorage
/*const basketItems = [
    { Product_ID: 1, Store_ID: 1, id: 1, Quantity: 2 },
    { Product_ID: 2, Store_ID: 2, id: 1, Quantity: 1 },
    { Product_ID: 3, Store_ID: 1, id: 1, Quantity: 4 }
];

localStorage.setItem("basket", JSON.stringify(basketItems));

// Retrieve stored data and send to backend
const storedBasket = JSON.parse(localStorage.getItem("basket")) || [];
*/
//Skal nok bruge base url som i app.js/store-admin.js. dette sender bare items til backend og gemmer dem i databasen.
const baseUrl = window.location.origin.includes('localhost')
? '' // Lokalt miljø
: '/node9'; // Servermiljø
document.getElementById("reserveButton").addEventListener("click", function () {
    console.log("Reserve button clicked!"); // Debugging log

    const storedBasket = JSON.parse(localStorage.getItem("cart")) || []; // Retrieve basket from localStorage

    if (storedBasket.length === 0) {
        alert("Your basket is empty. Add items before reserving.");
        return;
    }

    console.log("Stored basket:", storedBasket); // Log the basket contents

    fetch(`${baseUrl}/Orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Orders: storedBasket }) // Send all items in the basket
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server returned status ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Order reserved successfully!", data);
            alert(`Your order has been reserved successfully! Order ID: ${data.Order_ID}`);
        })

 cart = [];
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
});
        
        .catch(error => {
            console.error("Error reserving order:", error);
            alert("Could not reserve order. Please try again later.");
        });
});


app.listen(3399, () => console.log("Server running on port 3399"));
//slut indsæt orders i databasen
