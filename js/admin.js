let currentProducts = [];
let currentOrders = [];
let activeOrderId = null;

// Ejecutar seguridad inicial
checkAuth();

// TABS
function showTab(tab) {
    document.getElementById('viewProducts').classList.add('hidden');
    document.getElementById('viewOrders').classList.add('hidden');
    
    document.getElementById('tabProducts').className = "text-left px-4 py-3 rounded-xl font-bold transition-all text-gray-500 hover:bg-gray-50";
    document.getElementById('tabOrders').className = "text-left px-4 py-3 rounded-xl font-bold transition-all text-gray-500 hover:bg-gray-50";
    
    if(tab === 'products') {
        document.getElementById('viewProducts').classList.remove('hidden');
        document.getElementById('tabProducts').className = "text-left px-4 py-3 rounded-xl font-bold transition-all bg-brandBlue text-white shadow-md";
        loadProducts();
    } else {
        document.getElementById('viewOrders').classList.remove('hidden');
        document.getElementById('tabOrders').className = "text-left px-4 py-3 rounded-xl font-bold transition-all bg-brandBlue text-white shadow-md";
        loadOrders();
    }
}

function format(n) { return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n); }


// --- PRODUCTOS ---
async function loadProducts() {
    try {
        const res = await fetchAuth(`${API_URL}/products`);
        currentProducts = await res.json();
        renderProducts();
    } catch(e) {
        document.getElementById('productsTableBody').innerHTML = `<tr><td colspan="6" class="p-6 text-center text-red-500 font-bold">Error cargando productos.</td></tr>`;
    }
}

