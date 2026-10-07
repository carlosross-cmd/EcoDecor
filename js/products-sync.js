/*
 * Carrega os produtos da tabela "produtos" do Supabase e atualiza PRODUCTS/PRODUCT_DETAILS em memória.
 * Se o Supabase não responder (ou a tabela não existir), o catálogo estático do data.js continua funcionando.
 */
(function () {
    async function syncProducts() {
        let ok = false;
        try {
            if (!window.supabaseClient) throw new Error("Supabase indisponível nesta página.");
            const { data, error } = await window.supabaseClient
                .from("produtos").select("*").eq("ativo", true).order("id");
            if (error) throw error;

            PRODUCTS.length = 0;
            const hasDetails = typeof PRODUCT_DETAILS !== "undefined";
            if (hasDetails) Object.keys(PRODUCT_DETAILS).forEach(k => delete PRODUCT_DETAILS[k]);

            data.forEach(r => {
                PRODUCTS.push({ id: Number(r.id), name: r.nome, category: r.categoria, price: Number(r.preco), image: r.imagem, description: r.descricao });
                if (hasDetails) {
                    const extra = Array.isArray(r.imagens) ? r.imagens.filter(Boolean) : [];
                    PRODUCT_DETAILS[r.id] = {
                        material: r.material, dimensoes: r.dimensoes, peso: r.peso, origem: r.origem,
                        sobre: r.sobre, eco: r.eco,
                        images: extra.length ? [r.imagem, ...extra] : undefined
                    };
                }
            });
            ok = true;
        } catch (err) {
            console.warn("Usando catálogo local (data.js):", err.message || err);
        }
        window.productsSynced = true;
        window.dispatchEvent(new CustomEvent("products:updated", { detail: { ok } }));
    }
    document.addEventListener("DOMContentLoaded", syncProducts);
})();
