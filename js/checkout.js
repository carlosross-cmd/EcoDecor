/**
 * ============================================
 * ECODECOR - FINALIZAÇÃO DO PEDIDO
 * ============================================
 */

const DELIVERY_FEE = 10;


// ============================================
// RENDERIZAÇÃO DO CHECKOUT
// ============================================

function renderCheckout() {

    const cart = getCart();

    const itemsContainer =
        document.querySelector("#checkoutItems");

    const subtotalElement =
        document.querySelector("#summarySubtotal");

    const totalElement =
        document.querySelector("#summaryTotal");


    if (
        !itemsContainer ||
        !subtotalElement ||
        !totalElement
    ) {

        console.error(
            "Erro: elementos do checkout não encontrados."
        );

        return;

    }


    if (!cart.length) {

        itemsContainer.innerHTML = `
            <div class="empty-state">

                <p>
                    Seu carrinho está vazio.
                </p>

                <a
                    class="text-link"
                    href="produtos.html"
                >
                    Voltar aos produtos →
                </a>

            </div>
        `;

        subtotalElement.textContent =
            formatCurrency(0);

        totalElement.textContent =
            formatCurrency(DELIVERY_FEE);

        return;

    }


    itemsContainer.innerHTML = cart.map(item => {

        const price =
            Number(item.price) || 0;

        const quantity =
            Number(item.quantity) || 0;

        return `
            <div class="summary-item">

                <img
                    src="${item.image}"
                    alt="${item.name}"
                >

                <div>

                    <strong>
                        ${item.name}
                    </strong>

                    <small>
                        ${quantity} ×
                        ${formatCurrency(price)}
                    </small>

                    <button
                        type="button"
                        class="remove-button"
                        data-remove="${item.id}"
                    >
                        Remover
                    </button>

                </div>

            </div>
        `;

    }).join("");


    itemsContainer
        .querySelectorAll("[data-remove]")
        .forEach(button => {

            button.addEventListener("click", () => {

                removeFromCart(
                    button.dataset.remove
                );

                renderCheckout();

            });

        });


    const subtotal = cart.reduce(
        (total, item) => {

            const price =
                Number(item.price) || 0;

            const quantity =
                Number(item.quantity) || 0;

            return total + price * quantity;

        },
        0
    );


    const total =
        subtotal + DELIVERY_FEE;


    subtotalElement.textContent =
        formatCurrency(subtotal);

    totalElement.textContent =
        formatCurrency(total);

}


// ============================================
// MÁSCARAS E CONSULTA DE CEP / CPF
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

function clearAddressFields() {
    ["rua", "bairro", "cidade", "uf"].forEach(id => {
        const field = document.getElementById(id);
        if (field) field.value = "";
    });
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

        if (data.erro) throw new Error("CEP não encontrado.");

        document.getElementById("rua").value = data.logradouro || "";
        document.getElementById("bairro").value = data.bairro || "";
        document.getElementById("cidade").value = data.localidade || "";
        document.getElementById("uf").value = data.uf || "";
        cepField.setCustomValidity("");
    } catch (error) {
        clearAddressFields();
        cepField.setCustomValidity(error.message || "Não foi possível consultar o CEP.");
        showToast(cepField.validationMessage);
    }
}

function setupAddressAndCpf() {
    const cep = document.getElementById("cep");
    const cpf = document.getElementById("cpf");

    cep?.addEventListener("input", () => {
        cep.value = formatCep(cep.value);
        cep.setCustomValidity("");
    });
    cep?.addEventListener("blur", lookupCep);

    cpf?.addEventListener("input", () => {
        cpf.value = formatCpf(cpf.value);
        cpf.setCustomValidity("");
    });
}

// ============================================
// ENVIO DO PEDIDO AO SUPABASE
// ============================================

