const signupForm = document.getElementById('SignupForm');
const loginForm = document.getElementById('LoginForm');
const firstname_input = document.getElementById('firstname-input');
const email_input = document.getElementById('email-input');
const password_input = document.getElementById('password-input');
const repeat_password_input = document.getElementById('repeat-password-input');
const error_message = document.getElementById('error-message');

if (!error_message) {
    console.error('Error: Could not find element with ID "error-message"');
}

if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Stop form submission
        console.log('Form submitted');
        // Først validerer vi input-dataene
        let errors = getSignupFormErrors(firstname_input.value, email_input.value, password_input.value, repeat_password_input.value);

        // Hvis der er fejl, stop formularindsendelse og vis fejl
        if (errors.length > 0) {
            error_message.innerText = errors.join(". ");
            return;
        }

        // Opret userData objektet, som vi vil sende til serveren
        const userData = {
            firstname: firstname_input.value,
            email: email_input.value,
            password: password_input.value
        };

        // Disable the button while fetching
        const signupButton = document.querySelector('button[type="submit"]');
        signupButton.disabled = true;  

        // Send dataen til serveren via fetch API
        try {
            console.log('Sending data to server:', userData);
            const response = await fetch('/node9/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            const result = await response.json(); // Forventet svar fra serveren
            console.log('Server response:', result);

            if (response.ok) {
                // Hvis succes, omdiriger brugeren til login-siden
                window.location.href = '/node9/login.html'; 
            } else {
                // Hvis noget gik galt på serveren, vis fejlen
                error_message.innerText = result.error;
                signupButton.disabled = false; // Enable the button again
            }
        } catch (error) {
            // Håndter fejl ved serveranmodning
            console.error('Network error:', error);
            error_message.innerText = 'An error occurred. Please try again later.';
            signupButton.disabled = false; // Enable the button again   
        }
    });
}

// Funktion til at validere signup-formularen
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

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Stop form submission
        console.log('Form submitted');

        // Først validerer vi input-dataene
        let errors = getLoginFormErrors(email_input.value, password_input.value);

        // Hvis der er fejl, stop formularindsendelse og vis fejl
        if (errors.length > 0) {
            error_message.innerText = errors.join(". ");
            return;
        }

        // Opret userData for loginform objektet, som vi vil sende til serveren
        const userData = {
            email: email_input.value,
            password: password_input.value
        };

        // Disable the button while fetching
        const loginButton = document.querySelector('button[type="submit"]');
        loginButton.disabled = true;

        // Send dataen til serveren via fetch API
        try {
            console.log('Sending data to server:', userData);
            const response = await fetch('/node9/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });
            
            const result = await response.json(); // Forventet svar fra serveren
            console.log('Server response:', result); // Debugging

            if (response.ok) {
                // Hvis succes, omdiriger brugeren til login-siden
                window.location.href = '/frontpage.html'; 
            } else {
                // Hvis noget gik galt på serveren, vis fejlen
                console.log('Error from server:', result.error);
                error_message.innerText = result.error;
                loginButton.disabled = false; // Enable the button again
            }
        } catch (error) {
            // Håndter fejl ved serveranmodning
            console.error('Network error:', error);
            error_message.innerText = 'An error occurred. Please try again later.';
            loginButton.disabled = false; // Enable the button again   
        }
    });
}