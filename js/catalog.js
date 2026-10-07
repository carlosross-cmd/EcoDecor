const allProductsContainer = document.querySelector("#allProducts");
const filtersContainer = document.querySelector("#categoryFilters");
const searchInput = document.querySelector("#productSearch");

let activeCategory = "Todos";

function renderFilters() {
    const categories = ["Todos", ...new Set(PRODUCTS.map(product => product.category))];

    filtersContainer.innerHTML = categories.map(category => `
        <button class="filter-button ${category === activeCategory ? "active" : ""}" data-category="${category}">
            ${category}
        </button>
    `).join("");

    filtersContainer.querySelectorAll("[data-category]").forEach(button => {
        button.addEventListener("click", () => {
            activeCategory = button.dataset.category;
            renderFilters();
            filterProducts();
        });
    });
}

function filterProducts() {
    const search = searchInput.value.toLowerCase().trim();

    const filtered = PRODUCTS.filter(product => {
        const matchesCategory = activeCategory === "Todos" || product.category === activeCategory;
        const matchesSearch = `${product.name} ${product.description}`.toLowerCase().includes(search);
        return matchesCategory && matchesSearch;
    });

    renderProducts(allProductsContainer, filtered);
}

document.addEventListener("DOMContentLoaded", () => {
    renderFilters();
    filterProducts();
    searchInput.addEventListener("input", filterProducts);
});

window.addEventListener("products:updated", () => {
    renderFilters();
    filterProducts();
});
