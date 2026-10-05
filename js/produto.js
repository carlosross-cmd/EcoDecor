/* Página de produto: produto.html?id=N  (usa getCart/saveCart/addToCart do app.js, sem alterar o formato do carrinho) */
const pageEl = document.querySelector("#productPage");
const MAX_QTY = 99;

function renderNotFound() {
    pageEl.innerHTML = `
        <div class="pd-empty">
            <h1>Produto não encontrado</h1>
            <p>Esse produto não existe ou foi removido do catálogo.</p>
            <a class="button button-primary" href="produtos.html">Ver todos os produtos</a>
        </div>`;
}

function renderProductPage(product) {
    const d = PRODUCT_DETAILS[product.id] || {};
    const images = d.images && d.images.length ? d.images : [product.image];
    const specs = [
        ["Categoria", product.category],
        ["Material", d.material],
        ["Dimensões", d.dimensoes],
        ["Peso", d.peso],
        ["Origem", d.origem]
    ].filter(row => row[1]);

    document.title = `${product.name} | EcoDecor`;

    pageEl.innerHTML = `
        <nav class="pd-breadcrumb" aria-label="Você está em">
            <a href="index.html">Início</a> <span>/</span> <a href="produtos.html">Produtos</a> <span>/</span> <span>${product.name}</span>
        </nav>

        <section class="pd-top">
            <div class="pd-gallery">
                <div class="pd-main" id="pdMain" tabindex="0" aria-label="Foto do produto. Clique para ampliar">
                    <img id="pdMainImg" src="${images[0]}" alt="${product.name}">
                    ${images.length > 1 ? `
                        <button type="button" class="pd-arrow pd-prev" aria-label="Foto anterior">‹</button>
                        <button type="button" class="pd-arrow pd-next" aria-label="Próxima foto">›</button>` : ""}
                    <span class="pd-zoom-hint">🔍 Passe o mouse para dar zoom</span>
                </div>
                ${images.length > 1 ? `
                    <div class="pd-thumbs">
                        ${images.map((src, i) => `<button type="button" class="pd-thumb${i === 0 ? " active" : ""}" data-index="${i}" aria-label="Ver foto ${i + 1}"><img src="${src}" alt=""></button>`).join("")}
                    </div>` : ""}
            </div>

            <div class="pd-info">
                <span class="product-category">${product.category}</span>
                <h1>${product.name}</h1>
                <p class="pd-price">${formatCurrency(product.price)}</p>
                <p class="pd-short">${product.description}</p>

                <div class="pd-buy">
                    <span class="pd-label">Quantidade</span>
                    <div class="pd-qty">
                        <button type="button" id="qtyMinus" aria-label="Diminuir">−</button>
                        <input id="qtyInput" type="number" min="1" max="${MAX_QTY}" value="1" aria-label="Quantidade">
                        <button type="button" id="qtyPlus" aria-label="Aumentar">+</button>
                    </div>
                    <div class="pd-actions">
                        <button type="button" class="button button-primary" id="addBtn">🛒 Adicionar ao carrinho</button>
                        <button type="button" class="button button-secondary" id="buyBtn">Comprar agora</button>
                        <button type="button" class="favorite-button pd-fav${isFavorite(product.id) ? " is-active" : ""}" id="favBtn" aria-label="Favoritar">${isFavorite(product.id) ? "♥" : "♡"}</button>
                    </div>
                </div>

                <ul class="pd-perks">
                    <li>♻️ Produto sustentável</li>
                    <li>🚚 Frete calculado no checkout</li>
                    <li>🔒 Compra segura</li>
                </ul>
            </div>
        </section>

        <section class="pd-section">
            <h2>Sobre o produto</h2>
            <p>${d.sobre || product.description}</p>
        </section>

        ${specs.length ? `
        <section class="pd-section">
            <h2>Características</h2>
            <dl class="pd-specs">
                ${specs.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}
            </dl>
        </section>` : ""}

        <section class="pd-section pd-eco">
            <h2>♻️ Por que esse produto é sustentável?</h2>
            <div class="pd-eco-grid">
                <article><span>♻️</span><h3>Material consciente</h3><p>${d.eco || "Produzido com materiais naturais ou reaproveitados."}</p></article>
                <article><span>🌱</span><h3>Produção consciente</h3><p>Processo pensado para reduzir desperdícios em cada etapa.</p></article>
                <article><span>📦</span><h3>Embalagem sustentável</h3><p>Embalagem feita com materiais recicláveis.</p></article>
            </div>
        </section>
    `;

    setupGallery(images);
    setupBuy(product);
    setupRelated(product);
}

