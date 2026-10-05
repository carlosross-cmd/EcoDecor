/**
 * ============================================
 * ECODECOR - MEUS PEDIDOS
 * ============================================
 * Exibe os pedidos do navegador em um formato
 * semelhante a vitrines de acompanhamento de
 * grandes lojas online, sem depender de uma nova API.
 */

const ORDER_STATUSES = {
    pendente: "Pendente",
    preparando: "Preparando",
    enviado: "Enviado",
    concluido: "Concluído",
    cancelado: "Cancelado"
};

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function normalizeStatus(status) {
    const normalized = String(status || "Pendente")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    if (normalized.includes("cancel")) return "cancelado";
    if (normalized.includes("conclu") || normalized.includes("finaliz")) return "concluido";
    if (normalized.includes("envi")) return "enviado";
    if (normalized.includes("prepar")) return "preparando";
    return "pendente";
}

function getStatusLabel(status) {
    return ORDER_STATUSES[normalizeStatus(status)] || ORDER_STATUSES.pendente;
}

function getStatusClass(status) {
    return `status-${normalizeStatus(status)}`;
}

function formatOrderDate(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Data não informada";
    }

    return date.toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short"
    });
}

function getItemQuantity(items) {
    return items.reduce(
        (total, item) => total + (Number(item.quantity) || 0),
        0
    );
}

function getLineTotal(item) {
    return (Number(item.price) || 0) * (Number(item.quantity) || 0);
}

function getOrderFilterStatus(order) {
    const status = normalizeStatus(order.status);

    if (status === "pendente") return "pendente";
    if (["preparando", "enviado"].includes(status)) return "andamento";
    if (status === "concluido") return "concluido";
    if (status === "cancelado") return "cancelado";

    return "pendente";
}

function getProgressSteps(status) {
    const key = normalizeStatus(status);

    if (key === "cancelado") {
        return [
            { label: "Pedido", done: true, current: false },
            { label: "Cancelado", done: true, current: true },
            { label: "Encerrado", done: true, current: false }
        ];
    }

    const progress = {
        pendente: 0,
        preparando: 1,
        enviado: 2,
        concluido: 3
    }[key] ?? 0;

    const labels = ["Pedido recebido", "Preparando", "Enviado", "Concluído"];

    return labels.map((label, index) => ({
        label,
        done: index <= progress,
        current: index === progress
    }));
}

function renderStatusTracker(status) {
    const steps = getProgressSteps(status);

    return `
        <div class="order-tracker" aria-label="Etapas do pedido">
            ${steps.map((step, index) => `
                <div class="tracker-step ${step.done ? "is-done" : ""} ${step.current ? "is-current" : ""}">
                    <span class="tracker-dot" aria-hidden="true">
                        ${step.done ? "✓" : index + 1}
                    </span>
                    <span class="tracker-label">${escapeHtml(step.label)}</span>
                </div>
                ${index < steps.length - 1 ? '<span class="tracker-line" aria-hidden="true"></span>' : ""}
            `).join("")}
        </div>
    `;
}

function renderOrderItems(items) {
    if (!items.length) {
        return `
            <div class="order-items-empty">
                Os produtos deste pedido não estão disponíveis neste navegador.
            </div>
        `;
    }

    return items.map(item => `
        <div class="ordered-product">
            <div class="ordered-product-image">
                <img
                    src="${escapeHtml(item.image || "")}" 
                    alt="${escapeHtml(item.name || "Produto")}" 
                    loading="lazy"
                >
            </div>

            <div class="ordered-product-info">
                <strong>${escapeHtml(item.name || "Produto")}</strong>
                <span>${escapeHtml(item.category || "EcoDecor")}</span>
                <small>Quantidade: ${Number(item.quantity) || 0}</small>
            </div>

            <div class="ordered-product-price">
                <span>${formatCurrency(Number(item.price) || 0)} / un.</span>
                <strong>${formatCurrency(getLineTotal(item))}</strong>
            </div>
        </div>
    `).join("");
}

