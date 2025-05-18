//This function is used to redirect the user to the store page when they click on an image
function redirect2(imageId){
   window.location.href = `store/${imageId}`;
   }


   //This function is used to redirect the user to the item page when they click on an image
function redirect1(imageId){
   window.location.href = `${baseUrl}/Product/${imageId}`;
   }

 async function redirect3(imageId) {
    console.log("redirect3 called with orderId:", imageId); // Debugging log

    try {
        const baseUrl = window.location.origin.includes('localhost') ? '' : '/node9'; // Adjust for localhost vs server
        const response = await fetch(`${baseUrl}/session`, {
            method: 'GET',
            credentials: 'include', // Include cookies with the request
        });

        if (!response.ok) {
            throw new Error(`Server returned status ${response.status}`);
        }

        const data = await response.json();

        if (!data.LoggedIn || !data.store || !data.store.id) {
            console.error("Store_ID is not available in session data.");
            alert("Store_ID is not available. Please log in again.");
            return;
        }

        const storeId = data.store.id; // Retrieve the Store_ID from the session data
        console.log("Redirecting to:", `${baseUrl}/OrderProducts/${storeId}/${imageId}`); // Debugging log
        window.location.href = `${baseUrl}/OrderProducts/${storeId}/${imageId}`; // Redirect to the OrderProducts page
    } catch (error) {
        console.error("Error fetching session data:", error);
        alert("Could not fetch session data. Please try again later.");
    }
}
