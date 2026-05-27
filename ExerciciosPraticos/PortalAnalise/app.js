let dadosGlobais = [];

const COL_MAP = {
    id: "id_chamado",
    tipo: "tipo_chamado",
    tempo: "tempo_gasto",
    data: "data_chamado",
    titulo: "titulo_chamado",
    categoria: "categoria_detalhada",
    ref: "_ref"
};


const ERR_PATTERNS = {
    CONEXAO: {
        regex: /\b(timeout|connection\s+refused|broken\s+pipe|fatal:\s+remaining\s+connection\s+slots)\b/i,
        label: "Falha de Conexão / Rede"
    },
    PERMISSAO: {
        regex: /\b(access\s+denied|not\s+authorized|403\s+forbidden|unauthorized|permissao\s+negada)\b/i,
        label: "Erro de Autenticação / Permissão"
    },
    MEMORIA: {
        regex: /\b(out\s+of\s+memory|heap\s+space|stack\s+overflow|overflow)\b/i,
        label: "Estouro de Memória / Recurso"
    },
    NULO: {
        regex: /\b(nullpointerexception|cannot\s+read\s+properties\s+of\s+null|undefined)\b/i,
        label: "Referência Nula / Objeto Inexistente"
    },

    BANCO_DADOS: {
        regex: /\b(deadlock|constraint\s+violation|sql\s+error|syntax\s+error\s+at\s+or\s+near)\b/i,
        label: "Erro de Persistência / SQL"
    },
    VALIDACAO: {
        regex: /\b(invalid\s+format|campo\s+obrigatorio|bad\s+request|validacao\s+falhou)\b/i,
        label: "Falha de Validação de Input"
    },
    INTEGRACAO: {
        regex: /\b(api\s+error|status\s+code\s+50[0-9]|webhook\s+failed|falha\s+comunicacao)\b/i,
        label: "Erro de Integração de API Externa"
    }
};



/**
 * Sanitiza strings para prevenir vulnerabilidades de Cross-Site Scripting (XSS)
 * ao injetar dados do CSV diretamente no HTML da página.
 * @param {string} str - Texto original extraído do CSV
 * @returns {string} Texto tratado e seguro
 */
function safeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Formata um número representando horas em uma string legível (ex: 2.5 -> "2.5h")
 * Se o valor for inválido ou nulo, retorna "0h".
 * @param {number|string} valor - Quantidade de horas
 * @returns {string} String formatada
 */
function formatarHoras(valor) {
    const num = parseFloat(valor);
    if (isNaN(num)) return '0h';
    return num.toFixed(1) + 'h';
}

/**
 * Calcula a mediana de um array de números.
 * Útil para análises estatísticas onde a média pode ser distorcida por discrepâncias (outliers).
 * @param {Array<number>} valores - Vetor de números
 * @returns {number} Mediana calculada
 */
function calcularMediana(valores) {
    if (!valores || valores.length === 0) return 0;

    const ordenados = [...valores].sort((a, b) => a - b);
    const meio = Math.floor(ordenados.length / 2);


    if (ordenados.length % 2 !== 0) {
        return ordenados[meio];
    }

    return (ordenados[meio - 1] + ordenados[meio]) / 2;
}

/*
   Etapa 6 — Sistema de Abas da SPA (app.js)
/**
 * Inicializa o controlador de navegação por abas.
 * Associa eventos de clique aos botões para alternar a exibição dos painéis.
 */
function inicializarAbas() {

    const botoes = document.querySelectorAll(".tab-btn");
    const conteudos = document.querySelectorAll(".tab-content");

    botoes.forEach(botao => {
        botao.addEventListener("click", () => {
            const tabId = botao.getAttribute("data-tab");

            botoes.forEach(b => b.classList.remove("active"));
            conteudos.forEach(c => c.classList.remove("active"));

            botao.classList.add("active");

            const painelDestino = document.getElementById(tabId);
            if (painelDestino) {
                painelDestino.classList.add("active");
            }
        });
    });
}


document.addEventListener("DOMContentLoaded", () => {
    inicializarAbas();
});

/*
   Etapa 7 — Gerador de SQL (app.js)
*/

/**
 * Gera uma query SQL dinâmica baseada nas datas inseridas na interface
 * e exibe o resultado estruturado na área correspondente.
 */
function genSQL() {
    // Obtém os valores dos inputs de data da interface
    const dataInicio = $("dtStart").value || "2026-01-01";
    const dataFim = $("dtEnd").value;

    let dateFilter = `COALESCE(vt.created_at, vht.created_at) >= '${dataInicio}'`;

    if (dataFim) {
        dateFilter += `\n    AND COALESCE(vt.created_at, vht.created_at) <= '${dataFim} 23:59:59'`;
    }

    const sql = `SELECT 
    vht.id,
    vht.tipo_chamado,
    vht.tempo_gasto,
    vht.data_chamado,
    vht.titulo_chamado,
    vht.categoria_detalhada
FROM valor_help_tickets vht
WHERE ${dateFilter};`;

    $("sqlPre").textContent = sql;
}

/**
 * Copia o código SQL gerado para a área de transferência (Clipboard)
 * e fornece um feedback visual rápido para o utilizador.
 */