function renderOrder(order, index) {
    const customer = order.customer || {};
    const items = Array.isArray(order.items) ? order.items : [];
    const statusLabel = getStatusLabel(order.status);
    const statusClass = getStatusClass(order.status);
    const itemCount = getItemQuantity(items);
    const detailsId = `order-details-${index}`;
    const address = customer.endereco_entrega || [
        customer.rua,
        customer.numero,
        customer.complemento,
        customer.bairro,
        customer.cidade,
        customer.uf
    ].filter(Boolean).join(", ");

    const payment = customer.forma_pagamento || "Não informado";
    const paymentStatus = order.payment_status || "Não informado";
    const subtotal = Number(order.subtotal) || 0;
    const delivery = Number(order.delivery ?? order.entrega) || 0;
    const total = Number(order.total) || 0;

    return `
        <article class="order-card" data-order-status="${escapeHtml(getOrderFilterStatus(order))}">

            <div class="order-card-header">
                <div class="order-card-identification">
                    <span class="order-number">${escapeHtml(order.id || order.codigo_pedido || "Pedido")}</span>
                    <span class="order-date">${escapeHtml(formatOrderDate(order.created_at))}</span>
                </div>

                <span class="status-pill ${statusClass}">
                    ${escapeHtml(statusLabel)}
                </span>
            </div>

            <div class="order-card-main">
                <div class="order-card-heading">
                    <div>
                        <span class="order-section-label">PEDIDO</span>
                        <h2>${escapeHtml(customer.nome_cliente || "Cliente EcoDecor")}</h2>
                    </div>
                    <span class="order-items-count">
                        ${itemCount} ${itemCount === 1 ? "item" : "itens"}
                    </span>
                </div>

                <div class="ordered-products">
                    ${renderOrderItems(items)}
                </div>

                ${renderStatusTracker(order.status)}
            </div>

            <div class="order-card-footer">
                <div class="order-total-info">
                    <span>Total do pedido</span>
                    <strong>${formatCurrency(total)}</strong>
                </div>

                <button
                    class="order-details-button"
                    type="button"
                    data-toggle-order="${detailsId}"
                    aria-expanded="false"
                    aria-controls="${detailsId}"
                >
                    Ver detalhes
                    <span aria-hidden="true">⌄</span>
                </button>
            </div>

            <div class="order-details" id="${detailsId}" hidden>
                <div class="order-details-grid">
                    <section class="order-detail-box">
                        <span>Entrega</span>
                        <strong>${escapeHtml(address || "Endereço não informado")}</strong>
                    </section>

                    <section class="order-detail-box">
                        <span>Pagamento</span>
                        <strong>${escapeHtml(payment)}</strong>
                        <small>${escapeHtml(paymentStatus)}</small>
                    </section>

                    <section class="order-detail-box">
                        <span>Resumo financeiro</span>
                        <div class="order-financial-line">
                            <span>Subtotal</span>
                            <strong>${formatCurrency(subtotal)}</strong>
                        </div>
                        <div class="order-financial-line">
                            <span>Entrega</span>
                            <strong>${formatCurrency(delivery)}</strong>
                        </div>
                        <div class="order-financial-line total-line">
                            <span>Total</span>
                            <strong>${formatCurrency(total)}</strong>
                        </div>
                    </section>
                </div>

                ${customer.observacoes ? `
                    <div class="order-note">
                        <span>Observações</span>
                        <p>${escapeHtml(customer.observacoes)}</p>
                    </div>
                ` : ""}
            </div>
        </article>
    `;
}

function renderEmptyState(message = "Quando você registrar um pedido, ele aparecerá nesta área.") {
    return `
        <div class="empty-state orders-empty-state">
            <div class="empty-state-icon" aria-hidden="true">🛍</div>
            <h2>Nenhum pedido encontrado</h2>
            <p>${escapeHtml(message)}</p>
            <a class="button button-primary" href="produtos.html">Explorar produtos</a>
        </div>
    `;
}

