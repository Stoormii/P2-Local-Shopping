// Definerer en konstant BASE_URL baseret på miljøet (lokalt eller server)
// Hvis URL'en indeholder 'localhost', bruges en tom streng, ellers bruges '/node9'
const BASE_URL = window.location.origin.includes('localhost')
    ? '' // Lokalt miljø
    : '/node9'; // Servermiljø
// Hent formular- og inputelementer fra DOM
const storeloginForm = document.getElementById('StoreLoginForm');
const signupForm = document.getElementById('SignupForm');
const loginForm = document.getElementById('LoginForm');
const firstname_input = document.getElementById('firstname-input');
const email_input = document.getElementById('email-input');
const password_input = document.getElementById('password-input');
const repeat_password_input = document.getElementById('repeat-password-input');
const error_message = document.getElementById('error-message');

// Tjek om error_message-elementet findes
if (!error_message) {
    console.error('Error: Could not find element with ID "error-message"');
}

// Håndter tilmeldingsformular
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Forhindrer standard formularindsendelse
        console.log('Form submitted');

        // Valider input-data
        let errors = getSignupFormErrors(firstname_input.value, email_input.value, password_input.value, repeat_password_input.value);

        // Vis fejl, hvis der er nogen
        if (errors.length > 0) {
            error_message.innerText = errors.join(". ");
            return;
        }

        // Opret objekt med brugerdata til serveren
        const userData = {
            firstname: firstname_input.value,
            email: email_input.value,
            password: password_input.value
        };

        // Deaktiver knappen under anmodning
        const signupButton = document.querySelector('button[type="submit"]');
        signupButton.disabled = true;

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
                error_message.innerText = result.error || 'An error occurred';
                signupButton.disabled = false;
            }
        } catch (error) {
            // Håndter netværks- eller JSON-parsingsfejl
            console.error('Network error:', error);
            error_message.innerText = 'An error occurred. Please try again later.';
            signupButton.disabled = false;
        }
    });
}

// Funktion til at validere tilmeldingsformularen
function getSignupFormErrors(firstname, email, password, repeatPassword) {
    let errors = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (firstname === '' || firstname == null) {
        errors.push('Firstname is required');
        if (firstname_input) {
            firstname_input.parentElement.classList.add('incorrect');
        }
    }

    if (email === '' || email == null) {
        errors.push('Email is required');
        if (email_input) {
            email_input.parentElement.classList.add('incorrect');
        }
    } else if (!emailRegex.test(email)) {
        errors.push('Invalid email format');
        if (email_input) {
            email_input.parentElement.classList.add('incorrect');
        }
    }

    if (password === '' || password == null) {
        errors.push('Password is required');
        if (password_input) {
            password_input.parentElement.classList.add('incorrect');
        }
    }

    if (password.length < 8) {
        errors.push('Password must have at least 8 characters');
        if (password_input) {
            password_input.parentElement.classList.add('incorrect');
        }
    }

    if (repeatPassword === '' || repeatPassword == null) {
        errors.push('Repeat Password is required');
        if (repeat_password_input) {
            repeat_password_input.parentElement.classList.add('incorrect');
        }
    }

    if (password !== repeatPassword) {
        errors.push('Password does not match repeated password');
        if (password_input) {
            password_input.parentElement.classList.add('incorrect');
        }
        if (repeat_password_input) {
            repeat_password_input.parentElement.classList.add('incorrect');
        }
    }

    return errors;
}

// Funktion til at validere login-formularen
function getLoginFormErrors(email, password) {
    let errors = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (email === '' || email == null) {
        errors.push('Email is required');
        if (email_input) {
            email_input.parentElement.classList.add('incorrect');
        }
    } else if (!emailRegex.test(email)) {
        errors.push('Invalid email format');
        if (email_input) {
            email_input.parentElement.classList.add('incorrect');
        }
    }

    if (password === '' || password == null) {
        errors.push('Password is required');
        if (password_input) {
            password_input.parentElement.classList.add('incorrect');
        }
    } else if (password.length < 8) {
        errors.push('Password must have at least 8 characters');
        if (password_input) {
            password_input.parentElement.classList.add('incorrect');
        }
    }

    return errors;
}

// Ryd fejlmeddelelser ved input
const allInputs = [firstname_input, email_input, password_input, repeat_password_input].filter(input => input != null);

allInputs.forEach(input => {
    input.addEventListener('input', () => {
        if (input.parentElement.classList.contains('incorrect')) {
            input.parentElement.classList.remove('incorrect');
            error_message.innerText = '';
        }
    });
});

// Håndter login-formular
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Forhindrer standard formularindsendelse
        console.log('Form submitted');

        // Valider input-data
        let errors = getLoginFormErrors(email_input.value, password_input.value);

        // Vis fejl, hvis der er nogen
        if (errors.length > 0) {
            error_message.innerText = errors.join(". ");
            return;
        }

        // Opret objekt med brugerdata til serveren
        const userData = {
            email: email_input.value,
            password: password_input.value
        };

        // Deaktiver knappen under anmodning
        const loginButton = document.querySelector('button[type="submit"]');
        loginButton.disabled = true;

        try {
            console.log('Sending data to server:', userData);
            const response = await fetch(`${BASE_URL}/login`, {
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
                // Omdiriger til forsiden ved succes
                window.location.href = `${BASE_URL}/frontpage.html`;
            } else {
                // Vis serverfejl
                console.log('Error from server:', result.error);
                error_message.innerText = result.error || 'An error occurred';
                loginButton.disabled = false;
            }
        } catch (error) {
            // Håndter netværks- eller JSON-parsingsfejl
            console.error('Network error:', error);
            error_message.innerText = 'An error occurred. Please try again later.';
            loginButton.disabled = false;
        }
    });
}