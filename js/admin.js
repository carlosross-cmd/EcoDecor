
const $ = s => document.querySelector(s);
const brl = v => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const STATUS = ["Pendente", "Preparando", "Enviado", "Concluído", "Cancelado"];
let products = [], orders = [];

function notify(msg, error = false) {
    const el = $("#notice");
    el.textContent = msg; el.className = "ad-notice" + (error ? " error" : ""); el.hidden = false;
    clearTimeout(notify.t); notify.t = setTimeout(() => (el.hidden = true), 5000);
}
const blocked = "Sem permissão. Confira o e-mail em public.is_admin() no SQL (sql/crud_admin.sql).";

async function showApp(session) {
    $("#loginView").hidden = !!session;
    $("#appView").hidden = !session;
    if (!session) return;
    $("#userEmail").textContent = session.user.email;
    await Promise.all([loadProducts(), loadOrders()]);
}
$("#loginForm").addEventListener("submit", async e => {
    e.preventDefault();
    const { error } = await sb.auth.signInWithPassword({ email: $("#loginEmail").value.trim(), password: $("#loginPassword").value });
    const err = $("#loginError");
    err.hidden = !error; if (error) err.textContent = "E-mail ou senha inválidos.";
});
$("#logoutBtn").addEventListener("click", () => sb.auth.signOut());
document.querySelectorAll(".ad-tabs button").forEach(b => b.addEventListener("click", () => {
    document.querySelectorAll(".ad-tabs button").forEach(x => x.classList.toggle("active", x === b));
    $("#tab-produtos").hidden = b.dataset.tab !== "produtos";
    $("#tab-pedidos").hidden = b.dataset.tab !== "pedidos";
}));

async function loadProducts() {
    const { data, error } = await sb.from("produtos").select("*").order("id");
    if (error) return notify("Erro ao carregar produtos: " + error.message, true);
    products = data; renderProducts();
    $("#categoryList").innerHTML = [...new Set(products.map(p => p.categoria))].map(c => `<option value="${esc(c)}">`).join("");
}
function renderProducts() {
    const q = $("#productSearch").value.toLowerCase().trim();
    const list = products.filter(p => `${p.nome} ${p.categoria}`.toLowerCase().includes(q));
    $("#productCount").textContent = `(${list.length})`;
    $("#productRows").innerHTML = list.length ? list.map(p => `
        <tr><td><img src="${esc(p.imagem)}" alt=""></td><td><strong>${esc(p.nome)}</strong></td><td>${esc(p.categoria)}</td><td>${brl(p.preco)}</td>
        <td><span class="ad-badge${p.ativo ? "" : " off"}">${p.ativo ? "Ativo" : "Inativo"}</span></td>
        <td class="ad-actions"><button data-edit="${p.id}">Editar</button><button data-toggle="${p.id}">${p.ativo ? "Desativar" : "Ativar"}</button><button class="danger" data-del="${p.id}">Excluir</button></td></tr>`).join("")
        : `<tr><td colspan="6" class="ad-empty">Nenhum produto encontrado.</td></tr>`;
}
$("#productSearch").addEventListener("input", renderProducts);
$("#productRows").addEventListener("click", async e => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.edit) return openProductForm(products.find(p => p.id == b.dataset.edit));
    const p = products.find(x => x.id == (b.dataset.toggle || b.dataset.del)); if (!p) return;
    if (b.dataset.toggle) {
        const { data, error } = await sb.from("produtos").update({ ativo: !p.ativo }).eq("id", p.id).select();
        if (error || !data.length) return notify(error ? error.message : blocked, true);
        notify(`Produto ${!p.ativo ? "ativado" : "desativado"}.`);
    } else {
        if (!confirm(`Excluir "${p.nome}"? Essa ação não pode ser desfeita.`)) return;
        const { data, error } = await sb.from("produtos").delete().eq("id", p.id).select();
        if (error || !data.length) return notify(error ? error.message : blocked, true);
        notify("Produto excluído.");
    }
    loadProducts();
});

