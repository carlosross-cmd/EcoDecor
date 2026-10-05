/*
 * Detalhes extras de cada produto (página produto.html?id=N).
 * Mantido separado do data.js para não alterar o formato usado pelo carrinho/checkout.
 *
 * - images: lista de fotos da galeria. Se omitir, usa só a foto principal do produto.
 *           Para ter carrossel, adicione mais arquivos em imagens/produtos/ e liste aqui.
 * - Os valores de material/dimensões/peso abaixo são EXEMPLOS: ajuste para os dados reais.
 */
const PRODUCT_DETAILS = {
    1:  { material: "Bambu natural", dimensoes: "18 × 18 × 22 cm", peso: "600 g", origem: "Produção artesanal sustentável", sobre: "Vaso feito de bambu, material de crescimento rápido e renovável. Traz textura natural e leveza para estantes, mesas e cantos da casa.", eco: "Bambu é uma das matérias-primas que mais rápido se renova na natureza." },
    2:  { material: "Madeira reaproveitada", dimensoes: "28 × 28 × 30 cm", peso: "750 g", origem: "Produção artesanal sustentável", sobre: "Luminária com design ondulado que espalha uma luz quente e aconchegante, ótima para quartos, salas e cantos de leitura.", eco: "Feita com madeira de aproveitamento, reduzindo o desperdício." },
    3:  { material: "Fios de algodão", dimensoes: "45 × 45 cm", peso: "500 g", origem: "Produção artesanal", sobre: "Almofada com bordado em relevo e cores vibrantes, que dá personalidade a sofás, camas e poltronas.", eco: "Confeccionada com sobras de fios e produção em pequenos lotes." },
    4:  { material: "Vidro, madeira e pedras", dimensoes: "15 × 15 × 25 cm", peso: "700 g", origem: "Produção artesanal sustentável", sobre: "Conjunto com recipiente de vidro, base de madeira e pedras decorativas para um cantinho verde em qualquer ambiente.", eco: "Planta cultivada em água, sem necessidade de substrato descartável." },
    5:  { material: "Crochê de algodão", dimensoes: "40 × 40 cm", peso: "450 g", origem: "Crochê artesanal", sobre: "Almofada de crochê feita à mão, com abelhinhas em relevo e muito charme.", eco: "Trabalho manual com fibras naturais e baixo consumo de energia." },
    6:  { material: "Vidro e madeira", dimensoes: "20 × 10 × 24 cm", peso: "550 g", origem: "Produção artesanal sustentável", sobre: "Dois tubos de vidro sobre base de madeira, ideais para mesas, bancadas e escritórios.", eco: "Peça reutilizável e durável, pensada para evitar descarte." },
    7:  { material: "Bambu", dimensoes: "Kit com 3 vasos, 12 × 12 × 15 cm cada", peso: "900 g", origem: "Produção artesanal sustentável", sobre: "Kit de vasos de bambu para pendurar, perfeito para compor jardins verticais com flores naturais.", eco: "Bambu natural, renovável e biodegradável." },
    8:  { material: "Madeira maciça", dimensoes: "35 × 14 × 20 cm", peso: "1,1 kg", origem: "Marcenaria artesanal", sobre: "Suporte artesanal de madeira que acomoda garrafas com charme e praticidade.", eco: "Madeira com origem responsável e acabamento sem excesso de químicos." },
    9:  { material: "Madeira e lâmpadas decorativas", dimensoes: "60 × 25 × 40 cm", peso: "1,3 kg", origem: "Produção artesanal sustentável", sobre: "Composição suspensa de madeira e lâmpadas decorativas para uma iluminação acolhedora.", eco: "Compatível com lâmpadas LED de baixo consumo." },
    10: { material: "Madeira vazada", dimensoes: "30 × 30 × 35 cm", peso: "1 kg", origem: "Produção artesanal sustentável", sobre: "Peça escultural de madeira vazada que desenha sombras e cria uma atmosfera aconchegante.", eco: "Corte aproveitando ao máximo cada chapa de madeira." },
    11: { material: "Ingredientes naturais", dimensoes: "Kit com 4 itens", peso: "480 g", origem: "Produção consciente", sobre: "Conjunto de cuidados pessoais com itens naturais para momentos de relaxamento.", eco: "Itens de origem natural em embalagem reciclável." },
    12: { material: "Bálsamos naturais", dimensoes: "Embalagens de 15 g", peso: "120 g", origem: "Produção consciente", sobre: "Seleção de bálsamos em embalagens compactas, pensada para os cuidados do dia a dia.", eco: "Embalagens compactas e recicláveis." },
    13: { material: "Bambu e vidro", dimensoes: "Kit com 3 garrafas, 7 × 7 × 22 cm cada", peso: "850 g", origem: "Produção sustentável", sobre: "Conjunto de recipientes reutilizáveis com detalhes em bambu para acompanhar sua rotina.", eco: "Substitui descartáveis, reduzindo o lixo plástico." },
    14: { material: "Fibra de coco", dimensoes: "Diâmetro de 12 cm", peso: "300 g", origem: "Produção artesanal sustentável", sobre: "Tigelas artesanais de fibra de coco para uma composição natural na mesa ou na decoração.", eco: "Fibra de coco é um subproduto aproveitado, que seria descartado." },
    15: { material: "Materiais reutilizáveis", dimensoes: "Kit com 5 itens", peso: "600 g", origem: "Produção consciente", sobre: "Itens reutilizáveis para uma rotina de autocuidado mais consciente.", eco: "Cada item substitui um equivalente descartável." },
    16: { material: "Bambu", dimensoes: "Kit com 4 itens", peso: "250 g", origem: "Produção sustentável", sobre: "Conjunto de acessórios de higiene de inspiração natural, em embalagem sustentável.", eco: "Bambu biodegradável no lugar do plástico." },
    17: { material: "Cerâmica artesanal", dimensoes: "9 × 9 × 10 cm (300 ml)", peso: "380 g", origem: "Produção artesanal", sobre: "Caneca artesanal com estampa solar, para trazer cor e personalidade ao cotidiano.", eco: "Peça durável e reutilizável, feita em pequenos lotes." }
};
