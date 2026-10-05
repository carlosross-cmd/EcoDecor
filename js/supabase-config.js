/**
 * ============================================
 * ECODECOR - CONFIGURAÇÃO DO SUPABASE
 * ============================================
 */

// URL do projeto Supabase

const SUPABASE_URL =
    "https://jwihbtjtehexzemifjum.supabase.co";


// Chave publicável do projeto

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_4xiizoa-b8R-Otutn0h9Gw_ZYLTjNZ_";


// ============================================
// VERIFICAÇÃO DA BIBLIOTECA
// ============================================

if (!window.supabase) {

    console.error(
        "Erro: a biblioteca do Supabase não foi carregada."
    );

} else if (

    !SUPABASE_PUBLISHABLE_KEY ||
    SUPABASE_PUBLISHABLE_KEY === "COLE_AQUI_SUA_CHAVE_PUBLICAVEL"

) {

    console.error(
        "Erro: insira sua chave publicável do Supabase."
    );

} else {

    // Cria o cliente do Supabase

    const supabaseClient =
        window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_PUBLISHABLE_KEY
        );


    // Disponibiliza o cliente para outros arquivos

    window.supabaseClient = supabaseClient;


    console.log(
        "Supabase configurado com sucesso!"
    );

}