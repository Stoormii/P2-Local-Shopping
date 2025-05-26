document.addEventListener('DOMContentLoaded', () => {
  const baseUrl = window.location.origin.includes('localhost') ? '' : '/node9';

  // 1. Tjek om butik er logget ind – ellers redirect til login
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

  // 2. Opdater velkomsttekst
  function updateStoreWelcome(storeName) {
    const heading = document.getElementById('welcome-heading');
    if (heading) {
      heading.textContent = `Welcome ${storeName}`;
    }
  }

  // 3. Tilføj aktiv klasse til navigation
  const navLinks = document.querySelectorAll('.nav-links a');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navLinks.forEach(nav => nav.classList.remove('active'));
      link.classList.add('active');
    });
  });

  // 4. Logout-knap
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        const response = await fetch(`${baseUrl}/logout`, { method: 'POST' });
        if (response.ok) {
         
      window.location.href = 'storelogin.html';

        } else {
          alert('Logout fejlede.');
        }
      } catch (error) {
        console.error('Fejl under logout:', error);
        alert('Noget gik galt under logout.');
      }
    });
  }

  // Initialiser funktioner
  checkSession();
});
