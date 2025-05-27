// updateStatus.js

// Function to update the status of an order product
async function updateStatus(orderId, productId, storeId, button) {
    const currentLabel = button.innerText.trim().toLowerCase();
let newStatus;
if (currentLabel === 'reserved') {
    newStatus = 'picked_up';
} else if (currentLabel === 'picked up') {
    newStatus = 'reserved';
} else {
    alert('Unknown status');
    return;
}
    try {
        const baseUrl = '/node9';
        const response = await fetch(`${baseUrl}/OrderProducts/${orderId}/${productId}/${storeId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
            button.innerText = newStatus === 'picked_up' ? 'Picked up' : 'reserved';
        } else {
            alert("Failed to update status.");
        }
    } catch (err) {
        console.error("Network or server error:", err.message || err);
        alert("Could not update status due to a network error.");
    }
}
