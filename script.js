// --- VALIDAÇÃO DE SEGURANÇA (TRAVA DE LOGIN) ---
if (localStorage.getItem('usuario_logado') !== 'true') {
    alert("Acesso negado! Por favor, faça o login primeiro.");
    window.location.href = "login.html";
}

// --- CONFIGURAÇÃO E CRONOGRAMA DINÂMICO ---
const SEMANA_INICIO = 15;
let SEMANA_FIM = 20; 
const STORAGE_KEY = 'portfolio_disciplinas_dados';

const urlParams = new URLSearchParams(window.location.search);
let MODO_PROFESSOR = urlParams.get('modo') === 'professor';

let materiaAtual = 'Inteligência Artificial';

// Inicia o sistema com um objeto de dados limpo na memória RAM
let dadosPortfolio = carregarDadosIniciais();

// --- 1. INICIALIZAÇÃO DO SISTEMA ---
document.addEventListener('DOMContentLoaded', () => {
    injetarEstilosModal(); 
    atualizarLimiteSemanas(); 
    atualizarInterfaceModo();
    configurarMenuLateral();
    renderizarSemanas();
    configurarBotaoBackup(); 
});

function carregarDadosIniciais() {
    const salvos = localStorage.getItem(STORAGE_KEY);
    // Se o que estiver salvo no localStorage for válido e leve, carrega. Se não, inicia vazio.
    try {
        return salvos ? JSON.parse(salvos) : {};
    } catch(e) {
        return {};
    }
}

function salvarNoStorage() {
    try {
        // Tenta salvar no storage apenas se os dados forem pequenos (< 5MB)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dadosPortfolio));
    } catch (e) {
        // Ignora silenciosamente o erro do localStorage para não travar a aplicação na tela.
        // O usuário usará o botão "Exportar Backup" para salvar os arquivos de forma persistente.
        console.warn("Aviso: Limite do navegador excedido. Lembre-se de clicar em 'Exportar Backup' antes de fechar a página.");
    }
}

function atualizarLimiteSemanas() {
    const nomeMateria = materiaAtual.toLowerCase();
    if (nomeMateria.includes('inteligência') || nomeMateria.includes('ia') || nomeMateria.includes('versionamento')) {
        SEMANA_FIM = 20;
    } else {
        SEMANA_FIM = 21; 
    }
}

function alternarModoVisualizacao() {
    MODO_PROFESSOR = !MODO_PROFESSOR;
    const novaUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + (MODO_PROFESSOR ? '?modo=professor' : '');
    window.history.pushState({ path: novaUrl }, '', novaUrl);
    atualizarInterfaceModo();
    renderizarSemanas();
}
function atualizarInterfaceModo() {
    const cronogramaTexto = document.querySelector('.cronograma-texto');
    const controlesAluno = document.getElementById('controles-aluno');
    const btnAlternar = document.getElementById('btn-alternar-modo');
    
    if (MODO_PROFESSOR) {
        if (cronogramaTexto) {
            cronogramaTexto.innerHTML = `<strong>Modo de Visualização (Professor)</strong> — Portfólio de Atividades (Semanas ${SEMANA_INICIO} a ${SEMANA_FIM}):`;
            cronogramaTexto.style.color = '#6d28d9';
        }
        if (controlesAluno) controlesAluno.style.display = 'none';
        if (btnAlternar) {
            btnAlternar.textContent = "Voltar para Modo Aluno";
            btnAlternar.classList.add('ativo-prof');
        }
    } else {
        if (cronogramaTexto) {
            cronogramaTexto.innerHTML = `Cronograma da Atividade (Semanas ${SEMANA_INICIO} a ${SEMANA_FIM}):`;
            cronogramaTexto.style.color = '#64748b';
        }
        if (controlesAluno) controlesAluno.style.display = 'block';
        if (btnAlternar) {
            btnAlternar.textContent = "Visualizar como Professor";
            btnAlternar.classList.remove('ativo-prof');
        }
    }
}

function configurarMenuLateral() {
    const itensMenu = document.querySelectorAll('.menu-item');
    itensMenu.forEach(item => {
        item.addEventListener('click', (e) => {
            itensMenu.forEach(i => i.classList.remove('ativo'));
            const botaoAlvo = e.target.closest('.menu-item');
            botaoAlvo.classList.add('ativo');
            
            materiaAtual = botaoAlvo.getAttribute('data-materia');
            
            atualizarLimiteSemanas(); 
            atualizarInterfaceModo(); 
            renderizarSemanas();
        });
    });
}