function copySQL() {
    const textoSql = $("sqlPre").textContent;

    if (!textoSql) return;

    navigator.clipboard.writeText(textoSql)
        .then(() => {
            // Procura ou cria o elemento de feedback visual temporário
            let ok = $("copyOk");
            if (!ok) {
                // Se não existir no HTML, cria dinamicamente na caixa do SQL
                const box = $("sqlBox");
                if (box) {
                    box.insertAdjacentHTML("afterbegin", '<span id="copyOk" style="position:absolute;right:10px;top:10px;background:var(--p3);color:#fff;padding:4px 8px;border-radius:4px;font-size:0.75rem;transition:opacity 0.2s;opacity:0;">Copiado!</span>');
                    ok = $("copyOk");
                }
            }

            // Exibe o indicador "Copiado!" alterando a opacidade
            if (ok) {
                ok.style.opacity = "1";
                // Oculta novamente após 2 segundos (2000ms) usando setTimeout
                setTimeout(() => ok.style.opacity = "0", 2000);
            }
        })
        .catch(err => {
            console.error("Erro ao copiar SQL: ", err);
        });
}

/* 
   Etapa 8 — Upload e Parsing de CSV (app.js)
  */

// ─── 8.1 CONFIGURAR DRAG-AND-DROP ───

/**
 * Configura os eventos de arrastar, largar e clique de uma zona de upload (Drop Zone).
 * @param {string} dropZoneId - O ID do elemento HTML da zona de arraste
 * @param {string} fileInputId - O ID do input do tipo file oculto
 */
function setupDZ(dropZoneId, fileInputId) {
    const dz = document.getElementById(dropZoneId);
    const fi = document.getElementById(fileInputId);

    if (!dz || !fi) return;

    // Ao clicar na área estilizada, aciona o seletor de ficheiros oculto
    dz.onclick = () => fi.click();

    // Quando o ficheiro é arrastado sobre a zona, previne o comportamento padrão e adiciona classe visual
    dz.ondragover = e => {
        e.preventDefault();
        dz.classList.add("ov");
    };

    // Quando o ficheiro sai da zona de arraste, remove o destaque visual
    dz.ondragleave = () => dz.classList.remove("ov");

    // Quando o utilizador larga o ficheiro na zona
    dz.ondrop = e => {
        e.preventDefault();
        dz.classList.remove("ov");
        // Se houver ficheiros, envia o primeiro para processamento
        if (e.dataTransfer.files.length) {
            loadF(e.dataTransfer.files[0]);
        }
    };

    // Quando um ficheiro é selecionado manualmente através do clique
    fi.onchange = e => {
        if (e.target.files.length) {
            loadF(e.target.files[0]);
        }
    };
}

// Inicializa o comportamento para as duas zonas de upload existentes no HTML (Dashboard e Aba SQL)
setupDZ("dropZone", "fi1");
setupDZ("dropZone2", "fi2");


// ─── 8.2 LER E PARSEAR O CSV ───

/**
 * Lê o conteúdo de um ficheiro de texto local e executa o parsing estruturado do CSV.
 * @param {File} file - O objeto de ficheiro capturado pelo input ou drop zone
 */
function loadF(file) {
    // Oculta mensagens de erro anteriores e exibe o indicador de processamento (spinner)
    const errMsg = document.getElementById("errMsg");
    const spinner = document.getElementById("spinner");

    if (errMsg) errMsg.style.display = "none";
    if (spinner) spinner.style.display = "block";

    // Instancia a API nativa do navegador para leitura de ficheiros locais
    const reader = new FileReader();

    // Define a lógica executada assim que a leitura do texto terminar
    reader.onload = e => {
        // Utiliza a biblioteca PapaParse para converter a string CSV num array de objetos
        Papa.parse(e.target.result, {
            header: true,          // Define que a primeira linha do CSV será tratada como cabeçalho [cite: 146]
            skipEmptyLines: true,  // Ignora linhas em branco no final ou meio do documento [cite: 146]
            dynamicTyping: false,  // Mantém os dados como string para controlo manual de tipos na inicialização [cite: 146]
            complete: result => {
                if (spinner) spinner.style.display = "none";

                // Validação básica se o ficheiro possui registos populados
                if (!result.data || !result.data.length) {
                    showE("CSV vazio.");
                    return;
                }

                try {
                    // Envia os dados extraídos e a lista de colunas detetadas para a Etapa 9
                    init(result.data, result.meta.fields);
                } catch (err) {
                    showE("Erro: " + err.message);
                }
            },
            error: err => showE("Erro: " + err.message)
        });
    };

    // Dispara a leitura do ficheiro utilizando codificação UTF-8
    reader.readAsText(file, "UTF-8");
}

/**
 * Função auxiliar para exibição de mensagens de falha na interface.
 */
function showE(msg) {
    const errMsg = document.getElementById("errMsg");
    const spinner = document.getElementById("spinner");

    if (spinner) spinner.style.display = "none";
    if (errMsg) {
        errMsg.style.display = "block";
        errMsg.textContent = msg;
    } else {
        console.error(msg);
    }
}

