# EcoDecor - Projeto profissional inicial

## Tecnologias
- HTML5
- CSS3
- JavaScript
- Supabase (estrutura preparada)
- LocalStorage para simulação inicial do carrinho e pedidos

## Como executar
1. Abra a pasta no VS Code.
2. Use Live Server ou abra index.html no navegador.
3. Explore produtos, adicione ao carrinho e teste o checkout.

## Observação importante
O fluxo atual registra pedidos localmente no navegador para demonstração.
A integração real com Supabase deve ser configurada com:
- URL pública do projeto;
- chave anon pública;
- políticas RLS adequadas;
- validação no servidor ou Edge Function para operações sensíveis.

Pagamento real não deve ser tratado somente com JavaScript no navegador.
Para uma versão real, use um provedor de pagamento e confirme o pagamento
no servidor por webhook antes de marcar o pedido como pago.

## Arquivos principais
- index.html
- produtos.html
- checkout.html
- pedido-sucesso.html
- meus-pedidos.html
- css/style.css
- js/data.js
- js/app.js
- js/catalog.js
- js/checkout.js
- js/orders.js
- js/supabase-config.js
- sql/schema.sql
"# carlos" 