function renderProducts() {
    const tbody = document.getElementById('productsTableBody');
    if(currentProducts.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-gray-500 font-bold">No hay productos en la base de datos.</td></tr>`;
        return;
    }
    tbody.innerHTML = currentProducts.map(p => `
        <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors ${p.isOutOfStock ? 'opacity-50 grayscale' : ''}">
            <td class="p-4"><img src="${p.img}" class="w-12 h-12 object-contain bg-white border rounded"></td>
            <td class="p-4 font-bold text-gray-800">${p.name} <br> ${p.isOutOfStock ? '<span class="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">Agotado</span>' : ''}</td>
            <td class="p-4 font-black text-brandOrange">${format(p.price)}</td>
            <td class="p-4 text-gray-400 line-through text-sm font-bold">${p.oldPrice ? format(p.oldPrice) : '-'}</td>
            <td class="p-4 text-center">
                <button onclick="editProduct(${p.id})" class="text-blue-500 hover:text-blue-700 mr-3"><i class="fa-solid fa-pen"></i></button>
                <button onclick="deleteProduct(${p.id})" class="text-red-500 hover:text-red-700"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function openModal() {
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('pIsOutOfStock').checked = false;
    document.getElementById('modalTitle').innerText = 'Añadir Producto';
    document.getElementById('productModal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('productModal').classList.add('hidden');
}

function editProduct(id) {
    const p = currentProducts.find(x => x.id === id);
    if(!p) return;
    document.getElementById('productId').value = p.id;
    document.getElementById('pName').value = p.name;
    document.getElementById('pPrice').value = p.price;
    document.getElementById('pOldPrice').value = p.oldPrice || '';
    document.getElementById('pImg').value = p.img;
    document.getElementById('pRating').value = p.rating || 5;
    document.getElementById('pIsOutOfStock').checked = p.isOutOfStock === 1;
    
    document.getElementById('modalTitle').innerText = 'Editar Producto';
    document.getElementById('productModal').classList.remove('hidden');
}

async function saveProduct(e) {
    e.preventDefault();
    const id = document.getElementById('productId').value;
    const data = {
        name: document.getElementById('pName').value,
        price: Number(document.getElementById('pPrice').value),
        oldPrice: document.getElementById('pOldPrice').value ? Number(document.getElementById('pOldPrice').value) : null,
        img: document.getElementById('pImg').value,
        rating: Number(document.getElementById('pRating').value),
        isOutOfStock: document.getElementById('pIsOutOfStock').checked
    };

    const url = id ? `${API_URL}/admin/products/${id}` : `${API_URL}/admin/products`;
    const method = id ? 'PUT' : 'POST';

    try {
        const res = await fetchAuth(url, {
            method,
            body: JSON.stringify(data)
        });
        if(res.ok) {
            closeModal();
            loadProducts();
        } else {
            alert("Error al guardar el producto");
        }
    } catch(error) {
        alert("Error de conexión");
    }
}

async function deleteProduct(id) {
    if(!confirm("¿Estás seguro de eliminar este producto?")) return;
    try {
        const res = await fetchAuth(`${API_URL}/admin/products/${id}`, { method: 'DELETE' });
        if(res.ok) loadProducts();
    } catch(e) { alert("Error eliminando producto"); }
}


// --- PEDIDOS ---
async function loadOrders() {
    try {
        const res = await fetchAuth(`${API_URL}/admin/orders`);
        currentOrders = await res.json();
        renderOrders();
    } catch(e) {
        document.getElementById('ordersTableBody').innerHTML = `<tr><td colspan="6" class="p-6 text-center text-red-500 font-bold">Error cargando pedidos.</td></tr>`;
    }
}

function renderOrders() {
    const tbody = document.getElementById('ordersTableBody');
    if(currentOrders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-gray-500 font-bold">No hay pedidos registrados.</td></tr>`;
        return;
    }
    tbody.innerHTML = currentOrders.map(o => {
        const badgeColor = o.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 
                          (o.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700');
        return `
        <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
            <td class="p-4 font-bold text-gray-800">#${o.id}</td>
            <td class="p-4 text-sm">${o.customerName || 'N/A'}</td>
            <td class="p-4 font-black">${format(o.totalAmount)}</td>
            <td class="p-4"><span class="px-2 py-1 rounded text-xs font-bold ${badgeColor}">${o.status}</span></td>
            <td class="p-4 text-xs text-gray-500">${new Date(o.createdAt).toLocaleString()}</td>
            <td class="p-4 text-center">
                <button onclick="viewOrder(${o.id})" class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded-full text-xs font-bold transition-all"><i class="fa-solid fa-eye"></i> Ver</button>
            </td>
        </tr>
    `}).join('');
}

function viewOrder(id) {
    const o = currentOrders.find(x => x.id === id);
    if(!o) return;
    
    activeOrderId = id;
    document.getElementById('oId').innerText = id;
    document.getElementById('oName').innerText = o.customerName || 'N/A';
    document.getElementById('oEmail').innerText = o.customerEmail || 'N/A';
    document.getElementById('oPhone').innerText = o.customerPhone || 'N/A';
    document.getElementById('oAddress').innerText = o.customerAddress || 'N/A';
    document.getElementById('oCity').innerText = o.customerCity || 'N/A';
    document.getElementById('oTotal').innerText = format(o.totalAmount);

    document.getElementById('oItems').innerHTML = o.items.map(i => `
        <li class="flex justify-between items-center bg-white p-2 border rounded text-sm">
            <div class="flex items-center gap-2">
                <span class="font-bold text-brandBlue">${i.quantity}x</span> 
                <span class="truncate w-40">${i.name || 'Producto #' + i.productId}</span>
            </div>
            <span class="font-bold">${i.price ? format(i.price * i.quantity) : ''}</span>
        </li>
    `).join('');

    document.getElementById('orderModal').classList.remove('hidden');
}

function closeOrderModal() {
    document.getElementById('orderModal').classList.add('hidden');
    activeOrderId = null;
}

async function updateOrderStatus(status) {
    if(!activeOrderId) return;
    try {
        const res = await fetchAuth(`${API_URL}/admin/orders/${activeOrderId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
        if(res.ok) {
            closeOrderModal();
            loadOrders();
        } else {
            alert("Error al actualizar");
        }
    } catch(e) { alert("Error de conexión"); }
}

// Init
window.addEventListener('DOMContentLoaded', loadProducts);
