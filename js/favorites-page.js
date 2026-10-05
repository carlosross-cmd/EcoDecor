document.addEventListener("DOMContentLoaded", () => {
    const container = document.querySelector("#favoriteProducts");
    if (!container) return;

    const favoriteIds = getFavorites();
    const favoriteProducts = PRODUCTS.filter(product => favoriteIds.includes(product.id));

    if (!favoriteProducts.length) {
        container.innerHTML = `
            <div class="empty-state">
                <h2>Você ainda não tem favoritos</h2>
                <p>Toque no coração de um produto para guardá-lo aqui.</p>
                <a class="button button-primary" href="produtos.html">Explorar produtos</a>
            </div>
        `;
        return;
    }

    renderProducts(container, favoriteProducts);
});
