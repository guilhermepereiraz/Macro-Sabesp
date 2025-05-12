// macrosite.js
// Este script é carregado no seu arquivo macroSITE.html.

// Torna a função deslogar acessível globalmente para o onclick no HTML
window.deslogar = function() {
    console.log("[macrosite.js] Chamada a deslogar.");
    sessionStorage.removeItem('nomeUsuario'); // Limpa o nome de usuário da sessão
    console.log("[macrosite.js] sessionStorage 'nomeUsuario' limpo. Redirecionando para login.html");
    window.location.href = './login.html'; // Redireciona para a página de login
};

document.addEventListener('DOMContentLoaded', (event) => {
    console.log("[macrosite.js] DOMContentLoaded iniciado.");

    // Obter referências aos elementos da UI (IDs ajustados para o seu HTML)
    const processarBotao = document.getElementById('processar'); // OK: ID 'processar' no HTML
    const novoProcessamentoButton = document.querySelector('#macrosite-completion-summary button'); // OK: Seleciona o botão dentro da div de conclusão, que não tem ID próprio
    const inputArquivo = document.getElementById('arquivo-csv'); // AJUSTADO: ID 'arquivo-csv' no HTML
    const loginInput = document.getElementById('site-login'); // AJUSTADO: ID 'site-login' no HTML
    const senhaInput = document.getElementById('site-password'); // AJUSTADO: ID 'site-password' no HTML
    
    // ATENÇÃO: Elemento 'identificador' NÃO EXISTE NO SEU HTML.
    // A variável será null, e a funcionalidade dependente dela não funcionará.
    const identificadorInput = document.getElementById('identificador'); 

    const mensagemErroDiv = document.getElementById('mensagem-de-erro'); // AJUSTADO: ID 'mensagem-de-erro' no HTML
    const mensagemConclusaoDiv = document.getElementById('macrosite-completion-summary'); // AJUSTADO: ID 'macrosite-completion-summary' no HTML
    const completionMessageText = document.getElementById('completion-message'); // AJUSTADO: ID da mensagem dentro da div de conclusão

    const statusProcessamentoDiv = document.getElementById('macrosite-processing-status'); // AJUSTADO: ID 'macrosite-processing-status' no HTML
    const statusOSAtual = document.getElementById('os-processando'); // AJUSTADO: ID 'os-processando' no HTML
    const statusContadorOS = document.getElementById('quantidade'); // AJUSTADO: ID 'quantidade' no HTML
    const statusTempoRestante = document.getElementById('tempoestimado'); // AJUSTADO: ID 'tempoestimado' no HTML
    
    // ATENÇÃO: Elementos 'loader' e 'progressBar' NÃO EXISTEM NO SEU HTML.
    // A funcionalidade de carregamento/barra de progresso não aparecerá.
    const loader = document.getElementById('loader'); 
    const progressBar = document.getElementById('progressBar'); 
    
    const selectedFileNameSpan = document.getElementById('selected-file-name'); // AJUSTADO: ID 'selected-file-name' no HTML

    // Elementos adicionais do HTML original que podem ser úteis (para a lógica de esconder/mostrar)
    const sitePreviewDiv = document.getElementById('site-preview');
    const formContainerDiv = document.querySelector('#macrosite-section .form-container');
    const introParagraphs = document.querySelectorAll('#macrosite-section h2 ~ p'); // Seleciona parágrafos introdutórios

    // Referências para os rádios de tipo de arquivo (ADICIONADO)
    const csvOption = document.getElementById('csvOption');
    const excelOption = document.getElementById('excelOption');


    // --- Funções Auxiliares da UI ---

    // Função para resetar a UI para um novo processamento
    function resetUI() {
        if (mensagemErroDiv) mensagemErroDiv.style.display = 'none';
        if (mensagemConclusaoDiv) mensagemConclusaoDiv.style.display = 'none';
        if (statusProcessamentoDiv) statusProcessamentoDiv.style.display = 'none';
        if (loader) loader.style.display = 'none';
        if (novoProcessamentoButton) novoProcessamentoButton.style.display = 'none';
        if (processarBotao) processarBotao.disabled = false; // Habilita o botão processar
        if (inputArquivo) inputArquivo.value = ''; // Limpa o input do arquivo
        if (selectedFileNameSpan) selectedFileNameSpan.textContent = 'Nenhum arquivo selecionado'; // Reseta o texto do nome do arquivo

        // Restaura a visibilidade dos elementos do formulário
        if (sitePreviewDiv) sitePreviewDiv.style.display = 'block'; // Ou 'flex' dependendo do seu CSS
        if (formContainerDiv) formContainerDiv.style.display = 'block';
        introParagraphs.forEach(p => p.style.display = 'block');
        
        atualizarFiltroArquivo(); // Garante que o filtro de arquivo seja definido ao resetar a UI (ADICIONADO)
    }

    // Função para atualizar o filtro do input de arquivo (ADICIONADO)
    function atualizarFiltroArquivo() {
        if (inputArquivo && csvOption && excelOption) {
            inputArquivo.accept = csvOption.checked ? '.csv' : (excelOption.checked ? '.xlsx, .xls' : '');
            console.log('Filtro de arquivo atualizado para:', inputArquivo.accept);
        }
    }

    // --- Funções Expostas ao Eel (Chamadas do Python) ---
    // Estas funções são chamadas do backend Python para atualizar o frontend.

    eel.expose(display_macro_error_frontend);
    function display_macro_error_frontend(errorMessage) {
        console.error("Erro recebido do Python:", errorMessage);
        if (mensagemErroDiv) {
            mensagemErroDiv.textContent = errorMessage;
            mensagemErroDiv.style.display = 'block';
        }
        if (mensagemConclusaoDiv) mensagemConclusaoDiv.style.display = 'none';
        if (statusProcessamentoDiv) statusProcessamentoDiv.style.display = 'none'; // Oculta o container de status de processamento
        if (loader) loader.style.display = 'none'; // Oculta o loader
        if (novoProcessamentoButton) novoProcessamentoButton.style.display = 'block'; // Mostra o botão para iniciar um novo processamento
        if (statusOSAtual) statusOSAtual.textContent = "Erro na Macro!";
        if (statusContadorOS) statusContadorOS.textContent = "0/0";
        if (statusTempoRestante) statusTempoRestante.textContent = "00:00:00";
        if (progressBar) {
            progressBar.style.width = '0%';
            progressBar.setAttribute('aria-valuenow', 0);
        }
    }

    eel.expose(display_macro_completion_frontend);
    function display_macro_completion_frontend(completionMessage) {
        console.log("Mensagem de conclusão recebida do Python:", completionMessage);
        if (mensagemConclusaoDiv && completionMessageText) {
            completionMessageText.textContent = completionMessage;
            mensagemConclusaoDiv.style.display = 'block';
        }
        if (mensagemErroDiv) mensagemErroDiv.style.display = 'none';
        if (statusProcessamentoDiv) statusProcessamentoDiv.style.display = 'none'; // Oculta o container de status de processamento
        if (loader) loader.style.display = 'none'; // Oculta o loader
        if (novoProcessamentoButton) novoProcessamentoButton.style.display = 'block'; // Mostra o botão para iniciar um novo processamento
        if (statusOSAtual) statusOSAtual.textContent = "Processamento Concluído!"; // Atualiza o status final
    }

    eel.expose(atualizar_status_os);
    function atualizar_status_os(os_number, processed_count, total_count, status_code, status_message) {
        if (statusOSAtual) statusOSAtual.textContent = `OS Atual: ${os_number} - ${status_message}`;
        if (statusContadorOS) statusContadorOS.textContent = `${processed_count}/${total_count}`;
        if (progressBar) {
            const progress = (processed_count / total_count) * 100;
            progressBar.style.width = `${progress}%`;
            progressBar.setAttribute('aria-valuenow', progress);
        }
    }

    eel.expose(atualizar_tempo_restante_js);
    function atualizar_tempo_restante_js(time_remaining_formatted) {
        if (statusTempoRestante) statusTempoRestante.textContent = `Tempo Restante: ${time_remaining_formatted}`;
    }


    // --- Listeners de Eventos para Botões ---

    // Listener para o botão de processar
    if (processarBotao) {
        processarBotao.addEventListener('click', async () => {
            console.log("Botão 'Iniciar Processamento' clicado.");
            // Resetar mensagens e status anteriores da UI
            if (mensagemErroDiv) mensagemErroDiv.style.display = 'none';
            if (mensagemConclusaoDiv) mensagemConclusaoDiv.style.display = 'none';
            if (novoProcessamentoButton) novoProcessamentoButton.style.display = 'none';

            // Obter os valores dos inputs
            const login = loginInput ? loginInput.value : '';
            const senha = senhaInput ? senhaInput.value : '';
            const identificador = identificadorInput ? identificadorInput.value : ''; // Será '' se o elemento não for encontrado
            const arquivo = inputArquivo && inputArquivo.files.length > 0 ? inputArquivo.files[0] : null;

            let missingFields = [];
            if (!login) missingFields.push("Login");
            if (!senha) missingFields.push("Senha");
            if (!arquivo) missingFields.push("Arquivo");

            // SÓ VALIDA O CAMPO IDENTIFICADOR SE O ELEMENTO EXISTIR NO HTML
            if (identificadorInput && !identificador) {
                missingFields.push("Identificador");
            } else if (!identificadorInput) {
                // Se o elemento input 'identificador' não existir no HTML, apenas avisa
                // e continua sem validar este campo especificamente.
                console.warn("Identificador input não encontrado no HTML. O valor será enviado como vazio.");
            }

            if (missingFields.length > 0) {
                display_macro_error_frontend("Por favor, preencha todos os campos e selecione um arquivo.");
                return;
            }

            // Ler o conteúdo do arquivo como base64
            const reader = new FileReader();
            reader.onload = async (e) => {
                const fileContent = e.target.result; // Conteúdo do arquivo em base64
                const fileName = arquivo.name;
                let fileType = '';

                // Determinar o tipo do arquivo com base nos rádios selecionados
                if (csvOption && csvOption.checked) {
                    fileType = 'csv';
                } else if (excelOption && excelOption.checked) {
                    fileType = 'excel';
                } else {
                    display_macro_error_frontend("Por favor, selecione o tipo de arquivo (CSV ou Excel).");
                    return;
                }
                
                // Ocultar o formulário e exibir o status de processamento
                if (sitePreviewDiv) sitePreviewDiv.style.display = 'none';
                if (formContainerDiv) formContainerDiv.style.display = 'none';
                introParagraphs.forEach(p => p.style.display = 'none');


                // Mostrar elementos da UI de processamento
                if (loader) loader.style.display = 'block';
                if (statusProcessamentoDiv) statusProcessamentoDiv.style.display = 'block';
                if (statusOSAtual) statusOSAtual.textContent = "Iniciando macro...";
                if (statusContadorOS) statusContadorOS.textContent = "0/0";
                if (statusTempoRestante) statusTempoRestante.textContent = "Calculando...";
                if (progressBar) {
                    progressBar.style.width = '0%';
                    progressBar.setAttribute('aria-valuenow', 0);
                }
                if (processarBotao) processarBotao.disabled = true; // Desabilita o botão 'Processar' durante a execução

                try {
                    // === CHAMADA PARA A FUNÇÃO PYTHON EXPOSTA AO EEL ===
                    // O nome da função em Python (no main.py) é 'iniciar_macro_eel'
                    const resultadoPython = await eel.iniciar_macro_eel(
                        fileContent,
                        login,
                        senha,
                        fileName,
                        fileType,
                        identificador
                    )(); // O '()' final executa a promessa retornada pelo Eel

                    // Se o Python já retornar um erro na fase inicial (ex: arquivo vazio, login falho), exibe.
                    // Erros durante o processamento individual das OSs serão tratados pelas funções display_macro_error_frontend
                    // chamadas do Python.
                    if (resultadoPython && resultadoPython.status === "erro") {
                        display_macro_error_frontend(resultadoPython.message || "Erro desconhecido ao iniciar a macro.");
                    } else {
                        console.log("Macro iniciada no Python (status 'concluido' ou 'iniciada'). O frontend aguardará atualizações.");
                    }
                } catch (e) {
                    // Captura erros na comunicação com o backend ou na própria chamada da função Eel
                    console.error("Erro ao chamar função Eel:", e);
                    display_macro_error_frontend(`Erro de comunicação com o backend: ${e.message || e}`);
                } finally {
                    // Reabilita o botão 'Processar' ao final da execução (sucesso ou erro)
                    if (processarBotao) processarBotao.disabled = false;
                }
            };
            reader.readAsDataURL(arquivo); // Inicia a leitura do arquivo como Data URL (base64)
        });
    } else {
        console.error("Elemento com ID 'processar' (botão Iniciar Processamento) não encontrado no DOM.");
    }


    // Listener para o input de arquivo para exibir o nome do arquivo selecionado
    if (inputArquivo && selectedFileNameSpan) {
        inputArquivo.addEventListener('change', function() {
            if (inputArquivo.files.length > 0) {
                selectedFileNameSpan.textContent = inputArquivo.files[0].name;
                // Limpa erro se um arquivo é selecionado
                if (mensagemErroDiv) {
                    mensagemErroDiv.style.display = 'none';
                    mensagemErroDiv.textContent = '';
                }
            } else {
                selectedFileNameSpan.textContent = 'Nenhum arquivo selecionado';
            }
        });
    }

    // Adiciona listeners para os rádios e chama a função inicialmente
    if (csvOption) csvOption.addEventListener('change', atualizarFiltroArquivo);
    if (excelOption) excelOption.addEventListener('change', atualizarFiltroArquivo);
    atualizarFiltroArquivo(); // Chama uma vez para definir o filtro inicial


    // Listener para o botão de Novo Processamento
    if (novoProcessamentoButton) {
        novoProcessamentoButton.addEventListener('click', () => {
            resetUI(); // Reseta a UI completamente para permitir um novo processamento
        });
    } else {
        console.error("Elemento 'novoProcessamentoButton' (botão Novo Processamento) não encontrado no DOM.");
    }

    // --- Configuração Inicial da UI ---
    resetUI(); // Garante que a UI está no estado inicial correto ao carregar a página

    // Lógica para os campos de hora/usuário no cabeçalho (já existem no seu HTML)
    const nomeUsuarioElement = document.getElementById('nome-usuario');
    const currentTimeElement = document.getElementById('current-time');
    const loggedInTimeElement = document.getElementById('logged-in-time'); // ID 'logged-in-time' no HTML

    function obterParametroDaURL(nome) {
        nome = nome.replace(/[\[\]]/g, '\\$&');
        const regex = new RegExp('[?&]' + nome + '(=([^&#]*)|&|#|$)');
        const results = regex.exec(window.location.href);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, ' '));
    }

    let identificadorUsuario = obterParametroDaURL('identificador');
    if (!identificadorUsuario) {
        identificadorUsuario = sessionStorage.getItem('nomeUsuario');
        if (identificadorUsuario) {
            console.log("[macrosite.js] Nome do usuário obtido do sessionStorage.");
        } else {
            console.warn("[macrosite.js] Identificador do usuário não encontrado na URL ou sessionStorage. Usuário pode não estar logado.");
        }
    } else {
        sessionStorage.setItem('nomeUsuario', identificadorUsuario);
        console.log("[macrosite.js] Nome do usuário obtido da URL e armazenado em sessionStorage.");
    }
    if (identificadorUsuario && nomeUsuarioElement) {
        nomeUsuarioElement.textContent = identificadorUsuario;
        console.log("[macrosite.js] Nome do usuário exibido:", identificadorUsuario);
    } else if (nomeUsuarioElement) {
        nomeUsuarioElement.textContent = "Usuário Desconhecido";
    }

    function atualizarHorarioAtual() {
        if (currentTimeElement) {
            const agora = new Date();
            const horas = agora.getHours().toString().padStart(2, '0');
            const minutos = agora.getMinutes().toString().padStart(2, '0');
            const segundos = agora.getSeconds().toString().padStart(2, '0');
            const dia = agora.getDate().toString().padStart(2, '0');
            const mes = (agora.getMonth() + 1).toString().padStart(2, '0');
            const ano = agora.getFullYear();
            currentTimeElement.textContent = `${dia}/${mes}/${ano} - ${horas}:${minutos}:${segundos}`;
        }
    }
    atualizarHorarioAtual();
    setInterval(atualizarHorarioAtual, 1000);

    // Listeners para botões de Pausar e Encerrar (se você tiver esses botões no seu HTML)
    const pausarBotao = document.getElementById('pausar');
    const encerrarBotao = document.getElementById('encerrar');

    if (pausarBotao) {
        pausarBotao.addEventListener('click', () => {
            console.log('Botão Pausar clicado. Enviando solicitação para pausar a macro.');
            if (typeof eel !== 'undefined') {
                eel.pausar_macro_backend()();
            } else {
                console.warn("Eel não está disponível para pausar a macro.");
            }
        });
    } else {
        console.warn("Elemento com ID 'pausar' não encontrado para o botão Pausar.");
    }

    if (encerrarBotao) {
        encerrarBotao.addEventListener('click', () => {
            console.log('Botão Encerrar clicado. Enviando solicitação para encerrar a macro.');
            if (typeof eel !== 'undefined') {
                eel.parar_macro_backend()();
            } else {
                console.warn("Eel não está disponível para encerrar a macro.");
            }
        });
    } else {
        console.warn("Elemento com ID 'encerrar' não encontrado para o botão Encerrar.");
    }

    console.log("[macrosite.js] DOMContentLoaded finalizado.");
});