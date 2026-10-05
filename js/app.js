const CART_KEY = "ecodecor_cart";
const ORDERS_KEY = "ecodecor_orders";
const FAVORITES_KEY = "ecodecor_favorites";

function getCart() {
    return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCount();
}

function addToCart(productId) {
    const product = PRODUCTS.find(item => item.id === Number(productId));
    if (!product) return;

    const cart = getCart();
    const existing = cart.find(item => item.id === product.id);

    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    saveCart(cart);
    showToast("Produto adicionado ao carrinho.");
}

function removeFromCart(productId) {
    const cart = getCart().filter(item => item.id !== Number(productId));
    saveCart(cart);
    window.location.reload();
}

function updateQuantity(productId, quantity) {
    const cart = getCart();
    const item = cart.find(product => product.id === Number(productId));
    if (!item) return;

    item.quantity = Math.max(1, Number(quantity));
    saveCart(cart);
}

function updateCartCount() {
    const count = getCart().reduce((total, item) => total + item.quantity, 0);
    document.querySelectorAll("#cartCount").forEach(element => {
        element.textContent = count;
    });
}

function getFavorites() {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
}

function saveFavorites(favorites) {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    updateFavoriteCount();
}

function isFavorite(productId) {
    return getFavorites().includes(Number(productId));
}

function toggleFavorite(productId, button) {
    const id = Number(productId);
    let favorites = getFavorites();

    if (favorites.includes(id)) {
        favorites = favorites.filter(favoriteId => favoriteId !== id);
        if (button) button.classList.remove("is-active");
        showToast("Produto removido dos favoritos.");
    } else {
        favorites.push(id);
        if (button) button.classList.add("is-active");
        showToast("Produto adicionado aos favoritos.");
    }

    if (button) button.textContent = favorites.includes(id) ? "♥" : "♡";
    saveFavorites(favorites);
}

function updateFavoriteCount() {
    const count = getFavorites().length;
    document.querySelectorAll("#favoriteCount").forEach(element => {
        element.textContent = count;
    });
}

function formatCurrency(value) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add("visible"), 20);
    setTimeout(() => {
        toast.classList.remove("visible");
        setTimeout(() => toast.remove(), 250);
    }, 2600);
}

function productCard(product) {
    const favorited = isFavorite(product.id);
    return `
        <article class="product-card">
            <div class="product-image-wrap">
                <a href="produto.html?id=${product.id}" aria-label="Ver ${product.name}"><img src="${product.image}" alt="${product.name}" loading="lazy"></a>
                <button class="favorite-button${favorited ? " is-active" : ""}" type="button" data-favorite="${product.id}" aria-label="Favoritar ${product.name}">${favorited ? "♥" : "♡"}</button>
            </div>
            <div class="product-content">
                <span class="product-category">${product.category}</span>
                <h3><a href="produto.html?id=${product.id}">${product.name}</a></h3>
                <p>${product.description}</p>
                <div class="product-bottom">
                    <strong>${formatCurrency(product.price)}</strong>
                    <button class="small-button" type="button" data-add="${product.id}">🛒 Adicionar</button>
                </div>
            </div>
        </article>
    `;
}

function renderProducts(container, products) {
    if (!container) return;
    container.innerHTML = products.map(productCard).join("");

    container.querySelectorAll("[data-add]").forEach(button => {
        button.addEventListener("click", () => addToCart(button.dataset.add));
    });

    container.querySelectorAll("[data-favorite]").forEach(button => {
        button.addEventListener("click", () => toggleFavorite(button.dataset.favorite, button));
    });
}

function setupMenu() {
    const toggle = document.querySelector("#menuToggle");
    const nav = document.querySelector("#mainNav");
    if (!toggle || !nav) return;

    toggle.addEventListener("click", () => {
        const open = nav.classList.toggle("open");
        toggle.setAttribute("aria-expanded", String(open));
    });
}

document.addEventListener("DOMContentLoaded", () => {
    updateCartCount();
    updateFavoriteCount();
    setupMenu();

    const featured = document.querySelector("#featuredProducts");
    if (featured) renderProducts(featured, PRODUCTS.slice(0, 4));
});
