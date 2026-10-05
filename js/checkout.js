/**
 * ============================================
 * ECODECOR - FINALIZAÇÃO DO PEDIDO
 * ============================================
 *
 * Frete:
 * - Sede: Rua São Paulo, 1147 - Victor Konder,
 *   Blumenau - SC
 * - R$ 7,00 de valor base + R$ 3,00 por km
 * - Distância calculada pela rota de carro
 * - CEP continua sendo consultado pela ViaCEP
 */

const FREIGHT_BASE = 7;
const FREIGHT_PER_KM = 3;
const ECODECOR_HEADQUARTERS = {
    street: "Rua São Paulo",
    number: "1147",
    neighborhood: "Victor Konder",
    city: "Blumenau",
    state: "SC",
    postalCode: "89012-001"
};

let calculatedDeliveryFee = null;
let calculatedDistanceKm = null;
let freightRequestId = 0;
let freightTimeout = null;

// ============================================
// UTILITÁRIOS
// ============================================

function onlyDigits(value) {
    return String(value || "").replace(/\D/g, "");
}

function formatCep(value) {
    const digits = onlyDigits(value).slice(0, 8);
    return digits.length > 5
        ? `${digits.slice(0, 5)}-${digits.slice(5)}`
        : digits;
}

function formatCpf(value) {
    const digits = onlyDigits(value).slice(0, 11);
    return digits
        .replace(/^(\d{3})(\d)/, "$1.$2")
        .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
}

function isValidCpf(value) {
    const cpf = onlyDigits(value);
    if (cpf.length !== 11 || /^([0-9])\1{10}$/.test(cpf)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) sum += Number(cpf[i]) * (10 - i);
    let digit = (sum * 10) % 11;
    if (digit === 10) digit = 0;
    if (digit !== Number(cpf[9])) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) sum += Number(cpf[i]) * (11 - i);
    digit = (sum * 10) % 11;
    if (digit === 10) digit = 0;

    return digit === Number(cpf[10]);
}

function getCartSubtotal() {
    const cart = getCart();

    return cart.reduce((total, item) => {
        const price = Number(item.price) || 0;
        const quantity = Number(item.quantity) || 0;
        return total + price * quantity;
    }, 0);
}

function getCurrentDeliveryFee() {
    return Number.isFinite(calculatedDeliveryFee)
        ? calculatedDeliveryFee
        : 0;
}

function updateOrderSummary() {
    const subtotalElement = document.querySelector("#summarySubtotal");
    const deliveryElement = document.querySelector("#summaryDelivery");
    const totalElement = document.querySelector("#summaryTotal");

    const subtotal = getCartSubtotal();
    const delivery = getCurrentDeliveryFee();
    const total = subtotal + delivery;

    if (subtotalElement) {
        subtotalElement.textContent = formatCurrency(subtotal);
    }

    if (deliveryElement) {
        deliveryElement.textContent = formatCurrency(delivery);
    }

    if (totalElement) {
        totalElement.textContent = formatCurrency(total);
    }
}

function setFreightMessage(message, type = "info") {
    const deliveryElement = document.querySelector("#summaryDelivery");
    if (!deliveryElement) return;

    deliveryElement.title = message;
    deliveryElement.dataset.freightStatus = type;
}

function invalidateFreight() {
    calculatedDeliveryFee = null;
    calculatedDistanceKm = null;
    updateOrderSummary();
}

// ============================================
// RENDERIZAÇÃO DO CHECKOUT
// ============================================