const dlg = $("#productDialog"), form = $("#productForm");
let editingId = null;
function openProductForm(p) {
    editingId = p ? p.id : null;
    form.reset(); $("#productError").hidden = true;
    $("#productDialogTitle").textContent = p ? "Editar produto" : "Novo produto";
    if (p) {
        ["nome", "categoria", "preco", "imagem", "descricao", "material", "dimensoes", "peso", "origem", "sobre", "eco"].forEach(k => (form.elements[k].value = p[k] ?? ""));
        form.elements.imagens.value = (Array.isArray(p.imagens) ? p.imagens : []).join("\n");
        form.elements.ativo.checked = !!p.ativo;
    }
    dlg.showModal();
}
$("#newProductBtn").addEventListener("click", () => openProductForm(null));
$("#cancelProduct").addEventListener("click", () => dlg.close());
form.addEventListener("submit", async e => {
    e.preventDefault();
    const f = form.elements, txt = k => f[k].value.trim() || null;
    const payload = {
        nome: f.nome.value.trim(), categoria: f.categoria.value.trim(), preco: Number(f.preco.value),
        imagem: f.imagem.value.trim(), descricao: f.descricao.value.trim(),
        material: txt("material"), dimensoes: txt("dimensoes"), peso: txt("peso"), origem: txt("origem"), sobre: txt("sobre"), eco: txt("eco"),
        imagens: f.imagens.value.split("\n").map(s => s.trim()).filter(Boolean), ativo: f.ativo.checked
    };
    const q = editingId ? sb.from("produtos").update(payload).eq("id", editingId).select() : sb.from("produtos").insert([payload]).select();
    const { data, error } = await q;
    if (error || !data.length) { const el = $("#productError"); el.textContent = error ? error.message : blocked; el.hidden = false; return; }
    dlg.close(); notify(editingId ? "Produto atualizado." : "Produto criado."); loadProducts();
});

async function loadOrders() {
    const { data, error } = await sb.from("pedidos").select("*").order("created_at", { ascending: false });
    if (error) return notify("Erro ao carregar pedidos: " + error.message, true);
    orders = data; renderOrders();
}
function renderOrders() {
    $("#orderCount").textContent = `(${orders.length})`;
    $("#orderRows").innerHTML = orders.length ? orders.map(o => `
        <tr><td><strong>${esc(o.codigo_pedido)}</strong></td><td>${esc(o.nome_cliente)}</td><td>${new Date(o.created_at).toLocaleDateString("pt-BR")}</td><td>${brl(o.total)}</td>
        <td><select data-status="${o.id}">${STATUS.map(s => `<option${s === o.status ? " selected" : ""}>${s}</option>`).join("")}${STATUS.includes(o.status) ? "" : `<option selected>${esc(o.status)}</option>`}</select></td>
        <td class="ad-actions"><button data-view="${o.id}">Ver</button><button class="danger" data-delorder="${o.id}">Excluir</button></td></tr>`).join("")
        : `<tr><td colspan="6" class="ad-empty">Nenhum pedido registrado.</td></tr>`;
}
$("#reloadOrders").addEventListener("click", loadOrders);
$("#orderRows").addEventListener("change", async e => {
    if (!e.target.dataset.status) return;
    const { data, error } = await sb.from("pedidos").update({ status: e.target.value }).eq("id", e.target.dataset.status).select();
    if (error || !data.length) { notify(error ? error.message : blocked, true); return loadOrders(); }
    notify("Status atualizado.");
});
$("#orderRows").addEventListener("click", async e => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.view) {
        const o = orders.find(x => x.id == b.dataset.view);
        const itens = Array.isArray(o.itens) ? o.itens : [];
        const addr = [o.rua, o.numero, o.bairro, o.cidade, o.uf].filter(Boolean).join(", ") || o.endereco_entrega;
        $("#orderDetail").innerHTML = `<h3>Pedido ${esc(o.codigo_pedido)}</h3>
            <p><strong>${esc(o.nome_cliente)}</strong> · ${esc(o.telefone)}</p><p>${esc(addr)}</p>
            <p>Pagamento: ${esc(o.forma_pagamento)} · ${esc(o.status_pagamento)}</p>
            <ul class="ad-items">${itens.map(i => `<li>${esc(i.quantity)}× ${esc(i.name)} — ${brl(i.price * i.quantity)}</li>`).join("")}</ul>
            <p>Subtotal ${brl(o.subtotal)} · Entrega ${brl(o.entrega)} · <strong>Total ${brl(o.total)}</strong></p>
            ${o.observacoes ? `<p>Obs.: ${esc(o.observacoes)}</p>` : ""}`;
        return $("#orderDialog").showModal();
    }
    if (b.dataset.delorder) {
        if (!confirm("Excluir este pedido? Essa ação não pode ser desfeita.")) return;
        const { data, error } = await sb.from("pedidos").delete().eq("id", b.dataset.delorder).select();
        if (error || !data.length) return notify(error ? error.message : blocked, true);
        notify("Pedido excluído."); loadOrders();
    }
});
$("#closeOrder").addEventListener("click", () => $("#orderDialog").close());


if (!sb) {
    document.body.innerHTML = "<p style='padding:40px'>Supabase não configurado. Confira js/supabase-config.js.</p>";
} else {
    sb.auth.getSession().then(({ data }) => showApp(data.session));
    sb.auth.onAuthStateChange((_e, session) => showApp(session));
}