/* ==========================================================================
   Etapa 9 — Inicialização e Pré-processamento (app.js)
   ========================================================================== */

/**
 * Função de atalho utilitária para seleção de elementos do DOM por ID.
 * Alinha o código com as chamadas de manipulação de tela do manual.
 */
function $(id) {
    return document.getElementById(id);
}

/**
 * Valida os cabeçalhos encontrados e pré-processa os dados brutos extraídos do CSV.
 * Mapeia os tipos de dados e popula a memória global da aplicação.
 * @param {Array<Object>} rawData - Lista de linhas cruas obtidas do PapaParse
 * @param {Array<string>} fields - Lista de colunas (cabeçalhos) identificadas no ficheiro
 */
function init(rawData, fields) {
    // 1. VALIDAÇÃO DE CABEÇALHOS
    // Cria um conjunto (Set) para buscas rápidas de presença de colunas
    const fieldSet = new Set(fields.map(f => f.trim()));

    // 🔥 VALIDAÇÃO APRERFEIÇOADA: Verifica primeiro se a coluna ID existe de forma rígida
    if (!fieldSet.has(COL_MAP.id)) {
        alert(`⚠️ Erro Crítico: A coluna de identificação compulsória "${COL_MAP.id}" não foi localizada neste arquivo CSV!`);
        return; // Interrompe a execução imediatamente e protege o portal de travar
    }

    const colunasObrigatorias = Object.values(COL_MAP);
    const colunasFaltantes = [];

    // Verifica se as demais colunas definidas no COL_MAP existem no CSV carregado
    colunasObrigatorias.forEach(colunaEsperada => {
        if (!fieldSet.has(colunaEsperada)) {
            colunasFaltantes.push(colunaEsperada);
        }
    });

    // Se houver divergências nas outras colunas, interrompe avisando o usuário
    if (colunasFaltantes.length > 0) {
        alert(`⚠️ Estrutura inválida. Colunas obrigatórias ausentes: ${colunasFaltantes.join(", ")}`);
        throw new Error(`Estrutura inválida. Colunas ausentes: ${colunasFaltantes.join(", ")}`);
    }

    // 2. PRÉ-PROCESSAMENTO E TRATAMENTO DE TIPOS
    // Transforma e normaliza cada registro bruto para o esquema interno seguro do portal
    dadosGlobais = rawData.map((linha, index) => {
        // Tratamento e limpeza do tempo gasto (converte string em float absoluto positivo)
        let tempo = parseFloat(linha[COL_MAP.tempo]);
        if (isNaN(tempo) || tempo < 0) {
            tempo = 0.0;
        }

        // Retorna o objeto completamente padronizado e limpo
        return {
            id: String(linha[COL_MAP.id]).trim(), // Como validamos acima, o ID existirá com certeza
            tipo: linha[COL_MAP.tipo] ? String(linha[COL_MAP.tipo]).trim() : 'Não Definido',
            tempo: tempo,
            data: linha[COL_MAP.data] ? String(linha[COL_MAP.data]).trim() : '',
            titulo: linha[COL_MAP.titulo] ? String(linha[COL_MAP.titulo]).trim() : '',
            categoria: linha[COL_MAP.categoria] ? String(linha[COL_MAP.categoria]).trim() : 'Geral',
            ref: linha[COL_MAP.ref] ? String(linha[COL_MAP.ref]).trim() : ''
        };
    });

    // 3. ATIVAÇÃO DAS INTERFACES E FILTROS (Finalização da função init)
    document.querySelectorAll(".placeholder-msg, .empty-state").forEach(elemento => {
        elemento.style.display = "none";
    });

    if (typeof renderFilters === "function") renderFilters();
    if (typeof applyFilters === "function") applyFilters();
}

// 3. ATIVAÇÃO DAS INTERFACES E FILTROS
// Com os dados salvos em dadosGlobais, remove os placeholders visuais
const layoutsEscondidos = document.querySelectorAll(".placeholder-msg, .empty-state");
layoutsEscondidos.forEach(elemento => {
    elemento.style.display = "none";
});

// Invoca as rotinas das etapas seguintes para atualizar todos os componentes da SPA
// (Estas funções serão desenvolvidas a partir da Etapa 10)
if (typeof renderFilters === "function") renderFilters();
if (typeof updateDashboard === "function") updateDashboard(dadosGlobais);
if (typeof runRegexAnalysis === "function") runRegexAnalysis();
if (typeof genSQL === "function") genSQL();


/* ==========================================================================
   Etapa 10 — Filtros Dinâmicos e Encadeamento de Arrays (app.js)
   ========================================================================== */

/**
 * Cria e renderiza dinamicamente as opções dos elementos select (<select>) 
 * na interface com base nas categorias e tipos existentes no CSV importado.
 */