function setupGallery(images) {
    const main = document.querySelector("#pdMain");
    const img = document.querySelector("#pdMainImg");
    const thumbs = document.querySelectorAll(".pd-thumb");
    const lightbox = document.querySelector("#lightbox");
    const lightboxImg = lightbox.querySelector("img");
    let current = 0;

    function show(index) {
        current = (index + images.length) % images.length;
        img.src = images[current];
        thumbs.forEach((t, i) => t.classList.toggle("active", i === current));
    }

    thumbs.forEach(t => t.addEventListener("click", () => show(Number(t.dataset.index))));
    const prev = main.querySelector(".pd-prev");
    const next = main.querySelector(".pd-next");
    if (prev) prev.addEventListener("click", e => { e.stopPropagation(); show(current - 1); });
    if (next) next.addEventListener("click", e => { e.stopPropagation(); show(current + 1); });

    // Zoom ao passar o mouse
    main.addEventListener("mousemove", e => {
        const r = main.getBoundingClientRect();
        img.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
    });
    main.addEventListener("mouseleave", () => { img.style.transformOrigin = "center"; });

    // Ampliar (lightbox)
    function openLightbox() { lightboxImg.src = images[current]; lightbox.hidden = false; }
    function closeLightbox() { lightbox.hidden = true; }
    main.addEventListener("click", openLightbox);
    lightbox.addEventListener("click", closeLightbox);
    document.addEventListener("keydown", e => {
        if (e.key === "Escape") closeLightbox();
        if (images.length > 1 && lightbox.hidden) {
            if (e.key === "ArrowLeft") show(current - 1);
            if (e.key === "ArrowRight") show(current + 1);
        }
    });

    // Deslizar no celular
    let startX = null;
    main.addEventListener("touchstart", e => { startX = e.touches[0].clientX; }, { passive: true });
    main.addEventListener("touchend", e => {
        if (startX === null || images.length < 2) return;
        const diff = e.changedTouches[0].clientX - startX;
        if (Math.abs(diff) > 50) show(current + (diff < 0 ? 1 : -1));
        startX = null;
    });
}

function setupBuy(product) {
    const input = document.querySelector("#qtyInput");
    const getQty = () => Math.min(MAX_QTY, Math.max(1, parseInt(input.value, 10) || 1));

    document.querySelector("#qtyMinus").addEventListener("click", () => { input.value = Math.max(1, getQty() - 1); });
    document.querySelector("#qtyPlus").addEventListener("click", () => { input.value = Math.min(MAX_QTY, getQty() + 1); });
    input.addEventListener("change", () => { input.value = getQty(); });

    // Mesmo formato de item que addToCart() do app.js usa: { ...product, quantity }
    function addQuantityToCart() {
        const qty = getQty();
        const cart = getCart();
        const existing = cart.find(item => item.id === product.id);
        if (existing) existing.quantity += qty;
        else cart.push({ ...product, quantity: qty });
        saveCart(cart);
        return qty;
    }

    document.querySelector("#addBtn").addEventListener("click", () => {
        const qty = addQuantityToCart();
        showToast(qty > 1 ? `${qty} unidades adicionadas ao carrinho.` : "Produto adicionado ao carrinho.");
    });
    document.querySelector("#buyBtn").addEventListener("click", () => {
        addQuantityToCart();
        window.location.href = "checkout.html";
    });
    const fav = document.querySelector("#favBtn");
    fav.addEventListener("click", () => toggleFavorite(product.id, fav));
}

function setupRelated(product) {
    const sameCategory = PRODUCTS.filter(p => p.id !== product.id && p.category === product.category);
    const others = PRODUCTS.filter(p => p.id !== product.id && p.category !== product.category);
    const related = [...sameCategory, ...others].slice(0, 4);
    if (!related.length) return;
    document.querySelector("#relatedSection").hidden = false;
    renderProducts(document.querySelector("#relatedProducts"), related);
}

document.addEventListener("DOMContentLoaded", () => {
    const id = Number(new URLSearchParams(window.location.search).get("id"));
    const product = PRODUCTS.find(p => p.id === id);
    if (!product) return renderNotFound();
    renderProductPage(product);
});
