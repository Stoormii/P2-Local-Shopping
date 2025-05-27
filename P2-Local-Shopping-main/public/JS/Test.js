
if (typeof baseUrl === 'undefined') {
    var baseUrl = window.location.origin.includes('localhost') ? '' : '/node9';
}
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
            cart = [];
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
        })       
        .catch(error => {
            console.error("Error reserving order:", error);
            alert("Could not reserve order. Please try again later.");
        });
});