function renderFilters() {
    // 1. Obtém listas de valores únicos utilizando o objeto Set
    const categoriasUnicas = [...new Set(dadosGlobais.map(d => d.categoria))].sort();
    const tiposUnicos = [...new Set(dadosGlobais.map(d => d.tipo))].sort();

    // 2. Preenche o select de Categorias preservando a opção padrão
    const selCat = $("selCategory");
    if (selCat) {
        selCat.innerHTML = '<option value="">Todas as Categorias</option>';
        categoriasUnicas.forEach(cat => {
            selCat.insertAdjacentHTML("beforeend", `<option value="${safeHTML(cat)}">${safeHTML(cat)}</option>`);
        });
    }

    // 3. Preenche o select de Tipos (Bug / Melhoria) preservando a opção padrão
    const selTipo = $("selType");
    if (selTipo) {
        selTipo.innerHTML = '<option value="">Todos os Tipos</option>';
        tiposUnicos.forEach(tipo => {
            selTipo.insertAdjacentHTML("beforeend", `<option value="${safeHTML(tipo)}">${safeHTML(tipo)}</option>`);
        });
    }

    // 4. Vincula o evento 'change' ou 'input' para disparar a filtragem automaticamente ao interagir
    // Incluímos o "selRefFilter" no array abaixo para ele também disparar a atualização
    const elementosFiltro = ["selCategory", "selType", "txtSearch", "dtStart", "dtEnd", "selRefFilter"];
    elementosFiltro.forEach(id => {
        const el = $(id);
        if (el) {
            // Sempre que o utilizador alterar o filtro, a função applyFilters é invocada
            el.onchange = () => applyFilters();
            if (el.tagName === "INPUT") {
                el.oninput = () => applyFilters();
            }
        }
    });
}

/**
 * Captura as restrições da interface e aplica filtros em cascata (encadeados)
 * sobre o array global de dados, updating os componentes dependentes.
 */
function applyFilters() {
    // Se a base global estiver vazia, aborta o processamento
    if (!dadosGlobais || dadosGlobais.length === 0) return;

    // Captura os termos de busca introduzidos pelo utilizador na UI
    const catSelecionada = $("selCategory") ? $("selCategory").value : "";
    const tipoSelecionado = $("selType") ? $("selType").value : "";
    const termoBusca = $("txtSearch") ? $("txtSearch").value.toLowerCase().trim() : "";
    const dataInicio = $("dtStart") ? $("dtStart").value : "";
    const dataFim = $("dtEnd") ? $("dtEnd").value : "";

    // Captura o valor do novo filtro de referência do HTML
    const filtroRef = $("selRefFilter") ? $("selRefFilter").value : "";

    // EXECUÇÃO DOS FILTROS ENCADEADOS (Programação Funcional)
    const dadosFiltrados = dadosGlobais.filter(item => {

        // Filtro 1: Categoria Detalhada
        if (catSelecionada && item.categoria !== catSelecionada) return false;

        // Filtro 2: Tipo de Chamado (Bug vs Melhoria)
        if (tipoSelecionado && item.tipo !== tipoSelecionado) return false;

        // Filtro 3: Busca Textual por Termo (pesquisa no Título ou no ID)
        if (termoBusca) {
            const noTitulo = item.titulo.toLowerCase().includes(termoBusca);
            const noId = item.id.toLowerCase().includes(termoBusca);
            if (!noTitulo && !noId) return false;
        }

        // Filtro 4: Intervalo de Datas (Data Inicial)
        if (dataInicio && item.data < dataInicio) return false;

        // Filtro 5: Intervalo de Datas (Data Final)
        if (dataFim && item.data > dataFim) return false;

        // Filtro 6: Validação de Referência (Reforma Tributária)
        if (filtroRef === "reforma") {
            // Verifica se o campo ref NÃO tem o termo procurado. Se não tiver, descarta o item.
            const temTermo = item.ref.toLowerCase().includes("reforma tributária") ||
                item.ref.toLowerCase().includes("reforma tributaria");
            if (!temTermo) return false;
        } else if (filtroRef === "outros") {
            // Verifica se o campo ref TEM o termo. Se tiver, descarta (pois queremos apenas os outros).
            const temTermo = item.ref.toLowerCase().includes("reforma tributária") ||
                item.ref.toLowerCase().includes("reforma tributaria");
            if (temTermo) return false;
        }

        // Se passou por todas as regras, o registo permanece no array resultante
        return true;
    });

    // Re-renderiza o Dashboard e recria as queries SQL utilizando apenas o subconjunto filtrado
    if (typeof updateDashboard === "function") updateDashboard(dadosFiltrados);
    if (typeof genSQL === "function") genSQL();

    // 🔥 AJUSTE EXTRA: Garante que os Insights e as análises Regex se atualizem com os dados filtrados
    if (typeof runRegexAnalysis === "function") runRegexAnalysis(dadosFiltrados);
    if (typeof runAutomaticInsights === "function") runAutomaticInsights(dadosFiltrados);
}

/* ==========================================================================
   Etapa 11 — Renderização do Dashboard e Gráficos Chart.js (app.js)
   ========================================================================== */

// ─── 11.1 CONFIGURAÇÃO GLOBAL DO CHART.JS ───
// Regista globalmente o plugin de rótulos de dados (DataLabels) [cite: 235]
if (typeof ChartDataLabels !== "undefined") {
    Chart.register(ChartDataLabels);
    // Mantém desativado por padrão e ativa individualmente em cada gráfico
    Chart.defaults.set("plugins.datalabels", { display: false });
}