function renderCheckout() {
    const cart = getCart();
    const itemsContainer = document.querySelector("#checkoutItems");
    const subtotalElement = document.querySelector("#summarySubtotal");
    const totalElement = document.querySelector("#summaryTotal");

    if (!itemsContainer || !subtotalElement || !totalElement) {
        console.error("Erro: elementos do checkout não encontrados.");
        return;
    }

    if (!cart.length) {
        itemsContainer.innerHTML = `
            <div class="empty-state">
                <p>Seu carrinho está vazio.</p>
                <a class="text-link" href="produtos.html">Voltar aos produtos →</a>
            </div>
        `;

        calculatedDeliveryFee = null;
        calculatedDistanceKm = null;
        updateOrderSummary();
        return;
    }

    itemsContainer.innerHTML = cart.map(item => {
        const price = Number(item.price) || 0;
        const quantity = Number(item.quantity) || 0;

        return `
            <div class="summary-item">
                <img src="${item.image}" alt="${item.name}">
                <div>
                    <strong>${item.name}</strong>
                    <small>${quantity} × ${formatCurrency(price)}</small>
                    <button type="button" class="remove-button" data-remove="${item.id}">
                        Remover
                    </button>
                </div>
            </div>
        `;
    }).join("");

    itemsContainer.querySelectorAll("[data-remove]").forEach(button => {
        button.addEventListener("click", () => {
            removeFromCart(button.dataset.remove);
            invalidateFreight();
            renderCheckout();
        });
    });

    updateOrderSummary();
}

// ============================================
// CEP / CPF / ENDEREÇO
// ============================================

function clearAddressFields() {
    ["rua", "bairro", "cidade", "uf"].forEach(id => {
        const field = document.getElementById(id);
        if (field) field.value = "";
    });

    invalidateFreight();
}

function getAddressData() {
    return {
        cep: onlyDigits(document.getElementById("cep")?.value),
        rua: String(document.getElementById("rua")?.value || "").trim(),
        numero: String(document.getElementById("numero")?.value || "").trim(),
        complemento: String(document.getElementById("complemento")?.value || "").trim(),
        bairro: String(document.getElementById("bairro")?.value || "").trim(),
        cidade: String(document.getElementById("cidade")?.value || "").trim(),
        uf: String(document.getElementById("uf")?.value || "").trim()
    };
}

async function lookupCep() {
    const cepField = document.getElementById("cep");
    if (!cepField) return;

    const cep = onlyDigits(cepField.value);
    clearAddressFields();

    if (!cep) return;

    if (cep.length !== 8) {
        cepField.setCustomValidity("Informe um CEP válido com 8 dígitos.");
        return;
    }

    cepField.setCustomValidity("");

    const rua = document.getElementById("rua");
    if (rua) rua.value = "Consultando...";

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        if (!response.ok) throw new Error("Falha na consulta do CEP.");

        const data = await response.json();

        if (data.erro) {
            throw new Error("CEP não encontrado.");
        }

        document.getElementById("rua").value = data.logradouro || "";
        document.getElementById("bairro").value = data.bairro || "";
        document.getElementById("cidade").value = data.localidade || "";
        document.getElementById("uf").value = data.uf || "";
        cepField.setCustomValidity("");

        invalidateFreight();
        scheduleFreightCalculation();
    } catch (error) {
        clearAddressFields();
        cepField.setCustomValidity(
            error.message || "Não foi possível consultar o CEP."
        );
        showToast(cepField.validationMessage);
    }
}

// ============================================
// CÁLCULO DO FRETE
// ============================================

function buildAddressQuery(address) {
    return [
        address.rua,
        address.numero,
        address.bairro,
        address.cidade,
        address.uf,
        "Brasil"
    ].filter(Boolean).join(", ");
}

function buildHeadquartersQuery() {
    return [
        ECODECOR_HEADQUARTERS.street,
        ECODECOR_HEADQUARTERS.number,
        ECODECOR_HEADQUARTERS.neighborhood,
        ECODECOR_HEADQUARTERS.city,
        ECODECOR_HEADQUARTERS.state,
        "Brasil"
    ].join(", ");
}

async function geocodeAddress(query) {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "1");
    url.searchParams.set("countrycodes", "br");
    url.searchParams.set("q", query);

    const response = await fetch(url.toString(), {
        headers: {
            Accept: "application/json"
        }
    });

    if (!response.ok) {
        throw new Error("Não foi possível localizar o endereço no mapa.");
    }

    const data = await response.json();

    if (!Array.isArray(data) || !data.length) {
        throw new Error("Não foi possível encontrar o endereço informado no mapa.");
    }

    return {
        latitude: Number(data[0].lat),
        longitude: Number(data[0].lon)
    };
}

