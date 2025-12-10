document.addEventListener('DOMContentLoaded', () => {
    // 1. Verificar Autenticación
    const token = sessionStorage.getItem('token');
    if (!token) {
        // Si no hay token, mandar al login
        window.location.href = '/admin/login.html';
        return;
    }

    // 2. Mostrar Nombre de Usuario (Opcional, decodificando el token si es JWT simple)
    // Por ahora ponemos un genérico o lo tomamos de sessionStorage si lo guardamos al login
    const username = sessionStorage.getItem('username') || 'Admin';
    document.getElementById('welcomeUser').textContent = `Hola, ${username}`;

    // 3. Lógica de Logout
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        try {
            // Opcional: Avisar al backend
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch (error) {
            console.error(error);
        } finally {
            // Borrar token y redirigir
            sessionStorage.removeItem('token');
            window.location.href = '/admin/login.html';
        }
    });
});