// Lista global interna para monitorizar e limpar os gráficos ativos na memória
let listaGraficosAtivos = [];


// ─── 11.2 FUNÇÃO PRINCIPAL DE RENDERIZAÇÃO ───

/**
 * Atualiza todos os KPIs e reconstrói os gráficos da interface do Dashboard
 * com base no array de dados fornecido (filtrados ou completos).
 * @param {Array<Object>} dadosParaExibir - Subconjunto de dados tratados
 */
function updateDashboard(dadosParaExibir) {

    listaGraficosAtivos.forEach(grafico => grafico.destroy());
    listaGraficosAtivos = [];

    const totalChamados = dadosParaExibir.length;

    if ($("kpiTotal")) $("kpiTotal").textContent = totalChamados;


    const totalBugs = dadosParaExibir.filter(d => d.tipo.toLowerCase() === "bug").length;
    if ($("kpiBugs")) $("kpiBugs").textContent = totalBugs;
    if ($("kpiBugsPercent")) {
        $("kpiBugsPercent").textContent = totalChamados ?
            ((totalBugs / totalChamados) * 100).toFixed(1) + "% do total" : "0% do total";
    }

    const totalMelhorias = dadosParaExibir.filter(d => d.tipo.toLowerCase() === "melhoria").length;
    if ($("kpiImprovements")) $("kpiImprovements").textContent = totalMelhorias;
    if ($("kpiImprovementsPercent")) {
        $("kpiImprovementsPercent").textContent = totalChamados ?
            ((totalMelhorias / totalChamados) * 100).toFixed(1) + "% do total" : "0% do total";
    }


    const somaHoras = dadosParaExibir.reduce((acumulador, item) => acumulador + item.tempo, 0);
    const mediaHoras = totalChamados ? (somaHoras / totalChamados) : 0;
    if ($("kpiAvgTime")) $("kpiAvgTime").textContent = mediaHoras.toFixed(1) + "h";


    const contarCategoriasSafely = typeof cm === "function" ? cm : function (arr) {
        const mapa = {}; arr.forEach(x => mapa[x] = (mapa[x] || 0) + 1);
        return Object.entries(mapa).sort((a, b) => b[1] - a[1]);
    };
    const contagemCategorias = contarCategoriasSafely(dadosParaExibir.map(d => d.categoria));
    const topCategorias = contagemCategorias.slice(0, 7);

    const canvasEvolucao = $("chartEvolucao");
    if (canvasEvolucao && mesesUnicos.length > 0) {

        const horasAbsolutasPorMes = mesesUnicos.map(mes => {
            return dadosParaExibir
                .filter(d => d.data.startsWith(mes))
                .reduce((acumuladorHoras, item) => acumuladorHoras + item.tempo, 0);
        });

        instanciarGrafico(canvasEvolucao, {
            type: "line",
            data: {
                labels: mesesUnicos,
                datasets: [{
                    label: "Horas Totais Consumidas",
                    data: horasAbsolutasPorMes,
                    borderColor: "#10b981",
                    backgroundColor: "rgba(16, 185, 129, 0.1)",
                    fill: true,
                    tension: 0.2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: true, position: "top" }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {

                            callback: function (valor) {
                                return valor + "h";
                            }
                        }
                    }
                }
            }
        });
    }
    const canvasProporcao = $("chartProporcao");
    if (canvasProporcao) {
        instanciarGrafico(canvasProporcao, {
            type: "doughnut",
            data: {
                labels: ["Bugs", "Melhorias"],
                datasets: [{
                    data: [totalBugs, totalMelhorias],
                    backgroundColor: ["#ef4444", "#6366f1"],
                    borderWidth: 2,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: true, position: "bottom" }
                }
            }
        });
    }

    const canvasCategorias = $("chartCategorias");
    if (canvasCategorias && topCategorias.length > 0) {
        instanciarGrafico(canvasCategorias, {
            type: "bar",
            data: {
                labels: topCategorias.map(c => c[0]),
                datasets: [{
                    label: "Quantidade",
                    data: topCategorias.map(c => c[1]),
                    backgroundColor: "#f59e0b",
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    datalabels: {
                        display: true,
                        anchor: "end",
                        align: "top",
                        formatter: (valor) => valor
                    }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }
}

/**
 * Agrupa o processo de instanciação do Chart.js utilizando requestAnimationFrame
 * para otimizar a renderização síncrona do navegador e evitar bloqueios na interface.
 */
function instanciarGrafico(elementoCanvas, configuracao) {
    window.requestAnimationFrame(() => {
        if (elementoCanvas) {
            const novoGrafico = new Chart(elementoCanvas, configuracao);
            listaGraficosAtivos.push(novoGrafico);
        }
    });
}

/* 
   Etapa 12 — Análise de Texto com Expressões Regulares / Regex (app.js)
 */

const RE_PADROES = {
    "Impostos (PIS/COFINS/ISS)": [
        "pis", "cofins", "iss ", "imposto", "aliquota",
        "retencao", "\\bir\\b", "inss", "base.?calculo"
    ],
    "Regex / Mapeamento": [
        "regex", "mapeamento", "expressao regular", "pattern"
    ],
    "Campo nao lido / vazio": [
        "campo vazio", "nao esta lendo", "nao esta capturando"
    ]
};

// ─── 12.2 FUNÇÃO DE VARREDURA E RENDERIZAÇÃO ───

/**
 * Analisa as descrições dos chamados utilizando expressões regulares,
 * contabiliza as ocorrências e renderiza os resultados na Aba 2 (Análise de Erros).
 */
function runRegexAnalysis() {
    const container = $("containerErros");
    if (!container) return;

    container.innerHTML = "";

    const resultadoPadroes = [];
    const totalRegistros = dadosGlobais.length;

    if (totalRegistros === 0) {
        container.innerHTML = '<div class="empty-state">Aguardando importação do arquivo CSV para processar...</div>';
        return;
    }


    for (const [nomePadrao, palavrasChave] of Object.entries(RE_PADROES)) {


        const chamadosAfetados = dadosGlobais.filter(chamado => {

            const textoAnalise = `${chamado.titulo} ${chamado.categoria}`.toLowerCase();


            return palavrasChave.some(kw => {
                const expressao = new RegExp(kw, "i");
                return expressao.test(textoAnalise);
            });
        });


        if (chamadosAfetados.length > 0) {
            resultadoPadroes.push({
                nome: nomePadrao,
                quantidade: chamadosAfetados.length,
                exemplos: chamadosAfetados.slice(0, 3)
            });
        }
    }


    resultadoPadroes.sort((a, b) => b.quantidade - a.quantidade);

    if (resultadoPadroes.length === 0) {
        container.innerHTML = '<div class="empty-state">Nenhum padrão de falha crítica conhecido foi detetado nos textos.</div>';
        return;
    }

    resultadoPadroes.forEach(item => {
        const percentual = ((item.quantidade / totalRegistros) * 100).toFixed(1);

        const htmlExemplos = item.exemplos.map(ex =>
            `<li><strong>${safeHTML(ex.id)}</strong>: ${safeHTML(ex.titulo)}</li>`
        ).join("");

        const cardHtml = `
      <div class="error-card">
        <div class="error-card-header">
          <span>PADRÃO IDENTIFICADO</span>
          <span class="error-badge">${item.quantidade} ocorrências (${percentual}%)</span>
        </div>
        <div class="error-card-title" style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem;">
          ${safeHTML(item.nome)}
        </div>
        <div class="error-card-body" style="font-size: 0.85rem; color: var(--text-muted);">
          <p style="margin-bottom: 0.25rem; font-weight: 500; color: var(--text-main);">Amostra de chamados afetados:</p>
          <ul style="padding-left: 1.25rem; margin-top: 0.25rem;">
            ${htmlExemplos}
          </ul>
        </div>
      </div>
    `;

        container.insertAdjacentHTML("beforeend", cardHtml);
    });
}

const funcaoOriginalApplyFilters = applyFilters;
applyFilters = function () {
    if (typeof funcaoOriginalApplyFilters === "function") funcaoOriginalApplyFilters();
    runRegexAnalysis();
};

/* 
   Etapa 13 — Geração de Insights Automáticos (app.js)
 */

/**
 * Examina a base de dados em memória, processa métricas comparativas
 * e renderiza recomendações de negócio automáticas na interface.
 * @param {Array<Object>} dadosParaAnalise - Subconjunto de dados filtrados
 */
function runAutomaticInsights(dadosParaAnalise) {
    const container = $("containerInsights");
    if (!container) return;

    container.innerHTML = "";
    const total = dadosParaAnalise.length;

    if (total === 0) {
        container.innerHTML = '<div class="empty-state">Sem dados suficientes para processar insights.</div>';
        return;
    }

    const horasPorCategoria = {};
    dadosParaAnalise.forEach(item => {
        if (!horasPorCategoria[item.categoria]) {
            horasPorCategoria[item.categoria] = 0;
        }
        horasPorCategoria[item.categoria] += item.tempo;
    });

    let categoriaMaisDemorada = "";
    let maiorTempoAcumulado = 0;

    Object.entries(horasPorCategoria).forEach(([cat, tempo]) => {
        if (tempo > maiorTempoAcumulado) {
            maiorTempoAcumulado = tempo;
            categoriaMaisDemorada = cat;
        }
    });


    const totalBugs = dadosParaAnalise.filter(d => d.tipo.toLowerCase() === "bug").length;
    const proporcaoBugs = total ? (totalBugs / total) : 0;


    const contagemChamadosPorMes = {};
    dadosParaAnalise.forEach(item => {
        const mes = item.data.substring(0, 7);
        if (mes && mes.length === 7) {
            contagemChamadosPorMes[mes] = (contagemChamadosPorMes[mes] || 0) + 1;
        }
    });

    let mesPico = "";
    let maiorVolumeMes = 0;
    Object.entries(contagemChamadosPorMes).forEach(([mes, qtd]) => {
        if (qtd > maiorVolumeMes) {
            maiorVolumeMes = qtd;
            mesPico = mes;
        }
    });



    const insightsGerados = [];

    if (proporcaoBugs > 0.60) {
        insightsGerados.push({
            tipo: "danger",
            titulo: "Alerta de Instabilidade na Operação",
            descricao: `Mais de <strong>${(proporcaoBugs * 100).toFixed(0)}%</strong> dos chamados atuais são classificados como bugs. Recomenda-se congelar a implementação de novas melhorias e focar a equipa na estabilização do código fonte.`
        });
    }

    if (categoriaMaisDemorada && maiorTempoAcumulado > 0) {
        insightsGerados.push({
            tipo: "warning",
            titulo: "Gargalo Operacional Detetado",
            descricao: `A categoria <strong>"${safeHTML(categoriaMaisDemorada)}"</strong> é a maior ofensora de tempo, consumindo um total acumulado de <strong>${maiorTempoAcumulado.toFixed(1)}h</strong>. Convém analisar a documentação ou arquitetura deste módulo.`
        });
    }


    if (mesPico && maiorVolumeMes > 0) {

        const [ano, mes] = mesPico.split("-");
        insightsGerados.push({
            tipo: "warning",
            titulo: "Pico de Volumetria Detectado",
            descricao: `O mês de <strong>${mes}/${ano}</strong> foi o período mais sobrecarregado da base avaliada, concentrando um recorde de <strong>${maiorVolumeMes} chamados</strong> abertos. Monitore a capacidade de atendimento em janelas parecidas.`
        });
    }

    const somaHoras = dadosParaAnalise.reduce((acc, item) => acc + item.tempo, 0);
    const mediaHoras = total ? (somaHoras / total) : 0;

    if (mediaHoras < 1.5 && total > 0) {
        insightsGerados.push({
            tipo: "success",
            titulo: "Alta Vazão de Resolução",
            descricao: `O tempo médio gasto por chamado está saudável, situando-se em <strong>${mediaHoras.toFixed(1)}h</strong> por tarefa. Indica boa autonomia técnica da equipa de triagem.`
        });
    }


    if (insightsGerados.length === 0) {
        container.innerHTML = '<div class="empty-state">A operação está estável. Nenhum desvio de comportamento identificado.</div>';
        return;
    }

    const estilosPorTipo = {
        danger: { bg: "#fff5f5", border: "#feb2b2", texto: "#9b2c2c", bordaEsquerda: "var(--color-bug, #ef4444)" },
        warning: { bg: "#fffaf0", border: "#fbd38d", texto: "#9c4221", bordaEsquerda: "var(--color-warning, #f59e0b)" },
        success: { bg: "#f0fff4", border: "#9ae6b4", texto: "#22543d", bordaEsquerda: "var(--color-success, #10b981)" }
    };

    insightsGerados.forEach(insight => {
        const estilo = estilosPorTipo[insight.tipo];

        const htmlInsight = `
      <div class="insight-card" style="background-color: ${estilo.bg}; border: 1px solid ${estilo.border}; border-left: 5px solid ${estilo.bordaEsquerda}; border-radius: var(--radius-md); padding: 1rem; margin-bottom: 1rem;">
        <h4 style="color: ${estilo.texto}; font-weight: 700; margin-bottom: 0.25rem; font-size: 0.95rem;">
          💡 ${safeHTML(insight.titulo)}
        </h4>
        <p style="font-size: 0.875rem; color: var(--text-main); margin: 0;">
          ${insight.descricao}
        </p>
      </div>
    `;
        container.insertAdjacentHTML("beforeend", htmlInsight);
    });
}

const funcaoFiltroComInsight = applyFilters;
applyFilters = function () {
    if (typeof funcaoFiltroComInsight === "function") funcaoFiltroComInsight();


    if (typeof dadosGlobais !== "undefined") {
        const selCat = $("selCategory") ? $("selCategory").value : "";
        const selTipo = $("selType") ? $("selType").value : "";

        const filtrados = dadosGlobais.filter(item => {
            if (selCat && item.categoria !== selCat) return false;
            if (selTipo && item.tipo !== selTipo) return false;
            return true;
        });

        runAutomaticInsights(filtrados);
    }
};

/* 
   Etapa 14 — Exportação de Dados para JSON (app.js)
 */

/**
 * Agrupa o estado atual dos dados tratados e filtrados, converte-os numa
 * string formatada e dispara o download nativo do ficheiro .json.
 */
function exportToJSON() {

    if (!dadosGlobais || dadosGlobais.length === 0) {
        alert("Não existem dados disponíveis para exportação. Importe um ficheiro CSV primeiro.");
        return;
    }

    const catSelecionada = $("selCategory") ? $("selCategory").value : "";
    const tipoSelecionado = $("selType") ? $("selType").value : "";

    const dadosParaExportar = dadosGlobais.filter(item => {
        if (catSelecionada && item.categoria !== catSelecionada) return false;
        if (tipoSelecionado && item.tipo !== tipoSelecionado) return false;
        return true;
    });


    const estruturaObjetoJson = {
        portal: "Leitura.analytics",
        versao_esquema: "2026.1",
        data_exportacao: new Date().toISOString(),
        metricas_resumo: {
            total_registos_exportados: dadosParaExportar.length,
            total_bugs: dadosParaExportar.filter(d => d.tipo.toLowerCase() === "bug").length,
            total_melhorias: dadosParaExportar.filter(d => d.tipo.toLowerCase() === "melhoria").length,
            tempo_total_acumulado_horas: dadosParaExportar.reduce((acc, curr) => acc + curr.tempo, 0)
        },
        registos: dadosParaExportar
    };

    try {

        const jsonString = JSON.stringify(estruturaObjetoJson, null, 2);


        const blob = new Blob([jsonString], { type: "application/json;charset=utf-8;" });


        const urlTemporaria = URL.createObjectURL(blob);


        const linkDownload = document.createElement("a");
        linkDownload.href = urlTemporaria;


        const dataFormatada = new Date().toISOString().slice(0, 10);
        linkDownload.download = `leitura_analytics_export_${dataFormatada}.json`;

        document.body.appendChild(linkDownload);
        linkDownload.click();
        document.body.removeChild(linkDownload);

        URL.revokeObjectURL(urlTemporaria);

    } catch (erro) {
        console.error("Falha ao gerar a exportação do ficheiro JSON:", erro);
        alert("Ocorreu um erro técnico ao tentar compilar o ficheiro de exportação.");
    }
}
document.addEventListener("DOMContentLoaded", () => {
    const btnExportar = $("btnExportarJson");
    if (btnExportar) {
        btnExportar.onclick = () => exportToJSON();
    }
});

/* 
   Etapa 15 — Configurações Avançadas Chart.js (app.js)
 */


if (typeof ChartDataLabels !== "undefined") {
    Chart.register(ChartDataLabels);
    Chart.defaults.set("plugins.datalabels", { display: false });
}


/**
 * Constrói o objeto de configuração de opções do Chart.js, aplicando
 * regras de empilhamento, formatação de percentagens e extração de valores absolutos.
 * @param {boolean} stacked - Define se o gráfico deve empilhar as barras e eixos
 * @returns {Object} Configuração de options pronta para o Chart.js
 */
function copts(stacked) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },

            datalabels: {
                display: (contexto) => {
                    const valor = contexto.dataset.data[contexto.dataIndex];
                    return valor > 0;
                },
                anchor: "center",
                align: "center",
                color: "#ffffff",
                font: {
                    family: "'JetBrains Mono', monospace",
                    size: 10,
                    weight: "600"
                },
                formatter: (val, contexto) => {
                    const raw = contexto.dataset._raw?.[contexto.dataIndex];

                    return raw != null ? `${raw} (${val.toFixed(1)}%)` : `${val.toFixed(1)}%`;
                }
            },

            tooltip: {
                callbacks: {
                    label: function (contexto) {
                        const label = contexto.dataset.label || "";
                        const percentagem = contexto.parsed.y || 0;
                        const raw = contexto.dataset._raw?.[contexto.dataIndex];

                        if (raw != null) {
                            return ` ${label}: ${raw} chamados (${percentagem.toFixed(1)}%)`;
                        }
                        return ` ${label}: ${percentagem.toFixed(1)}%`;
                    }
                }
            }
        },

        scales: {
            x: {
                stacked: !!stacked,
                grid: { display: false }
            },
            y: {
                stacked: !!stacked,
                beginAtZero: true,
                ticks: {
                    font: { family: "'JetBrains Mono', monospace" },
                    callback: function (valor) {
                        return valor.toFixed(0) + "%";
                    }
                }
            }
        }
    };
}

