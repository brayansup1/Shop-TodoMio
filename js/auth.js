const API_URL = 'https://shop-todomio.onrender.com/v1';

// ==========================================
// ADMIN AUTH
// ==========================================
function getToken() { return localStorage.getItem('adminToken'); }
function logout() { localStorage.removeItem('adminToken'); window.location.href = 'login.html'; }
function checkAuth() { if (!getToken()) window.location.href = 'login.html'; }

async function fetchAuth(url, options = {}) {
    const token = getToken();
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) { logout(); throw new Error("No autorizado"); }
    return response;
}

// ==========================================
// CUSTOMER AUTH
// ==========================================
function getCustomerToken() { return localStorage.getItem('customerToken'); }
function getCustomerName() { return localStorage.getItem('customerName'); }
function isCustomerLoggedIn() { return !!getCustomerToken(); }
function logoutCustomer() {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customerName');
    localStorage.removeItem('customerEmail');
    window.location.reload();
}
