// Definerer en konstant BASE_URL baseret på miljøet (lokalt eller server)
// Hvis URL'en indeholder 'localhost', bruges en tom streng, ellers bruges '/node9'
const BASE_URL = window.location.origin.includes('localhost')
    ? '' // Lokalt miljø
    : '/node9'; // Servermiljø

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

    storesignupForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Forhindrer standard formularindsendelse
        console.log('Store Signup submitted');

        const name           = storeNameInput.value.trim();
        const email          = storeSignupEmailInput.value.trim();
        const address        = storeAddressInput.value.trim();
        const password       = storePasswordInput.value;            
        const repeatPassword = storeRepeatPasswordInput.value;
        const description    = storeDescriptionInput.value.trim();

        // Valider input-data
        const storeSignupErrors = getStoreSignupFormErrors(
            name, email, address, password, repeatPassword, description
        );
        if (storeSignupErrors.length > 0) {
            storeSignupErrorMessage.innerText = storeSignupErrors.join('. ');
            return;
        }

        // Opret objekt med brugerdata til serveren
        const storeData = {
            Store_name:        name,
            Store_address:     address,
            Store_description: description,
            email:             email,
            password:          password,
            image:             logoUrl // Placeholder for logo URL
        };

        // Deaktiver knappen under anmodning
        const submitbutton = storesignupForm.querySelector('button[type="submit"]');
        submitbutton.disabled = true;

        try {
            console.log('Sending data to server:', storeData);
            const response = await fetch(`${BASE_URL}/store-signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(storeData),
            });

            // Tjek om svaret er JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Received non-JSON response:', text);
                throw new Error('Server returned an unexpected response format');
            }

            const result = await response.json();
            console.log('Server response:', result);

            if (response.ok) {
                // Omdiriger til butik-login-siden ved succes
                window.location.href = `${BASE_URL}/storelogin.html`;
            } else {
                // Vis serverfejl
                storeSignupErrorMessage.innerText = result.error || 'An error occurred';
                submitbutton.disabled = false;
            }
        } catch (error) {
            // Håndter netværks- eller JSON-parsingsfejl
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
        e.preventDefault(); // Forhindrer standard formularindsendelse
        console.log('Store Login submitted');

        const email = storeLoginEmailInput.value.trim();
        const pw    = storeLoginPasswordInput.value;

        // Valider input-data
        const errors = getStoreLoginErrors(email, pw);
        if (errors.length > 0) {
            storeLoginErrorMessage.innerText = errors.join('. ');
            return;
        }

        // Opret objekt med brugerdata til serveren
        const storeLoginData = { email, password: pw };

        // Deaktiver knappen under anmodning
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

            // Tjek om svaret er JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Received non-JSON response:', text);
                throw new Error('Server returned an unexpected response format');
            }

            const result = await response.json();
            console.log('Server response:', result);

            if (response.ok) {
                // Omdiriger til Store Front Page ved succes
                window.location.href = `${BASE_URL}/StoreFrontPage.html`;
            } else {
                // Vis serverfejl
                storeLoginErrorMessage.innerText = result.error || 'An error occurred';
                loginBtn.disabled = false;
            }
        } catch (error) {
            // Håndter netværks- eller JSON-parsingsfejl
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
        e.preventDefault(); // Forhindrer standard formularindsendelse
        console.log('User Signup submitted');

        const firstname = firstnameInput.value.trim();
        const email     = signupEmailInput.value.trim();
        const pw        = signupPasswordInput.value;
        const pw2       = signupRepeatPasswordInput.value;

        // Valider input-data
        const errors = getUserSignupErrors(firstname, email, pw, pw2);
        if (errors.length > 0) {
            userSignupErrorMessage.innerText = errors.join('. ');
            return;
        }

        // Opret objekt med brugerdata til serveren
        const userData = { firstname, email, password: pw };

        // Deaktiver knappen under anmodning
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

            // Tjek om svaret er JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Received non-JSON response:', text);
                throw new Error('Server returned an unexpected response format');
            }

            const result = await response.json();
            console.log('Server response:', result);

            if (response.ok) {
                // Omdiriger til login-siden ved succes
                window.location.href = `${BASE_URL}/login.html`;
            } else {
                // Vis serverfejl
                userSignupErrorMessage.innerText = result.error || 'An error occurred';
                signupBtn.disabled = false;
            }
        } catch (error) {
            // Håndter netværks- eller JSON-parsingsfejl
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
        e.preventDefault(); // Forhindrer standard formularindsendelse
        console.log('User Login submitted');

        const email = loginEmailInput.value.trim();
        const pw    = loginPasswordInput.value;

        // Valider input-data
        const errors = getUserLoginErrors(email, pw);
        if (errors.length > 0) {
            userLoginErrorMessage.innerText = errors.join('. ');
            return;
        }

        // Opret objekt med brugerdata til serveren
        const loginData = { email, password: pw };

        // Deaktiver knappen under anmodning
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

            // Tjek om svaret er JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Received non-JSON response:', text);
                throw new Error('Server returned an unexpected response format');
            }

            const result = await response.json();
            console.log('Server response:', result);

            if (response.ok) {
                // Omdiriger til forsiden ved succes
                window.location.href = `${BASE_URL}/frontpage.html`;
            } else {
                // Vis serverfejl
                userLoginErrorMessage.innerText = result.error || 'An error occurred';
                loginBtn.disabled = false;
            }
        } catch (error) {
            // Håndter netværks- eller JSON-parsingsfejl
            console.error('Network error:', error);
            userLoginErrorMessage.innerText = 'An error occurred. Please try again later.';
            loginBtn.disabled = false;
        }
    });
}


// ======== Valideringsfunktioner ========
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
