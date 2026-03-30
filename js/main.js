const API_URL = 'https://shop-todomio.onrender.com/v1';

let products = [];
let cart = [];
let filtered = [];

// 1. OBTENER PRODUCTOS (GET al Backend)
async function fetchProductsFromBackend() {
    try {
        const response = await fetch(`${API_URL}/products`);
        if (!response.ok) throw new Error("Error en red");
        return await response.json();
    } catch (error) {
        console.error("Error conectando al backend.", error);
        return [];
    }
}

// 2. PROCESAR ORDEN (POST al Backend)
async function procederPagoBackend() {
    if(cart.length === 0) return;
    
    const btn = document.getElementById('payBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Procesando...`;
    
    try {
        const name = localStorage.getItem('customerName') || 'Cliente Invitado';
        const email = localStorage.getItem('customerEmail') || 'invitado@correo.com';
        
        const orderData = {
            items: cart.map(item => ({ productId: item.id, name: item.name, quantity: item.qty, price: item.price, img: item.img })),
            totalAmount: cart.reduce((s, i) => s + (i.price * i.qty), 0),
            customerInfo: { name, email, address: 'Sin especificar', city: 'Sin especificar', phone: '000' }
        };

        const response = await fetch(`${API_URL}/checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        
        if (!response.ok) throw new Error("Fallo en la compra");
        
        alert("¡Orden registrada con éxito en TodoMío!");
        cart = [];
        update();
        updateCartToggle(false);
    } catch(error) {
        alert("Error de conexión con el servidor. " + error.message);
    } finally {
        btn.innerHTML = originalText;
    }
}

// ==========================================
// BÚSQUEDA EN VIVO
// ==========================================
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchDropdown = document.getElementById('searchDropdown');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        if (query.length < 1) {
            searchDropdown.classList.add('hidden');
            filtered = products;
            renderProducts(filtered);
            return;
        }

        filtered = products.filter(p => p.name.toLowerCase().includes(query));
        
        // Dropdown de sugerencias
        if (filtered.length > 0) {
            searchDropdown.innerHTML = filtered.slice(0, 6).map(p => `
                <div onclick="selectProduct(${p.id})" class="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors">
                    <img src="${p.img}" class="w-10 h-10 object-contain rounded bg-gray-100 p-1">
                    <div>
                        <p class="text-sm font-bold text-gray-800 truncate">${p.name}</p>
                        <p class="text-xs text-red-500 font-black">${format(p.price)}</p>
                    </div>
                </div>
            `).join('');
            searchDropdown.classList.remove('hidden');
        } else {
            searchDropdown.innerHTML = '<p class="text-center text-gray-400 py-4 text-sm">Sin resultados</p>';
            searchDropdown.classList.remove('hidden');
        }
        
        // Actualizar grid principal con filtro
        renderProducts(filtered);
    });

    // Cerrar dropdown al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (!searchInput.closest('.search-wrapper').contains(e.target)) {
            searchDropdown.classList.add('hidden');
        }
    });
}

function selectProduct(id) {
    const p = products.find(x => x.id === id);
    if (!p) return;
    document.getElementById('searchInput').value = p.name;
    document.getElementById('searchDropdown').classList.add('hidden');
    renderProducts([p]);
    document.getElementById('grid').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ==========================================
// RENDERIZADO
// ==========================================
function renderProducts(list) {
    const grid = document.getElementById('grid');
    if (!list || list.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center py-10">
            <i class="fa-solid fa-triangle-exclamation text-4xl text-amber-400 mb-3 block"></i>
            <p class="text-gray-500 font-bold">No se encontraron productos.</p>
            <button onclick="renderProducts(products); document.getElementById('searchInput').value=''" class="mt-3 text-brandOrange font-bold text-sm hover:underline">Ver todos</button>
        </div>`;
        return;
    }
    grid.innerHTML = list.map(p => {
        const discount = p.oldPrice ? Math.round((1 - p.price/p.oldPrice)*100) : 0;
        const outOfStock = p.isOutOfStock === 1;
        let starsHTML = '';
        for(let i=0; i<5; i++) {
            starsHTML += i < (p.rating || 5) ? '<i class="fa-solid fa-star text-yellow-500 text-[10px]"></i>' : '<i class="fa-regular fa-star text-gray-200 text-[10px]"></i>';
        }
        return `
        <div class="product-card bg-white p-4 rounded-xl border border-gray-100 relative group flex flex-col ${outOfStock ? 'opacity-70' : ''}">
            ${outOfStock ? '<div class="out-of-stock-overlay">AGOTADO</div>' : ''}
            ${discount && !outOfStock ? `<span class="absolute top-2 left-2 bg-gradient-to-r from-red-600 to-orange-500 text-white font-black text-[10px] px-2 py-1 rounded-lg z-10 shadow-md">-${discount}%</span>` : ''}
            <div class="h-40 flex items-center justify-center bg-gray-50 rounded-xl mb-3 p-2 overflow-hidden relative">
                <img src="${p.img}" class="max-h-full object-contain mix-blend-multiply ${outOfStock ? 'img-agotado' : 'group-hover:scale-105'} transition-transform duration-300">
            </div>
            <h3 class="font-bold text-gray-800 text-sm leading-tight line-clamp-2 w-full mb-1 h-10">${p.name}</h3>
            <div class="mb-2 flex w-full justify-start gap-0.5">${starsHTML}</div>
            <div class="mb-3 flex-grow flex flex-col justify-end">
                ${p.oldPrice ? `<p class="text-[10px] text-gray-400 line-through font-bold">${format(p.oldPrice)}</p>` : ''}
                <p class="text-xl font-black text-red-600">${format(p.price)}</p>
                ${p.oldPrice ? `<p class="text-[10px] text-green-600 font-bold mt-0.5">Ahorras ${format(p.oldPrice - p.price)}</p>` : ''}
            </div>
            <button onclick="add(${p.id}, this)" ${outOfStock ? 'disabled' : ''} 
                class="mt-auto w-full ${outOfStock ? 'bg-gray-300 cursor-not-allowed text-gray-500' : 'btn-primary'} font-black py-2.5 rounded-full shadow-md active:scale-95 transition-all text-sm flex justify-center items-center gap-2">
                <i class="fa-solid fa-cart-shopping"></i> ${outOfStock ? 'Agotado' : 'Añadir'}
            </button>
        </div>`;
    }).join('');

    gsap.from(".product-card", { y: 20, opacity: 0, duration: 0.4, stagger: 0.04, ease: "power2.out" });
}

// ==========================================
// CARRITO
// ==========================================
function updateCartToggle(isOpen) {
    const cartPanel = document.getElementById('cartPanel');
    const cartFab = document.getElementById('cartFab');
    if (!cartPanel) return;
    if (isOpen && cart.length > 0) {
        cartPanel.classList.remove('hidden');
        cartFab && cartFab.classList.add('hidden');
    } else {
        cartPanel.classList.add('hidden');
        // Mostrar FAB solo si hay items
        cartFab && (cart.length > 0 ? cartFab.classList.remove('hidden') : cartFab.classList.add('hidden'));
    }
}

function add(id, btnElement) {
    if(btnElement) gsap.to(btnElement, { scale: 0.9, duration: 0.1, yoyo: true, repeat: 1 });
    const p = products.find(x => x.id === id);
    if (!p || p.isOutOfStock) return;
    const item = cart.find(x => x.id === id);
    item ? item.qty++ : cart.push({...p, qty: 1});
    update();
    // Abrir carrito al añadir
    updateCartToggle(true);
    gsap.fromTo("#cartCount", { scale: 1.5 }, { scale: 1, duration: 0.3, ease: "bounce.out" });
}

function decreaseQty(id) {
    const item = cart.find(x => x.id === id);
    if (!item) return;
    item.qty--;
    if (item.qty <= 0) removeFromCart(id);
    else update();
}

function removeFromCart(id) {
    cart = cart.filter(x => x.id !== id);
    update();
    if (cart.length === 0) updateCartToggle(false);
}

function format(n) { return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n); }

function update() {
    const container = document.getElementById('cartItems');
    const count = cart.reduce((s, i) => s + i.qty, 0);
    const total = cart.reduce((s, i) => s + (i.price * i.qty), 0);
    const sub = cart.reduce((s, i) => s + ((i.oldPrice || i.price) * i.qty), 0);

    document.getElementById('cartCount').innerText = count;
    const totalEl = document.getElementById('total');
    const subtotalEl = document.getElementById('subtotal');
    if (totalEl) totalEl.innerText = format(total);
    if (subtotalEl) subtotalEl.innerText = format(sub);
    
    const savings = sub - total;
    const sBox = document.getElementById('savingsBox');
    if (sBox) savings > 0 ? (sBox.classList.remove('hidden'), document.getElementById('savingsVal').innerText = format(savings)) : sBox.classList.add('hidden');

    // FAB badge
    const fabCount = document.getElementById('fabCount');
    if(fabCount) fabCount.innerText = count;

    const btn = document.getElementById('payBtn');
    if (count > 0) {
        btn.disabled = false;
        btn.className = "w-full bg-offerRed text-white py-3.5 rounded-full font-black text-base uppercase shadow-lg hover:bg-red-700 transition-all";
        container.innerHTML = cart.map(i => `
            <div class="flex items-center gap-2 border-b border-gray-100 pb-3">
                <img src="${i.img}" class="w-12 h-12 rounded-lg bg-gray-50 object-contain p-1 border flex-shrink-0">
                <div class="flex-grow min-w-0">
                    <p class="text-xs font-black truncate">${i.name}</p>
                    <p class="text-xs font-bold text-brandBlue">${format(i.price)}</p>
                </div>
                <div class="flex items-center bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <button onclick="decreaseQty(${i.id})" class="px-2 py-1 hover:bg-gray-200 transition text-gray-600 font-black">-</button>
                    <span class="text-xs font-black w-5 text-center">${i.qty}</span>
                    <button onclick="add(${i.id}, null)" class="px-2 py-1 hover:bg-gray-200 transition text-gray-600 font-black">+</button>
                </div>
                <button onclick="removeFromCart(${i.id})" class="text-gray-300 hover:text-red-500 transition ml-1 flex-shrink-0">
                    <i class="fa-solid fa-trash-can text-sm"></i>
                </button>
            </div>
        `).join('');
    } else {
        btn.disabled = true;
        btn.className = "w-full bg-gray-200 text-gray-400 py-3.5 rounded-full font-black text-base uppercase cursor-not-allowed";
        container.innerHTML = `<p class="text-center text-gray-400 py-8 font-bold text-sm"><i class="fa-solid fa-basket-shopping text-2xl mb-2 block opacity-40"></i>Tu carrito está vacío</p>`;
    }
}

// ==========================================
// INICIALIZACIÓN
// ==========================================
async function initApp() {
    document.getElementById('grid').innerHTML = '<div class="col-span-full text-center py-12 text-gray-400"><i class="fa-solid fa-spinner fa-spin text-3xl mb-3 block"></i><p>Cargando productos...</p></div>';
    products = await fetchProductsFromBackend();
    filtered = products;
    renderProducts(products);
    update();
    setupSearch();
    // Carrito oculto al inicio
    updateCartToggle(false);
}

window.addEventListener('DOMContentLoaded', initApp);