async function handleCheckoutSubmit(event) {

    event.preventDefault();


    const form =
        event.target;

    const cart =
        getCart();


    if (!cart.length) {

        showToast(
            "Adicione algum produto antes de confirmar."
        );

        return;

    }


    // Verifica se o cliente Supabase existe

    if (!window.supabaseClient) {

        console.error(
            "Erro: window.supabaseClient não foi encontrado."
        );

        showToast(
            "O Supabase não foi configurado corretamente."
        );

        return;

    }


    const formData =
        new FormData(form);


    const nomeCliente =
        String(
            formData.get("nome_cliente") || ""
        ).trim();

    const telefone =
        String(
            formData.get("telefone") || ""
        ).trim();

    const cpf = onlyDigits(formData.get("cpf"));
    const cep = onlyDigits(formData.get("cep"));
    const rua = String(formData.get("rua") || "").trim();
    const numero = String(formData.get("numero") || "").trim();
    const complemento = String(formData.get("complemento") || "").trim();
    const bairro = String(formData.get("bairro") || "").trim();
    const cidade = String(formData.get("cidade") || "").trim();
    const uf = String(formData.get("uf") || "").trim();
    const enderecoEntrega = [rua, numero, complemento, bairro, `${cidade} - ${uf}`, `CEP: ${cep}`]
        .filter(Boolean).join(", ");

    const formaPagamento =
        String(
            formData.get("forma_pagamento") || ""
        ).trim();

    const observacoes =
        String(
            formData.get("observacoes") || ""
        ).trim();


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


    const subtotal = cart.reduce(
        (total, item) => {

            const price =
                Number(item.price) || 0;

            const quantity =
                Number(item.quantity) || 0;

            return total + price * quantity;

        },
        0
    );


    const total =
        subtotal + DELIVERY_FEE;


    const codigoPedido =
        `EC-${Date.now()}`;


    const pedido = {

        codigo_pedido: codigoPedido,

        nome_cliente: nomeCliente,

        telefone: telefone,

        cpf: cpf,
        cep: cep,
        rua: rua,
        numero: numero,
        complemento: complemento,
        bairro: bairro,
        cidade: cidade,
        uf: uf,

        endereco_entrega: enderecoEntrega,

        forma_pagamento: formaPagamento,

        observacoes: observacoes,

        subtotal: subtotal,

        entrega: DELIVERY_FEE,

        total: total,

        status: "Pendente",

        status_pagamento: "Nao processado",

        itens: cart

    };


    const submitButton =
        form.querySelector(
            'button[type="submit"]'
        );


    if (submitButton) {

        submitButton.disabled = true;

        submitButton.textContent =
            "Registrando pedido...";

    }


    try {

        console.log(
            "Tentando enviar pedido ao Supabase:",
            pedido
        );


        // ========================================
        // INSERÇÃO NO SUPABASE
        // ========================================

        const { error } =
            await window.supabaseClient
                .from("pedidos")
                .insert([pedido]);


        if (error) {

            console.error(
                "Erro retornado pelo Supabase:",
                error
            );

            throw error;

        }


        console.log(
            "Pedido inserido no Supabase com sucesso!"
        );


        // ========================================
        // SALVAMENTO LOCAL
        // ========================================

        const orderLocal = {

            id: codigoPedido,

            codigo_pedido: codigoPedido,

            created_at:
                new Date().toISOString(),

            customer: {

                nome_cliente: nomeCliente,

                telefone: telefone,

                cpf: cpf,
                cep: cep,
                rua: rua,
                numero: numero,
                complemento: complemento,
                bairro: bairro,
                cidade: cidade,
                uf: uf,

                endereco_entrega:
                    enderecoEntrega,

                forma_pagamento:
                    formaPagamento,

                observacoes: observacoes

            },

            items: cart,

            subtotal: subtotal,

            delivery: DELIVERY_FEE,

            total: total,

            status: "Pendente",

            payment_status:
                "Não processado"

        };


        const orders =
            JSON.parse(
                localStorage.getItem(
                    ORDERS_KEY
                ) || "[]"
            );


        orders.push(orderLocal);


        localStorage.setItem(
            ORDERS_KEY,
            JSON.stringify(orders)
        );


        // Limpa o carrinho

        localStorage.removeItem(CART_KEY);


        // Atualiza o contador do carrinho

        if (
            typeof updateCartCount === "function"
        ) {

            updateCartCount();

        }


        // Redireciona para a página de sucesso

        window.location.href =
            "pedido-sucesso.html?id=" +
            encodeURIComponent(codigoPedido);


    } catch (error) {

        console.error(
            "Falha ao registrar o pedido:",
            error
        );


        showToast(
            "Não foi possível registrar o pedido."
        );


        if (submitButton) {

            submitButton.disabled = false;

            submitButton.textContent =
                "Confirmar pedido →";

        }

    }

}


// ============================================
// INICIALIZAÇÃO
// ============================================

function initializeCheckout() {

    renderCheckout();
    setupAddressAndCpf();


    const checkoutForm =
        document.querySelector("#checkoutForm");


    if (!checkoutForm) {

        console.error(
            "Erro: formulário checkoutForm não encontrado."
        );

        return;

    }


    checkoutForm.addEventListener(
        "submit",
        handleCheckoutSubmit
    );

}


if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeCheckout
    );

} else {

    initializeCheckout();

}