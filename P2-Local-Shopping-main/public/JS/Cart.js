let cart = JSON.parse(localStorage.getItem('cart')) || [];
const cartIconSpan = document.querySelector('.icon-cart span');
const listCartHTML = document.querySelector('.listCart');
const body = document.body;

let id = null;
//getting user id
async function fetchUserId() {
    try {
        const baseUrl = window.location.origin.includes('localhost') ? '' : '/node9';
        const response = await fetch(`${baseUrl}/session`);
        const data = await response.json();

        if (data.LoggedIn && data.user) {
             id = data.user.id; // Store the user ID globally
        } else {
            console.error('User not logged in.');
        }
    } catch (error) {
        console.error('Error fetching user ID:', error);
    }
}
// Toggle Cart Visibility and shows the cart when icon is clicked and close when close button is clicked
fetchUserId();

document.querySelector('.icon-cart').addEventListener('click', () => {
    body.classList.toggle('showCart');
});
document.querySelector('.cartTab .close').addEventListener('click', () => {
    body.classList.remove('showCart');
});


// Add to Cart 
document.body.addEventListener('click', (e) => {
    const btn = e.target.closest('.addCart');
    if (!btn) return;
    e.preventDefault();

    //Retrieve prodct data
    const productId = btn.dataset.id;
    const name = btn.dataset.name;
    const price = parseFloat(btn.dataset.price);
    const size = document.getElementById('productCategory')?.value || null;
    const image = btn.dataset.image || ''; 
    const storeId = btn.dataset.storeId;
    

    //add produt to cart and show cart
    addToCart(productId, name, price, image, storeId, id);
    body.classList.add('showCart');
});

// Cart Logic
function addToCart(productId, name, price, image, storeId, id) {
    // Check if the product already exists in the cart
    const existingItem = cart.find(item =>
        item.Product_ID == productId 

    );

    if (existingItem) {
        existingItem.Quantity++; //if found, increase quantity 
    } else {
        cart.push({ 
            Product_ID: productId,
            Store_ID: storeId,
            Quantity: 1,
            Name: name,
            Price: price,
            Image: image,  
            id: id,
        });
    }
    updateCart();
}

function updateCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
}

function renderCart() {
    listCartHTML.innerHTML = '';
    let totalQty = 0;

    cart.forEach(item => {
        totalQty += item.Quantity;
        const itemHTML = `
            <div class="item" data-id="${item.Product_ID}">
                <img src="${item.Image}" alt="${item.name}">
                <div>
                    <h3>${item.Name}</h3>
                    <div class="price">${(item.Price * item.Quantity).toFixed(2)} DKK</div>
                </div>
                <div class="Quantity">
                    <span class="minus">-</span>
                    <span>${item.Quantity}</span>
                    <span class="plus">+</span>
                </div>
            </div>
        `;
        listCartHTML.insertAdjacentHTML('beforeend', itemHTML);
    });

    cartIconSpan.textContent = totalQty;
}

// Adjustt quantities
listCartHTML.addEventListener('click', (e) => {
    const clickedItem = e.target.closest('.item');
    if (!clickedItem) return;

    const productId = clickedItem.dataset.id;
    const item = cart.find(i => i.Product_ID == productId);
    if (!item) return;

    if (e.target.classList.contains('plus'))  item.Quantity++;
    if (e.target.classList.contains('minus')) {
        item.Quantity--;
        if (item.Quantity <= 0) {
            cart = cart.filter(i => i !== item);
        }
    }
    updateCart();
});

renderCart();

