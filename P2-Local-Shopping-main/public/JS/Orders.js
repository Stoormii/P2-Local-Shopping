const baseUrl = window.location.origin.includes('localhost')
? '' // Lokalt miljø
: '/node9'; // Servermiljø




// orders
async function fetchOrders() {
    try {
        const response = await fetch(`${baseUrl}/Orders`); // Fetch data from the backend
        if (!response.ok) {
            throw new Error(`Server returned status ${response.status}`);
        }


        const Orders = await response.json();
        console.log('Fetched orders:', Orders);
        renderOrders(Orders); // Call the render function to display the stores
    } catch (error) {
        console.error('Error fetching orders:', error);
        alert('Could not fetch orders. Please try again later.1');
    }
}


function renderOrders(Orders) {
    console.log('Rendering orders:', Orders); // Debugging log
    const carousel = document.getElementById('carouselx');
    carousel.innerHTML = '';


    if (Orders.length === 0) {
        carousel.innerHTML = '<p>No orders found.</p>';
        return;
    }


    Orders.forEach(Orders => {
        console.log('Rendering order:', Orders); // Debugging log
        const OrderDiv = document.createElement('div');
        OrderDiv.className = 'Orders';
        OrderDiv.setAttribute('data-name', Orders.Order_id);
        OrderDiv.innerHTML = `
            <img id=${Orders.Order_id} src="/img/Neworder.png" alt="${Orders.Order_id}" onclick="redirect3(this.id)">
            <div class="Order-number">Order number.${Orders.Order_id}</div>
<style>
    #statusBtn {
      padding: 10px 20px;
      font-size: 16px;
      cursor: pointer;
    }
  </style>
                <button id="statusBtn-${Orders.Order_id}">Reserved</button>




           
            `;
  const statusBtn = OrderDiv.querySelector(`#statusBtn-${Orders.Order_id}`);
            statusBtn.addEventListener("click", function () {
  if (statusBtn.innerText === "Reserved") {
    statusBtn.innerText = "Picked up";
  } else {
    statusBtn.innerText = "Reserved";
  }
});
        carousel.appendChild(OrderDiv);
    });
}
        carousel.appendChild(OrderDiv);
    });
}


document.addEventListener('DOMContentLoaded', fetchOrders);''


//Nedenfor er karussel til når man er inde i ordren

// Fetch the order products based on the selected order ID
async function fetchOrderProducts(Order_ID) {
    try {
        const response = await fetch(`${baseUrl}/OrderProducts/${Order_ID}`);
        if (!response.ok) {
            throw new Error(`Server returned status ${response.status}`);
        }

        const data = await response.json();
        console.log('Fetched order products:', data);

        if (data.products && data.products.length > 0) {
            renderOrderProducts(data.products); // Call the render function to display the products
        } else {
            alert('No products found for this order.');
        }
    } catch (error) {
        console.error('Error fetching order products:', error);
        alert('Could not fetch order products. Please try again later.');
    }
}


// Render the fetched products in a carousel
function renderOrderProducts(orderProducts) {
    console.log('Rendering order products:', orderProducts); // Debugging log
    const carousel = document.getElementById('carousely'); // Ensure this ID matches your HTML
    carousel.innerHTML = ''; // Clear existing content


    if (orderProducts.length === 0) {
        carousel.innerHTML = '<p>No products found for this order.</p>';
        return;
    }


    orderProducts.forEach(product => {
        console.log('Rendering product:', product); // Debugging log
        const productDiv = document.createElement('div');
        productDiv.className = 'OrderProduct';
        productDiv.setAttribute('data-name', product.Product_ID);
        productDiv.innerHTML = `
            <img id="${product.Product_ID}" src="${product.image}" alt="${product.Product_name}">
            <div class="Product-name">${product.Product_name}</div>
            <div class="Product-price">Price: ${product.Price} DKK</div>
            <div class="Product-quantity">Quantity: ${product.Quantity}</div>
        `;
        carousel.appendChild(productDiv);
    });
}



