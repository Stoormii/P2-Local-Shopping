document.addEventListener('DOMContentLoaded', () => {
  const baseUrl = window.location.origin.includes('localhost') ? '' : '/node9';

  // check if a store is log in - redirect to login
  async function checkSession() {
    try {
      const res = await fetch(`${baseUrl}/session`);
      const data = await res.json();

      if (!data.store) {
        window.location.href = 'storelogin.html';
      } else {
        updateStoreWelcome(data.store.storename);
      }
    } catch (err) {
      console.error('Fejl ved sessionscheck:', err);
      window.location.href = 'storelogin.html';
    }
  }

  //update welcome text
  function updateStoreWelcome(storeName) {
    const heading = document.getElementById('welcome-heading');
    if (heading) {
      heading.textContent = `Welcome ${storeName}`;
    }
  }

  // add activ classes to navigation
  const navLinks = document.querySelectorAll('.nav-links a');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navLinks.forEach(nav => nav.classList.remove('active'));
      link.classList.add('active');
    });
  });

  // Logout-button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        const response = await fetch(`${baseUrl}/logout`, { method: 'POST' });
        if (response.ok) {
         
window.location.href = `${baseUrl}/storelogin.html`;

        } else {
          alert('Logout fejlede.');
        }
      } catch (error) {
        console.error('Fejl under logout:', error);
        alert('Noget gik galt under logout.');
      }
    });
  }

  // Initialisation of the function
  checkSession();
});
