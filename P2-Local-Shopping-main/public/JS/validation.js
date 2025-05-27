// Define a constant for the base URL based on the environment (local or server)
const BASE_URL = window.location.origin.includes('localhost')
    ? '' // Local 
    : '/node9'; // Server

// ======== Store Signup ========
const storesignupForm = document.getElementById('StoreSignupForm');

if (storesignupForm) {
    const storeNameInput           = document.getElementById('store-name-input');
    const storeSignupEmailInput    = document.getElementById('store-signup-mail-input');
    const storeAddressInput        = document.getElementById('store-address-input');
    const storePasswordInput       = document.getElementById('store-password-input');
    const storeRepeatPasswordInput = document.getElementById('repeat-store-password-input');
    const storeDescriptionInput    = document.getElementById('store-description-input');
    const storeSignupErrorMessage  = document.getElementById('storesignup-error-message');
    const storeLogoInput           = document.getElementById('shop-image');

    storesignupForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // 
        // Prevent default form submission
        console.log('Store Signup submitted');

        const name           = storeNameInput.value.trim();
        const email          = storeSignupEmailInput.value.trim();
        const address        = storeAddressInput.value.trim();
        const password       = storePasswordInput.value;            
        const repeatPassword = storeRepeatPasswordInput.value;
        const description    = storeDescriptionInput.value.trim();
        const logoUrl        = storeLogoInput.value;

        // Validate input-data
        const storeSignupErrors = getStoreSignupFormErrors(
            name, email, address, password, repeatPassword, description
        );
        if (storeSignupErrors.length > 0) {
            storeSignupErrorMessage.innerText = storeSignupErrors.join('. ');
            return;
        }

        // Deactivate the submit button during the request
        const submitbutton = storesignupForm.querySelector('button[type="submit"]');
        submitbutton.disabled = true;

        const formData = new FormData();
        formData.append('Store_name', name);
        formData.append('Store_address', address);
        formData.append('Store_description', description);
        formData.append('email', email);
        formData.append('password', password);
        formData.append('logo', storeLogoInput.files[0]);

        try {
            const response = await fetch(`${BASE_URL}/store-signup`, {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();
            console.log('Server response:', result);

            if (response.ok) {
                window.location.href = `${BASE_URL}/storelogin.html`;
            } else {
                storeSignupErrorMessage.innerText = result.error || 'An error occurred';
                submitbutton.disabled = false;
            }
        } catch (error) {
            console.error('Network error:', error);
            storeSignupErrorMessage.innerText = 'An error occurred. Please try again later.';
            submitbutton.disabled = false;
        }
    });
}


// ======== Store Login ========
const storeLoginForm = document.getElementById('StoreLoginForm');

if (storeLoginForm) {
    const storeLoginEmailInput    = document.getElementById('store-email-input');
    const storeLoginPasswordInput = document.getElementById('store-login-password-input');
    const storeLoginErrorMessage  = document.getElementById('storelogin-error-message');

    storeLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent default form submission
        console.log('Store Login submitted');

        const email = storeLoginEmailInput.value.trim();
        const pw    = storeLoginPasswordInput.value;

        // Validate input-data
        const errors = getStoreLoginErrors(email, pw);
        if (errors.length > 0) {
            storeLoginErrorMessage.innerText = errors.join('. ');
            return;
        }

        // Create an object with user data for the server
        const storeLoginData = { email, password: pw };

        // Deactivate the submit button during the request
        const loginBtn = storeLoginForm.querySelector('button[type="submit"]');
        loginBtn.disabled = true;

        try {
            console.log('Sending data to server:', storeLoginData);
            const response = await fetch(`${BASE_URL}/storelogin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(storeLoginData),
            });

            // Check if the response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Received non-JSON response:', text);
                throw new Error('Server returned an unexpected response format');
            }

            const result = await response.json();
            console.log('Server response:', result);

            if (response.ok) {
                // Redirect to Store Front Page on success
                window.location.href = `${BASE_URL}/StoreFrontPage.html`;
            } else {
                // Show servererror 
                storeLoginErrorMessage.innerText = result.error || 'An error occurred';
                loginBtn.disabled = false;
            }
        } catch (error) {
            // Handle network or JSON parsing errors
            console.error('Network error:', error);
            storeLoginErrorMessage.innerText = 'An error occurred. Please try again later.';
            loginBtn.disabled = false;
        }
    });
}


// ======== User Signup ========
const signupForm = document.getElementById('SignupForm');

if (signupForm) {
    const firstnameInput            = document.getElementById('firstname-input');
    const signupEmailInput          = document.getElementById('email-input');
    const signupPasswordInput       = document.getElementById('password-input');
    const signupRepeatPasswordInput = document.getElementById('repeat-password-input');
    const userSignupErrorMessage    = document.getElementById('usersignup-error-message');

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // 
        // Prevent default form submission
        console.log('User Signup submitted');

        const firstname = firstnameInput.value.trim();
        const email     = signupEmailInput.value.trim();
        const pw        = signupPasswordInput.value;
        const pw2       = signupRepeatPasswordInput.value;

        // Validate input-data
        const errors = getUserSignupErrors(firstname, email, pw, pw2);
        if (errors.length > 0) {
            userSignupErrorMessage.innerText = errors.join('. ');
            return;
        }

        // Create an object with user data for the server
        const userData = { firstname, email, password: pw };

        // Deactivate the submit button during the request
        const signupBtn = signupForm.querySelector('button[type="submit"]');
        signupBtn.disabled = true;

        try {
            console.log('Sending data to server:', userData);
            const response = await fetch(`${BASE_URL}/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            // Check if the response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Received non-JSON response:', text);
                throw new Error('Server returned an unexpected response format');
            }

            const result = await response.json();
            console.log('Server response:', result);

            if (response.ok) {
                // Redirect to login page on success
                window.location.href = `${BASE_URL}/login.html`;
            } else {
                // Show server error
                userSignupErrorMessage.innerText = result.error || 'An error occurred';
                signupBtn.disabled = false;
            }
        } catch (error) {
            // Handle network or JSON parsing errors
            console.error('Network error:', error);
            userSignupErrorMessage.innerText = 'An error occurred. Please try again later.';
            signupBtn.disabled = false;
        }
    });
}