function configurarAlternadorTema() {
    const btn = $("btnTema");
    if (!btn) return;

    btn.onclick = () => {
        const escuroAtivo = document.documentElement.classList.toggle("dark");
        btn.textContent = escuroAtivo ? "☀️ Modo Claro" : "🌙 Modo Escuro";
    };
}

function exportarDashboardParaPdf() {
    const { jsPDF } = window.jspdf;
    const elementoDashboard = $("dashboard");

    if (!elementoDashboard) return;

    alert("Iniciando a renderização do PDF. Aguarde a conversão gráfica dos componentes...");

    html2canvas(elementoDashboard, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: document.documentElement.classList.contains("dark") ? "#121214" : "#ffffff"
    }).then(canvas => {
        const imgData = canvas.toDataURL("image/png");

        const pdf = new jsPDF("l", "mm", "a4");
        const larguraPdf = pdf.internal.pageSize.getWidth();
        const alturaPdf = pdf.internal.pageSize.getHeight();

        const proporcaoCanvas = canvas.width / canvas.height;
        let larguraFinal = larguraPdf - 20;
        let alturaFinal = larguraFinal / proporcaoCanvas;

        if (alturaFinal > alturaFim) {
            alturaFinal = alturaPdf - 20;
            larguraFinal = alturaFinal * proporcaoCanvas;
        }


        pdf.addImage(imgData, "PNG", 10, 10, larguraFinal, alturaFinal);
        pdf.save(`dashboard_leitura_analytics_${new Date().toISOString().slice(0, 10)}.pdf`);
    }).catch(err => {
        console.error("Falha ao gerar PDF:", err);
        alert("Erro na compilação do relatório PDF.");
    });
}

document.addEventListener("DOMContentLoaded", () => {
    configurarAlternadorTema();

    const btnPdf = $("btnExportarPdf");
    if (btnPdf) btnPdf.onclick = () => exportarDashboardParaPdf();
});