function setupOrderInteractions(container) {
    container.querySelectorAll("[data-toggle-order]").forEach(button => {
        button.addEventListener("click", () => {
            const details = document.getElementById(button.dataset.toggleOrder);
            if (!details) return;

            const isHidden = details.hasAttribute("hidden");

            if (isHidden) {
                details.removeAttribute("hidden");
                button.setAttribute("aria-expanded", "true");
                button.innerHTML = 'Ocultar detalhes <span aria-hidden="true">⌃</span>';
            } else {
                details.setAttribute("hidden", "");
                button.setAttribute("aria-expanded", "false");
                button.innerHTML = 'Ver detalhes <span aria-hidden="true">⌄</span>';
            }
        });
    });
}

function setupOrderFilters(container, orders) {
    const tabs = container.querySelectorAll("[data-order-filter]");
    const cards = container.querySelectorAll(".order-card");
    const resultCount = container.querySelector("#ordersResultCount");

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            const filter = tab.dataset.orderFilter;

            tabs.forEach(item => {
                const active = item === tab;
                item.classList.toggle("is-active", active);
                item.setAttribute("aria-selected", String(active));
            });

            let visible = 0;

            cards.forEach(card => {
                const matches = filter === "todos" || card.dataset.orderStatus === filter;
                card.classList.toggle("is-filtered-out", !matches);

                if (matches) visible += 1;
            });

            if (resultCount) {
                resultCount.textContent = `${visible} ${visible === 1 ? "pedido encontrado" : "pedidos encontrados"}`;
            }
        });
    });
}

function buildOrdersPage() {
    const root = document.querySelector("#ordersList");
    if (!root) return;

    let orders = [];

    try {
        orders = JSON.parse(localStorage.getItem("ecodecor_orders") || "[]");
    } catch (error) {
        console.error("Não foi possível ler os pedidos do navegador:", error);
    }

    if (!Array.isArray(orders) || !orders.length) {
        root.innerHTML = renderEmptyState();
        return;
    }

    orders = [...orders].reverse();

    const counts = {
        todos: orders.length,
        pendente: orders.filter(order => getOrderFilterStatus(order) === "pendente").length,
        andamento: orders.filter(order => getOrderFilterStatus(order) === "andamento").length,
        concluido: orders.filter(order => getOrderFilterStatus(order) === "concluido").length,
        cancelado: orders.filter(order => getOrderFilterStatus(order) === "cancelado").length
    };

    root.innerHTML = `
        <div class="orders-toolbar">
            <div>
                <span class="orders-toolbar-label">SEU HISTÓRICO</span>
                <h2>Pedidos realizados</h2>
                <p id="ordersResultCount">${counts.todos} ${counts.todos === 1 ? "pedido encontrado" : "pedidos encontrados"}</p>
            </div>

            <a class="orders-shop-link" href="produtos.html">
                Continuar comprando →
            </a>
        </div>

        <div class="order-filter-tabs" role="tablist" aria-label="Filtrar pedidos">
            <button type="button" class="order-filter-tab is-active" data-order-filter="todos" role="tab" aria-selected="true">
                Todos <span>${counts.todos}</span>
            </button>
            <button type="button" class="order-filter-tab" data-order-filter="pendente" role="tab" aria-selected="false">
                Pendentes <span>${counts.pendente}</span>
            </button>
            <button type="button" class="order-filter-tab" data-order-filter="andamento" role="tab" aria-selected="false">
                Em andamento <span>${counts.andamento}</span>
            </button>
            <button type="button" class="order-filter-tab" data-order-filter="concluido" role="tab" aria-selected="false">
                Concluídos <span>${counts.concluido}</span>
            </button>
            <button type="button" class="order-filter-tab" data-order-filter="cancelado" role="tab" aria-selected="false">
                Cancelados <span>${counts.cancelado}</span>
            </button>
        </div>

        <div class="orders-results">
            ${orders.map(renderOrder).join("")}
        </div>
    `;

    setupOrderInteractions(root);
    setupOrderFilters(root, orders);
}

document.addEventListener("DOMContentLoaded", buildOrdersPage);