// ======== User Login ========
const loginForm = document.getElementById('LoginForm');

if (loginForm) {
    const loginEmailInput       = document.getElementById('email-input');
    const loginPasswordInput    = document.getElementById('password-input');
    const userLoginErrorMessage = document.getElementById('error-message');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent default form submission
        console.log('User Login submitted');

        const email = loginEmailInput.value.trim();
        const pw    = loginPasswordInput.value;

        // Validate input-data
        const errors = getUserLoginErrors(email, pw);
        if (errors.length > 0) {
            userLoginErrorMessage.innerText = errors.join('. ');
            return;
        }

        // Create an object with user data for the server
        const loginData = { email, password: pw };

        // Deactivate the submit button during the request
        const loginBtn = loginForm.querySelector('button[type="submit"]');
        loginBtn.disabled = true;

        try {
            console.log('Sending data to server:', loginData);
            const response = await fetch(`${BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loginData),
            });

            // Check if the response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Received non-JSON response:', text);
                throw new Error('Server returned an unexpected response format');
            }

            const result = await response.json();
            console.log('Server response:', result);

            if (response.ok) {
                // Redirect to front page on success
                window.location.href = `${BASE_URL}/frontpage.html`;
            } else {
                // Show server error 
                userLoginErrorMessage.innerText = result.error || 'An error occurred';
                loginBtn.disabled = false;
            }
        } catch (error) {
            // Handle network or JSON parsing errors
            console.error('Network error:', error);
            userLoginErrorMessage.innerText = 'An error occurred. Please try again later.';
            loginBtn.disabled = false;
        }
    });
}


// ======== Validation function ========
function getStoreSignupFormErrors(name, email, address, pw, pwRepeat, desc) {
    const errs = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!name)                       errs.push('Store name is required');
    if (!email)                      errs.push('Store email is required');
    else if (!emailRegex.test(email)) errs.push('Invalid store email');
    if (!address)                    errs.push('Store address is required');
    if (!desc)                       errs.push('Store description is required');
    if (!pw)                         errs.push('Password is required');
    else if (pw.length < 8)          errs.push('Password must be at least 8 characters');
    if (pw !== pwRepeat)             errs.push('Passwords do not match');
    return errs;
}

function getStoreLoginErrors(email, pw) {
    const errs = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email)                      errs.push('Email is required');
    else if (!emailRegex.test(email)) errs.push('Invalid email format');
    if (!pw)                         errs.push('Password is required');
    else if (pw.length < 8)          errs.push('Password must be at least 8 characters');
    return errs;
}

function getUserSignupErrors(firstname, email, pw, pwRepeat) {
    const errs = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!firstname)                  errs.push('Firstname is required');
    if (!email)                      errs.push('Email is required');
    else if (!emailRegex.test(email)) errs.push('Invalid email format');
    if (!pw)                         errs.push('Password is required');
    else if (pw.length < 8)          errs.push('Password must be at least 8 characters');
    if (pw !== pwRepeat)             errs.push('Passwords do not match');
    return errs;
}

function getUserLoginErrors(email, pw) {
    const errs = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email)                      errs.push('Email is required');
    else if (!emailRegex.test(email)) errs.push('Invalid email format');
    if (!pw)                         errs.push('Password is required');
    else if (pw.length < 8)          errs.push('Password must be at least 8 characters');
    return errs;
}


// ======== Logout / Session handling ========
async function handleLoginStatus() {
    const accountMenu = document.getElementById('account-menu');
    if (!accountMenu) return; // <-- STOP, if we are on a site without the account menu

    try {
        const respos = await fetch(`${BASE_URL}/session`);
        const data = await respos.json();
        console.log('Session data:', data);

        accountMenu.innerHTML = ''; // Empty the menu

        if (data.LoggedIn) {
            const greeting = document.createElement('span');
            greeting.textContent = `Hello ${data.user?.firstname || data.store?.storename || 'Guest'}!`;
            greeting.style.display = 'block';
            greeting.style.textAlign = 'center';
            greeting.style.fontWeight = 'bold';
            greeting.style.color = '#333';
            greeting.style.fontSize = '16px';
            accountMenu.appendChild(greeting);

            const logoutLink = document.createElement('a');
            logoutLink.textContent = 'Logout';
            logoutLink.href = '#';
            logoutLink.onclick = async (e) => {
                e.preventDefault();
                await fetch(`${BASE_URL}/logout`, { method: 'POST' });
                window.location.reload();
            };
            accountMenu.appendChild(logoutLink);
        } else {
            const loginLink = document.createElement('a');
            loginLink.textContent = 'Login';
            loginLink.href = `${BASE_URL}/login.html`;

            const signupLink = document.createElement('a');
            signupLink.textContent = 'Signup';
            signupLink.href = `${BASE_URL}/signup.html`;

            accountMenu.appendChild(loginLink);
            accountMenu.appendChild(signupLink);
        }
    } catch (error) {
        console.error('Error checking session data:', error);
    }
}

// Run, but only if the element exists
if (document.getElementById('account-menu')) {
    handleLoginStatus();
}
