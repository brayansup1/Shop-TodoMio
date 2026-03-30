const API_URL = 'https://shop-todomio.onrender.com';

// Función para obtener el token
function getToken() {
    return localStorage.getItem('adminToken');
}

// Función para inicializar seguridad en panel de admin
function checkAuth() {
    const token = getToken();
    if (!token) {
        window.location.href = 'login.html';
    }
}

// Función para cerrar sesión
function logout() {
    localStorage.removeItem('adminToken');
    window.location.href = 'login.html';
}

// Fetch autorizado
async function fetchAuth(url, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, { ...options, headers });
    
    if (response.status === 401) {
        logout(); // Token inválido o expirado
        throw new Error("No autorizado");
    }
    
    return response;
}
