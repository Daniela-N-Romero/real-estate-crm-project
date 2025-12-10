// admin/js/login.js
document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessageElement = document.getElementById('errorMessage');
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (response.ok) {
            errorMessageElement.textContent = '';
            sessionStorage.setItem('token', data.token);
            window.location.href = data.redirectTo;
        } else {
            errorMessageElement.textContent = data.message || 'Error en el login. Inténtalo de nuevo.';
        }
    } catch (error) {
        console.error('Error al conectar con el servidor:', error);
        errorMessageElement.textContent = 'No se pudo conectar con el servidor. Inténtalo de nuevo.';
    }
});