const API_URL = 'https://shop-todomio.onrender.com';

let products = [];
let cart = [];

// 1. OBTENER PRODUCTOS (GET al Backend)
async function fetchProductsFromBackend() {
    try {
        const response = await fetch(`${API_URL}/products`);
        if (!response.ok) throw new Error("Error en red");
        return await response.json();
    } catch (error) {
        console.error("Error conectando al backend local.", error);
        return [];
    }
}

// 2. PROCESAR ORDEN (POST al Backend)
async function procederPagoBackend() {
    if(cart.length === 0) return;
    
    const btn = document.getElementById('payBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Procesando Pago...`;
    
    try {
        const orderData = {
            items: cart.map(item => ({ productId: item.id, name: item.name, quantity: item.qty, price: item.price, img: item.img })),
            totalAmount: cart.reduce((s, i) => s + (i.price * i.qty), 0),
            customerInfo: {
                name: "Cliente Invitado",
                email: "invitado@correo.com",
                address: "Calle Falsa 123",
                city: "Ciudad",
                phone: "3001234567"
            }
        };

        const response = await fetch(`${API_URL}/checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        
        if (!response.ok) throw new Error("Fallo en la compra al backend");
        
        gsap.to(document.body, {backgroundColor: '#e6fffa', duration: 0.3, yoyo: true, repeat: 1});
        
        alert("¡Orden registrada con éxito en la base de datos TodoMío!");
        cart = [];
        update();
    } catch(error) {
        alert("Error de conexión con el servidor. " + error.message);
    } finally {
        btn.innerHTML = originalText;
    }
}

// ==========================================
// LÓGICA DE INTERFAZ (Frontend)
// ==========================================

function render() {
    const grid = document.getElementById('grid');
    if (products.length === 0) {
        grid.innerHTML = '<div class="col-span-full text-center py-10"><i class="fa-solid fa-triangle-exclamation text-4xl text-red-400 mb-3"></i><p class="text-gray-500 font-bold">No se pudieron cargar los productos. Verifica que el servidor (Render) esté encendido.</p></div>';
        return;
    }
    grid.innerHTML = products.map(p => {
        const discount = p.oldPrice ? Math.round((1 - p.price/p.oldPrice)*100) : 0;
        const outOfStock = p.isOutOfStock === 1;
        
        let starsHTML = '';
        for(let i=0; i<5; i++) {
            starsHTML += i < (p.rating || 5) ? '<i class="fa-solid fa-star text-yellow-500 text-[10px]"></i>' : '<i class="fa-regular fa-star text-gray-200 text-[10px]"></i>';
        }

        return `
        <div class="product-card bg-white p-4 rounded-xl border border-gray-100 relative group flex flex-col ${outOfStock ? 'opacity-80' : ''}">
            ${outOfStock ? '<div class="out-of-stock-overlay">AGOTADO</div>' : ''}
            ${discount && !outOfStock ? `<span class="absolute top-2 left-2 bg-gradient-to-r from-red-600 to-orange-500 text-white font-black text-[10px] px-2 py-1 rounded-lg z-10 shadow-md">-${discount}%</span>` : ''}
            <div class="h-40 flex items-center justify-center bg-gray-50 rounded-xl mb-3 p-2 overflow-hidden relative">
                <img src="${p.img}" class="max-h-full object-contain mix-blend-multiply ${outOfStock ? 'img-agotado' : 'group-hover:scale-105'} transition-transform duration-300">
            </div>
            <h3 class="font-bold text-gray-800 text-sm leading-tight line-clamp-2 w-full mb-1 h-10">${p.name}</h3>
            <div class="mb-2 flex w-full justify-start gap-0.5">${starsHTML}</div>
            <div class="mb-3 flex-grow flex flex-col justify-end">
                ${p.oldPrice ? `<p class="text-[10px] text-gray-400 line-through font-bold">${format(p.oldPrice)}</p>` : ''}
                <div class="flex items-center gap-2">
                    <p class="text-xl font-black text-red-600">${format(p.price)}</p>
                </div>
            </div>
            <button onclick="add(${p.id}, this)" ${outOfStock ? 'disabled' : ''} class="mt-auto w-full ${outOfStock ? 'bg-gray-300 cursor-not-allowed' : 'btn-primary'} text-white font-black py-2.5 rounded-full shadow-md active:scale-95 transition-all duration-200 flex justify-center items-center gap-2 text-sm">
                <i class="fa-solid fa-cart-shopping"></i> ${outOfStock ? 'Agotado' : 'Añadir'}
            </button>
        </div>`;
    }).join('');

    gsap.from(".product-card", {
        y: 30,
        opacity: 0,
        duration: 0.5,
        stagger: 0.05,
        ease: "power2.out"
    });
}

function add(id, btnElement) {
    if(btnElement) gsap.to(btnElement, { scale: 0.9, duration: 0.1, yoyo: true, repeat: 1 });
    const p = products.find(x => x.id === id);
    if(p.isOutOfStock) return;
    
    const item = cart.find(x => x.id === id);
    item ? item.qty++ : cart.push({...p, qty: 1});
    update();
    gsap.fromTo("#cartCount", { scale: 1.5 }, { scale: 1, duration: 0.3, ease: "bounce.out" });
}

function decreaseQty(id) {
    const item = cart.find(x => x.id === id);
    if(!item) return;
    item.qty--;
    if(item.qty <= 0) {
        removeFromCart(id);
    } else {
        update();
    }
}

function removeFromCart(id) {
    cart = cart.filter(x => x.id !== id);
    update();
}

function format(n) { return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n); }

function update() {
    const container = document.getElementById('cartItems');
    const count = cart.reduce((s, i) => s + i.qty, 0);
    const total = cart.reduce((s, i) => s + (i.price * i.qty), 0);
    const sub = cart.reduce((s, i) => s + ((i.oldPrice || i.price) * i.qty), 0);

    document.getElementById('cartCount').innerText = count;
    document.getElementById('total').innerText = format(total);
    document.getElementById('subtotal').innerText = format(sub);
    
    const savings = sub - total;
    const sBox = document.getElementById('savingsBox');
    if(savings > 0) {
        sBox.classList.remove('hidden');
        document.getElementById('savingsVal').innerText = format(savings);
    } else { sBox.classList.add('hidden'); }

    const btn = document.getElementById('payBtn');
    if(count > 0) {
        btn.disabled = false;
        btn.className = "w-full bg-offerRed text-white py-4 rounded-full font-black text-lg uppercase shadow-lg hover:bg-red-700 transition-all transform animate-bounce-short";
        container.innerHTML = cart.map(i => `
            <div class="flex items-center gap-3 border-b border-gray-100 pb-3">
                <img src="${i.img}" class="w-12 h-12 rounded-lg bg-gray-50 object-contain p-1 border">
                <div class="flex-grow">
                    <p class="text-xs font-black truncate w-32 tracking-tight">${i.name}</p>
                    <p class="text-xs font-bold text-brandBlue">${format(i.price)}</p>
                </div>
                <!-- Controles Cantidad -->
                <div class="flex items-center bg-gray-100 rounded-lg overflow-hidden">
                    <button onclick="decreaseQty(${i.id})" class="px-2 py-1 hover:bg-gray-200 text-gray-600 transition">-</button>
                    <span class="text-xs font-black w-4 text-center">${i.qty}</span>
                    <button onclick="add(${i.id}, null)" class="px-2 py-1 hover:bg-gray-200 text-gray-600 transition">+</button>
                </div>
                <!-- Basurero -->
                <button onclick="removeFromCart(${i.id})" class="text-gray-300 hover:text-red-500 transition-colors ml-1">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
        `).join('');
    } else {
        btn.disabled = true;
        btn.className = "w-full bg-gray-200 text-gray-400 py-4 rounded-full font-black text-lg uppercase cursor-not-allowed";
        container.innerHTML = `<p class="text-center text-gray-400 py-10 font-bold"><i class="fa-solid fa-basket-shopping text-3xl mb-2 opacity-50 block"></i>Tu carrito está vacío</p>`;
    }
}

// ==========================================
// INICIALIZACIÓN
// ==========================================
async function initApp() {
    document.getElementById('grid').innerHTML = '<div class="col-span-full text-center py-10 text-gray-400"><i class="fa-solid fa-spinner fa-spin text-3xl mb-3"></i><p>Conectando con TodoMío...</p></div>';
    products = await fetchProductsFromBackend();
    render();
    update();
}

window.addEventListener('DOMContentLoaded', initApp);