async function calculateRoute(from, to) {
    const coordinates = `${from.longitude},${from.latitude};${to.longitude},${to.latitude}`;
    const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=false&alternatives=false&steps=false`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Não foi possível calcular a rota da entrega.");
    }

    const data = await response.json();

    if (data.code !== "Ok" || !data.routes?.length) {
        throw new Error("Não foi encontrada uma rota para esse endereço.");
    }

    return Number(data.routes[0].distance) / 1000;
}

async function calculateFreight() {
    const address = getAddressData();

    if (!address.cep || address.cep.length !== 8) return;
    if (!address.rua || !address.numero || !address.bairro || !address.cidade || !address.uf) return;

    const requestId = ++freightRequestId;
    const deliveryElement = document.querySelector("#summaryDelivery");

    if (deliveryElement) {
        deliveryElement.textContent = "Calculando...";
    }

    try {
        const headquarters = await geocodeAddress(buildHeadquartersQuery());

        if (requestId !== freightRequestId) return;

        const customer = await geocodeAddress(buildAddressQuery(address));

        if (requestId !== freightRequestId) return;

        const distanceKm = await calculateRoute(headquarters, customer);

        if (requestId !== freightRequestId) return;

        const roundedDistance = Math.ceil(distanceKm * 10) / 10;
        const freight = Number(
            (FREIGHT_BASE + (roundedDistance * FREIGHT_PER_KM)).toFixed(2)
        );

        calculatedDistanceKm = roundedDistance;
        calculatedDeliveryFee = freight;

        updateOrderSummary();
        setFreightMessage(
            `Distância aproximada: ${roundedDistance.toFixed(1).replace(".", ",")} km`,
            "success"
        );

        console.log("Frete calculado:", {
            distancia_km: roundedDistance,
            valor_frete: freight
        });
    } catch (error) {
        if (requestId !== freightRequestId) return;

        invalidateFreight();
        setFreightMessage(error.message, "error");

        console.error("Erro ao calcular frete:", error);
        showToast(error.message || "Não foi possível calcular o frete.");
    }
}

function scheduleFreightCalculation() {
    clearTimeout(freightTimeout);
    freightTimeout = setTimeout(() => {
        calculateFreight();
    }, 700);
}

function setupAddressAndCpf() {
    const cep = document.getElementById("cep");
    const cpf = document.getElementById("cpf");
    const numero = document.getElementById("numero");
    const complemento = document.getElementById("complemento");

    cep?.addEventListener("input", () => {
        cep.value = formatCep(cep.value);
        cep.setCustomValidity("");
        invalidateFreight();
    });

    cep?.addEventListener("blur", lookupCep);

    cpf?.addEventListener("input", () => {
        cpf.value = formatCpf(cpf.value);
        cpf.setCustomValidity("");
    });

    numero?.addEventListener("input", () => {
        invalidateFreight();
        scheduleFreightCalculation();
    });

    numero?.addEventListener("blur", calculateFreight);

    complemento?.addEventListener("input", () => {
        invalidateFreight();
        scheduleFreightCalculation();
    });
}

// ============================================
// ENVIO DO PEDIDO AO SUPABASE
// ============================================

async function handleCheckoutSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const cart = getCart();

    if (!cart.length) {
        showToast("Adicione algum produto antes de confirmar.");
        return;
    }

    if (!window.supabaseClient) {
        console.error("Erro: window.supabaseClient não foi encontrado.");
        showToast("O Supabase não foi configurado corretamente.");
        return;
    }

    const formData = new FormData(form);

    const nomeCliente = String(formData.get("nome_cliente") || "").trim();
    const telefone = String(formData.get("telefone") || "").trim();
    const cpf = onlyDigits(formData.get("cpf"));
    const cep = onlyDigits(formData.get("cep"));
    const rua = String(formData.get("rua") || "").trim();
    const numero = String(formData.get("numero") || "").trim();
    const complemento = String(formData.get("complemento") || "").trim();
    const bairro = String(formData.get("bairro") || "").trim();
    const cidade = String(formData.get("cidade") || "").trim();
    const uf = String(formData.get("uf") || "").trim();

    const enderecoEntrega = [
        rua,
        numero,
        complemento,
        bairro,
        `${cidade} - ${uf}`,
        `CEP: ${cep}`
    ].filter(Boolean).join(", ");

    const formaPagamento = String(formData.get("forma_pagamento") || "").trim();
    const observacoes = String(formData.get("observacoes") || "").trim();

    if (
        !nomeCliente ||
        !telefone ||
        !cpf ||
        !cep ||
        !rua ||
        !numero ||
        !bairro ||
        !cidade ||
        !uf ||
        !enderecoEntrega ||
        !formaPagamento ||
        !isValidCpf(cpf)
    ) {
        showToast(
            !isValidCpf(cpf)
                ? "Informe um CPF válido."
                : "Preencha todos os campos obrigatórios e consulte o CEP."
        );
        return;
    }

    if (!Number.isFinite(calculatedDeliveryFee)) {
        showToast("Calcule o frete antes de confirmar o pedido.");
        await calculateFreight();

        if (!Number.isFinite(calculatedDeliveryFee)) {
            return;
        }
    }

    const subtotal = getCartSubtotal();
    const deliveryFee = calculatedDeliveryFee;
    const total = subtotal + deliveryFee;
    const codigoPedido = `EC-${Date.now()}`;

    const pedido = {
        codigo_pedido: codigoPedido,
        nome_cliente: nomeCliente,
        telefone: telefone,
        cpf,
        cep,
        rua,
        numero,
        complemento,
        bairro,
        cidade,
        uf,
        endereco_entrega: enderecoEntrega,
        forma_pagamento: formaPagamento,
        observacoes,
        subtotal,
        entrega: deliveryFee,
        total,
        status: "Pendente",
        status_pagamento: "Nao processado",
        itens: cart
    };

    const submitButton = form.querySelector('button[type="submit"]');

    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Registrando pedido...";
    }

    try {
        console.log("Tentando enviar pedido ao Supabase:", pedido);

        const { error } = await window.supabaseClient
            .from("pedidos")
            .insert([pedido]);

        if (error) {
            console.error("Erro retornado pelo Supabase:", error);
            throw error;
        }

        console.log("Pedido inserido no Supabase com sucesso!");

        const orderLocal = {
            id: codigoPedido,
            codigo_pedido: codigoPedido,
            created_at: new Date().toISOString(),
            customer: {
                nome_cliente: nomeCliente,
                telefone,
                cpf,
                cep,
                rua,
                numero,
                complemento,
                bairro,
                cidade,
                uf,
                endereco_entrega: enderecoEntrega,
                forma_pagamento: formaPagamento,
                observacoes
            },
            items: cart,
            subtotal,
            delivery: deliveryFee,
            total,
            status: "Pendente",
            payment_status: "Não processado"
        };

        const orders = JSON.parse(
            localStorage.getItem(ORDERS_KEY) || "[]"
        );

        orders.push(orderLocal);

        localStorage.setItem(
            ORDERS_KEY,
            JSON.stringify(orders)
        );

        localStorage.removeItem(CART_KEY);

        if (typeof updateCartCount === "function") {
            updateCartCount();
        }

        window.location.href =
            "pedido-sucesso.html?id=" +
            encodeURIComponent(codigoPedido);
    } catch (error) {
        console.error("Falha ao registrar o pedido:", error);

        showToast(
            "Não foi possível registrar o pedido. Verifique o console para mais detalhes."
        );

        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = "Confirmar pedido →";
        }
    }
}

// ============================================
// INICIALIZAÇÃO
// ============================================

function initializeCheckout() {
    renderCheckout();
    setupAddressAndCpf();

    const checkoutForm = document.querySelector("#checkoutForm");

    if (!checkoutForm) {
        console.error("Erro: formulário checkoutForm não encontrado.");
        return;
    }

    checkoutForm.addEventListener("submit", handleCheckoutSubmit);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeCheckout);
} else {
    initializeCheckout();
}
