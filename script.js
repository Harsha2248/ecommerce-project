// script.js
const API_URL = 'http://localhost:5000/api/v1';
let customerToken = localStorage.getItem('jwtToken') || ''; // Check storage on load

// --- Configuration: UPDATE THESE WITH YOUR ACTUAL SUCCESSFUL IDs ---
const TEST_STORE_ID = '68f79fd7b025b3c25cdc26ea'; 
const TEST_PRODUCT_ID = '68f7b0dc07eaae03cd13ff8c';
const TEST_PRICE = 99.99; 
// -----------------------------------------------------------------

// Runs immediately to show the correct interface
document.addEventListener('DOMContentLoaded', checkAuthStatus);

// --- UI Management ---

function checkAuthStatus() {
    const authSection = document.getElementById('auth');
    const dashboardSection = document.getElementById('dashboard');
    const tokenDisplay = document.getElementById('tokenDisplay');

    if (customerToken) {
        // Logged In: Hide Auth, Show Dashboard
        authSection.style.display = 'none';
        dashboardSection.style.display = 'block';
        tokenDisplay.textContent = 'Active (Ready for operations)';
    } else {
        // Logged Out: Show Auth, Hide Dashboard
        authSection.style.display = 'block';
        dashboardSection.style.display = 'none';
        tokenDisplay.textContent = 'No Token';
    }
}

function updateToken(token) {
    customerToken = token;
    if (token) {
        localStorage.setItem('jwtToken', token); // Store token
    } else {
        localStorage.removeItem('jwtToken'); // Remove token
    }
    checkAuthStatus(); // Update the UI immediately
}

function logoutUser() {
    updateToken('');
    alert('Logged out successfully.');
}

// --- Helper function for Auth ---
async function sendAuthRequest(endpoint, name, email, password) {
    const response = await fetch(`${API_URL}/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            name: name, 
            email, 
            password, 
            role: 'customer'
        })
    });
    const data = await response.json();
    return { response, data };
}

// --- 1. AUTHENTICATION (The only functions allowed to update the token) ---

async function registerUser() {
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!name || !email || !password) {
        alert("Please fill in Name, Email, and Password to register.");
        return;
    }
    
    const { response, data } = await sendAuthRequest('register', name, email, password);
    
    if (response.ok) {
        alert('Registration Successful! Logged in.');
        updateToken(data.token);
    } else {
        alert('Registration failed: ' + data.message);
    }
}

async function loginUser() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const name = "Web User"; 

    const { response, data } = await sendAuthRequest('login', name, email, password);

    if (response.ok) {
        alert('Login Successful!');
        updateToken(data.token);
    } else {
        // FAILURE: User not found or invalid credentials
        if (data.message && (data.message.includes('Invalid credentials') || data.message.includes('not found'))) { 
            
            const registerName = prompt("User not found. Please enter your full name to register:", name);
            
            if (registerName) {
                const { response: regResponse, data: regData } = await sendAuthRequest('register', registerName, email, password);
                
                if (regResponse.ok) {
                    alert("Registration successful! You are now logged in.");
                    updateToken(regData.token);
                } else {
                    alert("Registration failed: " + regData.message);
                }
            } else {
                 alert("Login aborted.");
            }
        } else {
            alert('Login failed: ' + data.message);
            updateToken('');
        }
    }
}


// --- 2. STORE SEARCH (Requires Token) ---
async function searchStores() {
    if (!customerToken) {
        alert('Please log in to perform this operation.');
        return;
    }
    // ... (rest of the searchStores function remains the same)
    const lat = document.getElementById('latitude').value;
    const lon = document.getElementById('longitude').value;
    const distance = 10; 

    const url = `${API_URL}/stores/nearby?latitude=${lat}&longitude=${lon}&distance=${distance}`;

    const response = await fetch(url);
    const data = await response.json();
    
    document.getElementById('storeResults').textContent = JSON.stringify(data, null, 2);
}

// --- 3. PLACE ORDER (Requires Token) ---
async function placeOrder() {
    if (!customerToken) {
        alert('Please log in first before placing an order.');
        return;
    }

    // 1. Capture the NEW input values from the HTML form
    const productName = document.getElementById('order_product_name').value;
    const productCategory = document.getElementById('order_product_category').value;
    const productBrand = document.getElementById('order_product_brand').value;
    const productQty = parseInt(document.getElementById('order_product_qty').value);
    
    // Basic validation
    if (!productName || !productCategory || !productBrand || productQty < 1) {
        alert("Please ensure all product details (name, category, brand, qty) are filled in.");
        return;
    }
    
    // The price, product ID, and store ID still come from the hardcoded variables
    const calculatedPrice = TEST_PRICE * productQty;

    const orderBody = {
        orderItems: [
            {
                // Use the input values
                name: productName, 
                qty: productQty,
                price: TEST_PRICE, // Price per unit
                // NOTE: category and brand are not typically required by the Mongoose Order Model 
                // but we can pass them in the item object if your backend expects them.
                category: productCategory, 
                brand: productBrand,
                
                // CRITICAL: These IDs MUST exist in your MongoDB for the order to pass validation
                product: TEST_PRODUCT_ID, 
                store: TEST_STORE_ID
            }
        ],
        shippingAddress: {
            address: "456 Web Client St",
            city: "ClientCity",
            postalCode: "12345"
        },
        paymentMethod: "Simulated",
        totalPrice: calculatedPrice // Use the calculated total price
    };

    const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${customerToken}` 
        },
        body: JSON.stringify(orderBody)
    });

    const data = await response.json();
    
    document.getElementById('orderResults').textContent = JSON.stringify(data, null, 2);
    
    if (response.ok) {
        alert('Order Placed Successfully! Check your email for confirmation.');
    } else {
        // Log the full error to the console for better debugging
        console.error('Order failed:', data);
        alert('Order failed: ' + (data.message || 'Server error. Check console.'));
    }
}