function renderizarSemanas() {
    const container = document.getElementById('container-semanas');
    if (!container) return;
    container.innerHTML = ''; 

    if (!dadosPortfolio[materiaAtual]) {
        dadosPortfolio[materiaAtual] = {};
    }

    for (let i = SEMANA_INICIO; i <= SEMANA_FIM; i++) {
        const chaveSemana = `semana_${i}`;
        
        const registro = dadosPortfolio[materiaAtual][chaveSemana] || { texto: "", arquivos: [] };
        if (!registro.arquivos) registro.arquivos = []; 
        
        const temTexto = registro.texto && registro.texto.trim() !== "";
        const temArquivos = registro.arquivos.length > 0;
        const temConteudo = temTexto || temArquivos;
        
        const card = document.createElement('div');
        card.className = 'card';
        
        let htmlAnexo = '';
        if (temArquivos) {
            htmlAnexo = registro.arquivos.map((arq, index) => `
                <div class="anexo-box" style="margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center; background: #f8fafc; padding: 6px 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
                    <span style="color: #334155; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 150px; font-size: 13px;" title="${arq.nome}">
                        Arquivo: ${arq.nome}
                    </span>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <a href="${arq.conteudo}" download="${arq.nome}" style="color: #4f46e5; text-decoration: none; font-weight: 600; font-size: 13px;">Baixar</a>
                        ${!MODO_PROFESSOR ? `<span onclick="excluirAnexo(i, {index})" style="color: #ef4444; cursor: pointer; font-size: 16px; font-weight: bold; margin-left: 4px;" title="Remover este arquivo">✕</span>` : ''}
                    </div>
                </div>
            `).join('');
        }
        
        let htmlBotoesAcao = '';
        if (!MODO_PROFESSOR) {
            htmlBotoesAcao = `
                <button class="btn-acao" onclick="editarSemana(${i})">
                    ${temTexto ? 'Editar Texto' : 'Adicionar Texto'}
                </button>
                <button class="btn-acao" onclick="document.getElementById('anexo-semana-${i}').click()">
                    Adicionar Anexo
                </button>
                <input type="file" id="anexo-semana-${i}" style="display: none;" multiple onchange="adicionarAnexo(event, ${i})">
                ${temConteudo ? `<button class="btn-acao btn-excluir" onclick="excluirSemana(\${i})">Excluir Registro</button>` : ''}
            `;
        } else {
            htmlBotoesAcao = `<span style="font-size: 12px; color: #94a3b8; font-style: italic; display: flex; align-items: center; gap: 4px;">Apenas Leitura</span>`;
        }
        
        const textoFormatado = temTexto ? registro.texto.replace(/\n/g, '<br>') : '';

        card.innerHTML = `
            <div class="card-header">
                <span class="card-title">Semana ${i}</span>
                <span class="badge ${temConteudo ? 'atual' : 'vazio'}">
                    ${temConteudo ? 'Concluído' : 'Não Iniciado'}
                </span>
            </div>
            <div class="card-body ${!temConteudo ? 'text-vazio' : ''}">
                ${temTexto ? textoFormatado : (!temArquivos ? 'Nenhum registro adicionado para esta semana.' : '')}
                <div class="lista-anexos-container" style="margin-top: 10px;">
                    ${htmlAnexo}
                </div>
            </div>
            <div class="card-actions">
                ${htmlBotoesAcao}
            </div>
        `;
        
        container.appendChild(card);
    }
}
function editarSemana(numeroSemana) {
    if (MODO_PROFESSOR) return;
    const chaveSemana = `semana_${numeroSemana}`;
    const textoAtual = dadosPortfolio[materiaAtual][chaveSemana]?.texto || "";

    const modalExistente = document.getElementById('modal-editor-semana');
    if (modalExistente) modalExistente.remove();

    const modal = document.createElement('div');
    modal.id = 'modal-editor-semana';
    modal.className = 'custom-modal-overlay';
    modal.innerHTML = `
        <div class="custom-modal-box">
            <h3>Digite o registro para a Semana ${numeroSemana}:</h3>
            <textarea id="modal-textarea-texto" placeholder="Cole ou digite seu texto aqui...">${textoAtual}</textarea>
            <div class="custom-modal-buttons">
                <button class="modal-btn-cancelar" id="modal-btn-cancelar">Cancelar</button>
                <button class="modal-btn-salvar" id="modal-btn-salvar">OK</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const textarea = document.getElementById('modal-textarea-texto');
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);

    document.getElementById('modal-btn-salvar').addEventListener('click', () => {
        if (!dadosPortfolio[materiaAtual][chaveSemana]) dadosPortfolio[materiaAtual][chaveSemana] = { texto: "", arquivos: [] };
        dadosPortfolio[materiaAtual][chaveSemana].texto = textarea.value.trim();
        salvarNoStorage();
        renderizarSemanas();
        modal.remove();
    });

    document.getElementById('modal-btn-cancelar').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
}

function adicionarAnexo(event, numeroSemana) {
    if (MODO_PROFESSOR) return;
    const chaveSemana = `semana_${numeroSemana}`;
    const arquivosSelecionados = event.target.files;
    if (!arquivosSelecionados || arquivosSelecionados.length === 0) return;

    if (!dadosPortfolio[materiaAtual][chaveSemana]) dadosPortfolio[materiaAtual][chaveSemana] = { texto: "", arquivos: [] };
    if (!dadosPortfolio[materiaAtual][chaveSemana].arquivos) dadosPortfolio[materiaAtual][chaveSemana].arquivos = [];

    Array.from(arquivosSelecionados).forEach(arquivo => {
        // Validador estendido para arquivos pesados de até 100MB
        if (arquivo.size > 104857600) {
            alert(`O arquivo "${arquivo.name}" é muito grande! Limite de até 100MB.`);
            return;
        }
        const leitor = new FileReader();
        leitor.onload = function(e) {
            dadosPortfolio[materiaAtual][chaveSemana].arquivos.push({ nome: arquivo.name, conteudo: e.target.result });
            salvarNoStorage();
            renderizarSemanas();
        };
        leitor.readAsDataURL(arquivo);
    });
    event.target.value = '';
}

function excluirAnexo(numeroSemana, indiceArquivo) {
    if (MODO_PROFESSOR) return;
    const chaveSemana = `semana_${numeroSemana}`;
    if (dadosPortfolio[materiaAtual][chaveSemana] && dadosPortfolio[materiaAtual][chaveSemana].arquivos) {
        dadosPortfolio[materiaAtual][chaveSemana].arquivos.splice(indiceArquivo, 1);
        salvarNoStorage();
        renderizarSemanas();
    }
}

function excluirSemana(numeroSemana) {
    if (MODO_PROFESSOR) return;
    const chaveSemana = `semana_${numeroSemana}`;
    if (dadosPortfolio[materiaAtual][chaveSemana]) {
        if (confirm(`Tem certeza que deseja excluir todo o registro da Semana ${numeroSemana}?`)) {
            delete dadosPortfolio[materiaAtual][chaveSemana];
            salvarNoStorage();
            renderizarSemanas();
        }
    }
}

function configurarBotaoBackup() {
    let btnExportar = document.getElementById('btn-exportar-backup');
    let btnImportar = document.getElementById('btn-importar-backup');
    
    const botoes = document.querySelectorAll('button');
    for (let btn of botoes) {
        const texto = btn.textContent.trim().toLowerCase();
        if (!btnExportar && texto.includes('exportar')) btnExportar = btn;
        if (!btnImportar && texto.includes('importar')) btnImportar = btn;
    }

    if (btnExportar) btnExportar.addEventListener('click', exportarBackup);
    
    if (btnImportar) {
        const inputImportar = document.createElement('input');
        inputImportar.type = 'file';
        inputImportar.accept = '.json';
        inputImportar.style.display = 'none';
        document.body.appendChild(inputImportar);

        btnImportar.addEventListener('click', () => inputImportar.click());
        inputImportar.addEventListener('change', importarBackup);
    }
}

function exportarBackup() {
    if (!dadosPortfolio || Object.keys(dadosPortfolio).length === 0) { 
        alert("Não existem registros cadastrados na sessão para exportar!"); 
        return; 
    }
    const blob = new Blob([JSON.stringify(dadosPortfolio)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `portfolio_completo_nycollas.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function importarBackup(event) {
    const arquivo = event.target.files[0];
    if (!arquivo) return;

    const leitor = new FileReader();
    leitor.onload = function(e) {
        try {
            const dadosImportados = JSON.parse(e.target.result);
            if (confirm("Importar este arquivo substituirá a visualização da tela atual. Continuar?")) {
                dadosPortfolio = dadosImportados;
                atualizarLimiteSemanas();
                renderizarSemanas();
                alert("Dados de grande porte carregados com sucesso na sessão atual!");
            }
        } catch (erro) {
            alert("Erro: O arquivo selecionado é inválido.");
        }
    };
    leitor.readAsText(arquivo);
    event.target.value = '';
}

function injetarEstilosModal() {
    if (document.getElementById('estilos-modal-dinamico')) return;
    const style = document.createElement('style');
    style.id = 'estilos-modal-dinamico';
    style.innerHTML = `
        .custom-modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 9999; font-family: sans-serif; }
        .custom-modal-box { background: #fff; padding: 24px; border-radius: 12px; width: 90%; max-width: 550px; box-shadow: 0 10px 25px rgba(0,0,0,0.15); }
        .custom-modal-box h3 { margin-top: 0; margin-bottom: 12px; color: #1e293b; font-size: 16px; font-weight: 600; }
        .custom-modal-box textarea { width: 100%; height: 180px; padding: 12px; border: 1px solid #cbd5e1; border-radius: 6px; resize: vertical; font-size: 14px; color: #334155; box-sizing: border-box; line-height: 1.5; outline: none; }
        .custom-modal-box textarea:focus { border-color: #4f46e5; box-shadow: 0 0 0 2px rgba(79,70,229,0.1); }
        .custom-modal-buttons { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
        .custom-modal-buttons button { padding: 8px 18px; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; border: none; transition: background 0.2s; }
        .modal-btn-cancelar { background: #f1f5f9; color: #475569; }
        .modal-btn-salvar { background: #1e1b4b; color: #fff; font-weight: bold !important; }
    `;
    document.head.appendChild(style);
}
