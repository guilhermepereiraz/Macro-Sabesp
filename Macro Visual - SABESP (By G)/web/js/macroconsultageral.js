function chamarDuvida() {
    const lampadaIcon = document.getElementById('iconeduvida');
    const divDuvida = document.getElementById('duvida-site');

    if (lampadaIcon && divDuvida) {
        if (divDuvida.style.display === 'none' || divDuvida.style.display === '') {
            console.log("Estado atual: Oculto. Mudando para: Visível (ícone Laranja).");
            divDuvida.style.display = 'block';
            lampadaIcon.style.color = 'orange';
            lampadaIcon.style.marginBottom = '0px';
        } else {
            console.log("Estado atual: Visível. Mudando para: Oculto (ícone Azul).");
            divDuvida.style.display = 'none';
            lampadaIcon.style.color = 'rgb(5, 110, 248)';
            lampadaIcon.style.marginBottom = '1%';
        }
    } else {
        if (!lampadaIcon) console.error("Elemento com ID 'iconeduvida' (ícone da lâmpada) não encontrado no DOM. Verifique seu HTML.");
        if (!divDuvida) console.error("Elemento com ID 'duvida-site' (div de dúvida) não encontrado no DOM. Verifique seu HTML.");
    }
}

document.addEventListener('DOMContentLoaded', (event) => {
    console.log('DOMContentLoaded disparado. Chamando iniciarTransicaoPagina.');
    iniciarTransicaoPagina();
    console.log('[macroconsultageral.js] DOMContentLoaded finalizado.');

    preencherCampos_NETA();

    // Código da animação anime.js
    var textWrapper = document.querySelector('.ml7 .letters');
    if (textWrapper) {
        textWrapper.innerHTML = textWrapper.textContent.replace(/\S/g, "<span class='letter'>$&</span>");
        anime.timeline({ loop: true })
            .add({
                targets: '.ml7 .letter',
                translateY: ["1.1em", 0],
                translateX: ["0.55em", 0],
                translateZ: 0,
                rotateZ: [180, 0],
                duration: 750,
                easing: "easeOutExpo",
                delay: (el, i) => 50 * i
            }).add({
                targets: '.ml7',
                opacity: 0,
                duration: 4000,
                easing: "easeOutExpo",
                delay: 1000
            });
    } else {
        console.error("Element with class '.ml7 .letters' not found.");
    }

    // >>> INICIA O CICLO DE DICAS ASSIM QUE O DOM ESTIVER PRONTO <<<
    // (Útil para testes se a div de status já está visível no HTML)
    startTipCycle();

});

function iniciarTransicaoPagina() {
    console.log("[macroconsultageral.js] Chamada a iniciarTransicaoPagina.");
    const bodyElement = document.body;
    if (bodyElement) {
        bodyElement.style.display = 'block';
        setTimeout(() => {
            bodyElement.classList.add('is-visible');
            console.log("[macroconsultageral.js] Transição de entrada iniciada para o body.");
        }, 5);
    } else {
        console.error("[macroconsultageral.js] Elemento body não encontrado.");
    }
}

window.onload = function () {
    console.log("[macroconsultageral.js] window.onload iniciado.");

    // DECLARAÇÃO DE TODAS AS REFERÊNCIAS DE ELEMENTOS AQUI DENTRO
    const nomeUsuarioElement = document.getElementById('nome-usuario');
    const currentTimeElement = document.getElementById('current-time');
    const loggedInTimeElement = document.getElementById('logged-in-time');
    const processarBotao = document.getElementById('processar'); // Botão "Iniciar" no HTML tem ID="processar"
    const novoProcessamentoButton = document.querySelector('#macrosite-completion-summary button');
    const inputArquivo = document.getElementById('arquivo-csv');
    const loginInput = document.getElementById('neta-login');
    const senhaInput = document.getElementById('neta-password');
    const identificadorInput = document.getElementById('identificador'); // Verificar se este ID existe no HTML
    const mensagemErroDiv = document.getElementById('macrosite-error-message');
    const mensagemConclusaoDiv = document.getElementById('macrosite-completion-summary');
    const completionMessageText = document.getElementById('completion-message');
    const statusProcessamentoDiv = document.getElementById('macrosite-processing-status');
    const statusOSAtual = document.getElementById('os-processando');
    const statusContadorOS = document.getElementById('quantidade');
    const statusTempoRestante = document.getElementById('tempoestimado');
    const loader = document.getElementById('loader'); // Verificar se este ID existe no HTML
    const progressBar = document.getElementById('progressBar'); // Verificar se este ID existe no HTML
    const selectedFileNameSpan = document.getElementById('selected-file-name');
    const sitePreviewDiv = document.getElementById('site-preview');
    const formContainerDiv = document.querySelector('#macrosite-section .form-container'); // Verificar se este seletor está correto
    const introParagraphs = document.querySelectorAll('#macrosite-section h2 ~ p'); // Verificar se este seletor está correto
    const csvOption = document.getElementById('csvOption');
    const excelOption = document.getElementById('excelOption');
    const divprocesso = document.getElementById('macrosite-form');
    const pdeOption = document.getElementById('pdeOption');
    const hidroOption = document.getElementById('hidroOption');
    const encerrarBotao = document.getElementById('encerrar');
    const pausarBotao = document.getElementById('pausar');
    // FIM DA DECLARAÇÃO DE REFERÊNCIAS


    // FUNÇÕES DE ATUALIZAÇÃO DE TEMPO (MOVIDAS PARA DENTRO DE window.onload)
    function formatTime(totalSeconds) {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const paddedHours = String(hours).padStart(2, '0');
        const paddedMinutes = String(minutes).padStart(2, '0');
        const paddedSeconds = String(seconds).padStart(2, '0');
        return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
    }

    function updateLoggedInTime(sessionStartTime) {
        if (!loggedInTimeElement) {
            console.error("Elemento com ID 'logged-in-time' não encontrado dentro de updateLoggedInTime.");
            return;
        }
        const now = Date.now();
        const elapsedMilliseconds = now - sessionStartTime;
        const elapsedSeconds = Math.floor(elapsedMilliseconds / 1000);
        loggedInTimeElement.innerText = formatTime(elapsedSeconds);
    }

    function atualizarHorarioAtual() {
        if (!currentTimeElement) {
            console.error("Elemento para hora atual não encontrado dentro de atualizarHorarioAtual.");
            return;
        }
        const agora = new Date();
        const dia = agora.getDate().toString().padStart(2, '0');
        const mes = (agora.getMonth() + 1).toString().padStart(2, '0');
        const ano = agora.getFullYear();
        const horas = agora.getHours().toString().padStart(2, '0');
        const minutos = agora.getMinutes().toString().padStart(2, '0');
        const segundos = agora.getSeconds().toString().padStart(2, '0');
        currentTimeElement.textContent = `${dia}/${mes}/${ano} - ${horas}:${minutos}:${segundos}`;
    }
    // FIM DAS FUNÇÕES DE ATUALIZAÇÃO DE TEMPO


    // --- Lógica do timer logado (iniciada dentro de window.onload) ---
    let sessionStartTime = sessionStorage.getItem('sessionStartTime');
    console.log(`Timer: Tentando obter sessionStartTime do sessionStorage. Valor: ${sessionStartTime}`);

    if (sessionStartTime) {
        sessionStartTime = parseInt(sessionStartTime, 10);
        if (!isNaN(sessionStartTime)) {
            console.log("Timer: sessionStartTime válido obtido do sessionStorage.");
            updateLoggedInTime(sessionStartTime);
            setInterval(() => {
                updateLoggedInTime(sessionStartTime);
            }, 1000);
            console.log("Timer: Timer iniciado usando sessionStorage.");
        } else {
            console.error("Timer: Valor inválido para sessionStartTime no sessionStorage. Limpando...");
            if (loggedInTimeElement) {
                loggedInTimeElement.innerText = "Erro no timer (storage)";
            }
            sessionStorage.removeItem('sessionStartTime');
        }
    } else {
        const urlParams = new URLSearchParams(window.location.search);
        const loginTimeParam = urlParams.get('login_time');
        console.log(`Timer: sessionStartTime não encontrado no sessionStorage. Checando URL (improvável). Valor: ${loginTimeParam}`);

        if (loginTimeParam) {
            sessionStartTime = parseInt(loginTimeParam, 10);
            if (!isNaN(sessionStartTime)) {
                console.log("Timer: sessionStartTime válido obtido da URL (fallback).");
                sessionStorage.setItem('sessionStartTime', sessionStartTime);
                console.log("Timer: sessionStartTime salvo em sessionStorage a partir da URL.");
                updateLoggedInTime(sessionStartTime);
                setInterval(() => {
                    updateLoggedInTime(sessionStartTime);
                }, 1000);
                console.log("Timer: Timer iniciado usando URL (fallback).");
            } else {
                console.error("Timer: Parâmetro 'login_time' inválido na URL (fallback).");
                if (loggedInTimeElement) {
                    loggedInTimeElement.innerText = "Erro no timer (URL fallback)";
                }
            }
        } else {
            console.warn("Timer: Parâmetro 'login_time' não encontrado em URL nem sessionStorage. O timer não iniciará.");
            if (loggedInTimeElement) {
                loggedInTimeElement.innerText = "Não iniciado";
            }
        }
    }
    // --- Fim da lógica do timer logado ---


    // --- Lógica de Atualização da Hora Atual (iniciada dentro de window.onload) ---
    atualizarHorarioAtual();
    setInterval(atualizarHorarioAtual, 1000);
    // --- Fim da Lógica de Atualização da Hora Atual ---


    // Filtro dinâmico do input de arquivo (listener adicionado dentro de window.onload)
    function atualizarFiltroArquivo() {
        console.log("atualizarFiltroArquivo chamada");
        
        if (inputArquivo && csvOption && excelOption) {
            console.log("Estado dos inputs:", {
                csvChecked: csvOption.checked,
                excelChecked: excelOption.checked,
                inputArquivo: inputArquivo.id
            });
            
            if (csvOption.checked) {
                inputArquivo.accept = '.csv';
                console.log("Filtro definido para CSV");
            } else if (excelOption.checked) {
                inputArquivo.accept = '.xlsx,.xls';
                console.log("Filtro definido para Excel");
            } else {
                inputArquivo.accept = '';
                console.log("Nenhum filtro definido");
            }
        } else {
            console.error("Elementos necessários não encontrados:", {
                inputArquivo: !!inputArquivo,
                csvOption: !!csvOption,
                excelOption: !!excelOption
            });
        }
    }
    // Adicionando listeners APÓS a declaração dos elementos e da função
    if (csvOption) {
        csvOption.addEventListener('change', atualizarFiltroArquivo);
        console.log("Listener adicionado ao csvOption");
    }
    
    if (excelOption) {
        excelOption.addEventListener('change', atualizarFiltroArquivo);
        console.log("Listener adicionado ao excelOption");
    }
    atualizarFiltroArquivo();


    // Listener para o botão de processar (definido dentro de window.onload)
    if (processarBotao) {
        processarBotao.addEventListener('click', async function (e) {
            if (mensagemErroDiv) mensagemErroDiv.style.display = 'none';
            var login = loginInput ? loginInput.value.trim() : '';
            var senha = senhaInput ? senhaInput.value.trim() : '';
            var arquivoInputFile = document.getElementById('arquivo-csv');
            var arquivo = arquivoInputFile ? arquivoInputFile.value : '';

            if (!login || !senha || !arquivo) {
                if (mensagemErroDiv) {
                    mensagemErroDiv.textContent = 'Preencha todos os campos e selecione um arquivo.';
                    mensagemErroDiv.style.display = 'block';
                }
                e.preventDefault();
                return false;
            }

            var arquivoValido = false;
            if (csvOption && csvOption.checked) {
                arquivoValido = arquivo.toLowerCase().endsWith('.csv');
            } else if (excelOption && excelOption.checked) {
                arquivoValido = arquivo.toLowerCase().endsWith('.xlsx') || arquivo.toLowerCase().endsWith('.xls');
            }

            if (!arquivoValido) {
                if (mensagemErroDiv) {
                    mensagemErroDiv.textContent = 'O arquivo selecionado não corresponde ao tipo escolhido (CSV ou Excel).';
                    mensagemErroDiv.style.display = 'block';
                }
                e.preventDefault();
                return false;
            }

            if (sitePreviewDiv) sitePreviewDiv.style.display = 'none';
            if (divprocesso) divprocesso.style.display = 'none';

            var duvidaIcon = document.getElementById('iconeduvida');

            if (duvidaIcon) duvidaIcon.style.display = 'none';

            if (statusProcessamentoDiv) {
                statusProcessamentoDiv.style.display = 'block';
                statusProcessamentoDiv.removeAttribute('style');
                statusProcessamentoDiv.style.display = 'block';
            }

            // A chamada para startTipCycle foi movida para o DOMContentLoaded para iniciar ao carregar a página para teste.
            // Removida daqui: startTipCycle();


            var tipoPesquisa = (pdeOption && pdeOption.checked) ? 'pde' : (hidroOption && hidroOption.checked) ? 'hidro' : '';
            var tipoArquivo = (csvOption && csvOption.checked) ? 'csv' : (excelOption && excelOption.checked) ? 'excel' : '';
            var nomeArquivo = arquivoInputFile.files && arquivoInputFile.files[0] ? arquivoInputFile.files[0].name : '';

            // Obtém o nome do usuário do span
            const nomeUsuarioSpan = document.getElementById('nome-usuario');
            const nomeUsuario = nomeUsuarioSpan ? nomeUsuarioSpan.textContent.trim() : 'Usuário não identificado';

            if (arquivoInputFile.files && arquivoInputFile.files[0]) {
                var reader = new FileReader();
                reader.onload = function (event) {
                    var conteudoBase64 = event.target.result.split(',')[1];
                    if (typeof eel !== 'undefined') {
                        eel.iniciar_macro_consulta_geral_frontend(
                            conteudoBase64,
                            login,
                            senha,
                            nomeArquivo,
                            tipoArquivo,
                            tipoPesquisa,
                            nomeUsuario // Adiciona o nome do usuário como último parâmetro
                        )().then(response => {
                            // --- NOVO TRATAMENTO DE ERRO DE LOGIN ---
                            if (response && response.status === 'error' && response.message && response.message.toLowerCase().includes('login')) {
                                // Esconde status de processamento
                                if (statusProcessamentoDiv) statusProcessamentoDiv.style.display = 'none';
                                // Mostra novamente o formulário de login
                                if (divprocesso) divprocesso.style.display = 'block';
                                // Mostra mensagem de erro
                                if (mensagemErroDiv) {
                                    mensagemErroDiv.textContent = response.message;
                                    mensagemErroDiv.style.display = 'block';
                                }
                                // Opcional: limpa campos de senha
                                if (senhaInput) senhaInput.value = '';
                                return;
                            }
                            // ... resto do código de tratamento da resposta ...
                        }).catch(error => {
                            console.error("Erro ao iniciar macro:", error);
                            // Em caso de erro inesperado, volta para o formulário
                            if (statusProcessamentoDiv) statusProcessamentoDiv.style.display = 'none';
                            if (divprocesso) divprocesso.style.display = 'block';
                            if (mensagemErroDiv) {
                                mensagemErroDiv.textContent = 'Erro ao iniciar macro. Tente novamente.';
                                mensagemErroDiv.style.display = 'block';
                            }
                        });
                    } else {
                        console.error("Objeto 'eel' não definido. Certifique-se de que o backend Python está rodando e o eel.js está incluído corretamente.");
                    }
                };
                reader.readAsDataURL(arquivoInputFile.files[0]);
            } else {
                console.error("Nenhum arquivo foi selecionado para leitura.");
            }
        });
    } else {
        console.error("Elemento com ID 'processar' (botão Iniciar Processamento) não encontrado no DOM.");
    }

    // Função para carregar e atualizar o nome do usuário
    async function carregarNomeUsuario() {
        console.log("[macroconsultageral.js] Iniciando carregamento do nome do usuário");
        
        const nomeUsuarioElement = document.getElementById('nome-usuario');
        let identificadorUsuario = null;

        // Tenta obter o ID do usuário de várias fontes
        const identificadorUsuarioDaURL = obterParametroDaURL('identificador');
        const userIdFromUrl = obterParametroDaURL('user_id');
        const firstLoginComplete = obterParametroDaURL('first_login_complete');

        console.log("[macroconsultageral.js] Parâmetros URL:", {
            identificadorUsuarioDaURL,
            userIdFromUrl,
            firstLoginComplete
        });

        if (identificadorUsuarioDaURL) {
            identificadorUsuario = identificadorUsuarioDaURL;
            sessionStorage.setItem('nomeUsuario', identificadorUsuario);
            console.log("[macroconsultageral.js] Nome do usuário obtido da URL");
        } else if (userIdFromUrl && firstLoginComplete === 'true') {
            console.log("[macroconsultageral.js] Tentando obter nome por ID do usuário");
            try {
                const resultadoNome = await eel.get_username_by_id(userIdFromUrl)();
                console.log("[macroconsultageral.js] Resultado get_username_by_id:", resultadoNome);

                if (resultadoNome && resultadoNome.status === 'success') {
                    identificadorUsuario = resultadoNome.username;
                    sessionStorage.setItem('nomeUsuario', identificadorUsuario);
                } else {
                    console.error("[macroconsultageral.js] Falha ao obter nome:", resultadoNome);
                }
            } catch (error) {
                console.error("[macroconsultageral.js] Erro ao chamar get_username_by_id:", error);
            }
        } else {
            identificadorUsuario = sessionStorage.getItem('nomeUsuario');
            console.log("[macroconsultageral.js] Tentando obter do sessionStorage:", identificadorUsuario);
        }

        if (nomeUsuarioElement) {
            if (identificadorUsuario) {
                nomeUsuarioElement.textContent = identificadorUsuario;
                console.log("[macroconsultageral.js] Nome atualizado:", identificadorUsuario);
            } else {
                console.log("[macroconsultageral.js] Nome não encontrado, redirecionando...");
                window.location.href = './login.html';
            }
        } else {
            console.error("[macroconsultageral.js] Elemento nome-usuario não encontrado");
        }
    }

    // Função auxiliar para obter parâmetros da URL
    function obterParametroDaURL(nome) {
        nome = nome.replace(/[\[\]]/g, '\\$&');
        const regex = new RegExp('[?&]' + nome + '(=([^&#]*)|&|#|$)');
        const results = regex.exec(window.location.href);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, ' '));
    }

    // Chama a função para carregar o nome do usuário
    carregarNomeUsuario();

}; // Fim de window.onload


function deslogar() {
    console.log("[index.js] Chamada a deslogar.");
    const deslog = document.getElementById('deslog'); // Este ID pode ser do botão de logout
    if (deslog) {
        sessionStorage.removeItem('nomeUsuario'); // Limpa o nome do usuário no logout
        console.log("[index.js] sessionStorage 'nomeUsuario' limpo. Redirecionando para login.html");
        window.location.href = './login.html';
    } else {
        console.error("[index.js] Elemento com ID 'deslog' (botão de logout) não encontrado.");
         // Mesmo se o botão não for encontrado, tentar redirecionar e limpar storage pode ser desejável
         sessionStorage.removeItem('nomeUsuario');
         console.log("[index.js] sessionStorage 'nomeUsuario' limpo (fallback). Redirecionando para login.html");
         window.location.href = './login.html';
    }
}


// >>> INÍCIO CÓDIGO PARA DICAS COM FADE (FUNÇÕES E VARIÁVEIS NO FINAL) <<<

const predefinedTips = [
    "Verifique se a coluna 'PDE' ou 'HIDROMETRO' está correta no seu arquivo.",
    "Em caso de lentidão reinicie, encerre e começe um novo processo.", // Dica nova
    "O processo pode levar um tempo, dependendo do volume de dados.",
    "Você pode pausar o processamento a qualquer momento.",
    "Em caso de muitos erros, revise os dados de entrada e as credenciais do NETA.",
    "O relatório final será gerado automaticamente na sua Área de Trabalho.",
    "Certifique-se de que sua conexão com a internet está estável.",
    "Não feche o programa enquanto o robô estiver trabalhando.",
    "Detalhes sobre os erros serão incluídos no log de erros." // Dica levemente alterada
];

let currentTipIndex = 0;
let tipIntervalId;

function displayNextTipWithFade() {
    // Buscando pelo ID 'dicasaqui'
    const tipTextElement = document.getElementById('dicasaqui');
    if (!tipTextElement) {
        console.error("Elemento para exibir dicas não encontrado (#dicasaqui).");
        return;
    }
    // Adiciona a classe para o fade-out (certifique-se que o CSS para '.fade-out' em #dicasaqui exista)
    tipTextElement.classList.add('fade-out');
    setTimeout(() => {
        currentTipIndex = (currentTipIndex + 1) % predefinedTips.length;
        tipTextElement.textContent = predefinedTips[currentTipIndex];
        tipTextElement.classList.remove('fade-out'); // Remove a classe para o fade-in
    }, 500); // Tempo deve corresponder à transição CSS (0.5s)
};

function startTipCycle() {
    // Limpa qualquer intervalo anterior
    if (tipIntervalId) {
        clearInterval(tipIntervalId);
    }
    // Exibe a primeira dica imediatamente
    displayNextTipWithFade();
    // Configura o intervalo para as próximas dicas
    tipIntervalId = setInterval(displayNextTipWithFade, 5000); // Intervalo de 10 segundos
    console.log("Ciclo de dicas iniciado.");
};

function stopTipCycle() {
    // Para o intervalo de dicas
    if (tipIntervalId) {
        clearInterval(tipIntervalId);
        tipIntervalId = null;
        console.log("Ciclo de dicas parado.");
    }
};

function encerrarMacro() {
    const botaoencerrar = document.getElementById('encerrar');
    const divencerrado = document.getElementById('Divencerrar');
    const divtrasparente = document.getElementById('transps');

    if (botaoencerrar && divencerrado && divtrasparente) {
        divencerrado.style.display = "block"; // Garante que fique visível para animar
        divtrasparente.style.display = "block"; // <-- ADICIONE ESTA LINHA
        // Força reflow para garantir a transição
        void divencerrado.offsetWidth;
        divencerrado.classList.add("active");
        divtrasparente.classList.add("active");
    }
};

function pausarMacro() {
    const botaoencerrar = document.getElementById('pausar');
    const divencerrado = document.getElementById('Divpausar');
    const divtrasparente = document.getElementById('transps');

    if (botaoencerrar && divencerrado && divtrasparente) {
        divencerrado.style.display = "block"; // Garante que fique visível para animar
        divtrasparente.style.display = "block"; // <-- ADICIONE ESTA LINHA
        // Força reflow para garantir a transição
        void divencerrado.offsetWidth;
        divencerrado.classList.add("active");
        divtrasparente.classList.add("active");
    }
};

function NaoEncerrandoMacro() {
    const botaoencerrar = document.getElementById('encerrar');
    const divencerrado = document.getElementById('Divencerrar');
    const divtrasparente = document.getElementById('transps');

    if (botaoencerrar && divencerrado && divtrasparente) {
        // Inicia a animação de saída
        divencerrado.classList.remove("active");
        divtrasparente.classList.remove("active");

        // Após a transição, esconde os elementos
        setTimeout(() => {
            divencerrado.style.display = "none";
            divtrasparente.style.display = "none";
        }, 400); // 400ms deve ser igual ao tempo do transition no CSS
    }
};

function NaoPausarMacro() {
    const botaoencerrar = document.getElementById('pausar');
    const divencerrado = document.getElementById('Divpausar');
    const divtrasparente = document.getElementById('transps');

    if (botaoencerrar && divencerrado && divtrasparente) {
        // Inicia a animação de saída
        divencerrado.classList.remove("active");
        divtrasparente.classList.remove("active");

        // Após a transição, esconde os elementos
        setTimeout(() => {
            divencerrado.style.display = "none";
            divtrasparente.style.display = "none";
        }, 400); // 400ms deve ser igual ao tempo do transition no CSS
    }
};

function efetuarPausaMacro() {
    console.log('efetuarPausaMacro chamada');
    const divPausar = document.getElementById('Divpausar');
    const botaoPausar = document.getElementById('pausar');
    const statusSpan = document.querySelector('.ml7 .letters');
    const spinner = document.querySelector('.spinner');
    const divTransps = document.getElementById('transps');

    if (divPausar && botaoPausar) {
        // Se já está em modo "Continuar", volta para Executando/azul
        if (botaoPausar.innerText === "Continuar") {
            // Chama o backend para CONTINUAR a macro
            // Chama o backend para CONTINUAR a macro
            if (typeof eel !== 'undefined' && eel.continuar_macro_consulta_geral) {
                eel.continuar_macro_consulta_geral()().then(result => {
                    if (result.status === 'ok') {
                        // NÃO mostra a div de pausa, só faz as trocas visuais
                        divPausar.style.display = "none";
                        if (divTransps) divTransps.style.display = "none";

                        botaoPausar.innerText = "Pausar";
                        botaoPausar.style.backgroundColor = "#056ef8"; // Azul padrão

                        // Volta o status para "Executando" e azul
                        if (statusSpan) {
                            statusSpan.innerHTML = "Executando".replace(/\S/g, "<span class='letter'>$&</span>");
                            statusSpan.style.color = "#056ef8";
                            anime.remove('.ml7 .letter');
                            anime.timeline({ loop: true })
                                .add({
                                    targets: '.ml7 .letter',
                                    translateY: ["1.1em", 0],
                                    translateX: ["0.55em", 0],
                                    translateZ: 0,
                                    rotateZ: [180, 0],
                                    duration: 750,
                                    easing: "easeOutExpo",
                                    delay: (el, i) => 50 * i
                                });
                        }

                        // Volta a spinner para azul
                        if (spinner) {
                            const rects = spinner.querySelectorAll('div');
                            rects.forEach(rect => {
                                rect.style.backgroundColor = "#056ef8";
                            });
                        }
                    }
                });
            }
            return; // Sai da função, não executa o resto
        }        // --- Código de pausa (apenas quando está em modo "Pausar") ---
        if (typeof eel !== 'undefined' && eel.pausar_macro_consulta_geral) {
            // Chama o backend para PAUSAR a macro
            eel.pausar_macro_consulta_geral()().then(result => {
                if (result.status === 'ok') {
                    divPausar.classList.remove("active");
                    setTimeout(() => {
                        divPausar.style.display = "none";
                        if (divTransps) divTransps.style.display = "none";
                    }, 400);

                    botaoPausar.innerText = "Continuar";
                    botaoPausar.style.backgroundColor = "#f8aa00"; // Amarelo

                    if (statusSpan) {
                        statusSpan.innerHTML = "Pausado".replace(/\S/g, "<span class='letter'>$&</span>");
                        statusSpan.style.color = "#f8aa00";
                        anime.remove('.ml7 .letter');
                        anime.timeline({ loop: true })
                            .add({
                                targets: '.ml7 .letter',
                                translateY: ["1.1em", 0],
                                translateX: ["0.55em", 0],
                                translateZ: 0,
                                rotateZ: [180, 0],
                                duration: 750,
                                easing: "easeOutExpo",
                                delay: (el, i) => 50 * i
                            });
                    }

                    if (spinner) {
                        const rects = spinner.querySelectorAll('div');
                        rects.forEach(rect => {
                            rect.style.backgroundColor = "#f8aa00";
                        });
                    }
                }
            });
        }
    }
}

function pausarMacro() {
    const botaoPausar = document.getElementById('pausar');
    const divPausar = document.getElementById('Divpausar');
    const divTransps = document.getElementById('transps');

    // Só mostra a div de pausa se o botão estiver como "Pausar"
    if (botaoPausar && botaoPausar.innerText === "Pausar") {
        if (divPausar && divTransps) {
            divPausar.style.display = "block";
            divTransps.style.display = "block";
            void divPausar.offsetWidth;
            divPausar.classList.add("active");
            divTransps.classList.add("active");
        }
    } else {
        // Se estiver como "Continuar", só faz as trocas visuais
        efetuarPausaMacro();
    }
}

function mostrarEncerramentoFinal() {
    console.log("mostrarEncerramentoFinal: Iniciando encerramento da macro...");
    
    // Verifica se eel está disponível
    if (typeof eel !== 'undefined' && eel.encerrar_threads) {
        console.log("mostrarEncerramentoFinal: Chamando eel.encerrar_threads()...");
        
        eel.encerrar_threads()().then(response => {
            console.log("mostrarEncerramentoFinal: Resposta recebida do Python:", response);
            
            if (response && response.status === "erro") {
                console.error("mostrarEncerramentoFinal: Erro retornado pelo Python:", response.message);
                alert("Erro ao encerrar a macro: " + response.message);
            } else {
                console.log("mostrarEncerramentoFinal: Encerramento bem-sucedido, iniciando animação...");
                executarAnimacaoEncerramentoFinal();
            }
        }).catch(error => {
            console.error("mostrarEncerramentoFinal: Erro ao chamar encerrar_threads:", error);
            alert("Erro ao tentar encerrar a macro. Verifique o console para mais detalhes.");
        });
    } else {
        console.error("mostrarEncerramentoFinal: eel.encerrar_threads não está disponível!");
        alert("Erro: Conexão com o backend Python não está disponível.");
    }
}

// Função auxiliar para executar a animação após o encerramento
function executarAnimacaoEncerramentoFinal() {
    console.log("executarAnimacaoEncerramentoFinal: Iniciando animação de encerramento...");
    
    const divencerrado = document.getElementById('Divencerrar');
    const divfinal = document.getElementById('DivencerrarFinal');
    const divtrasparente = document.getElementById('transps');
    
    if (divencerrado && divfinal && divtrasparente) {
        console.log("executarAnimacaoEncerramentoFinal: Todos os elementos encontrados, executando animações...");
        
        // Oculta a div de confirmação com animação
        divencerrado.classList.remove("active");
        setTimeout(() => {
            divencerrado.style.display = "none";
            console.log("executarAnimacaoEncerramentoFinal: Div de confirmação ocultada");
        }, 400);

        // Mostra a div final com animação
        divfinal.style.display = "block";
        void divfinal.offsetWidth; // Força reflow
        divfinal.classList.add("active");
        console.log("executarAnimacaoEncerramentoFinal: Div final mostrada");

        // Mantém o fundo escuro
        divtrasparente.style.display = "block";
        divtrasparente.classList.add("active");
        console.log("executarAnimacaoEncerramentoFinal: Fundo escuro mantido");
    } else {
        console.error("executarAnimacaoEncerramentoFinal: Um ou mais elementos não encontrados:", {
            divencerrado: !!divencerrado,
            divfinal: !!divfinal,
            divtrasparente: !!divtrasparente
        });
    }
}

function fecharEncerramentoFinal() {
    const divfinal = document.getElementById('DivencerrarFinal');
    const divtrasparente = document.getElementById('transps');

    if (divfinal && divtrasparente) {
        // Inicia a animação de saída
        divfinal.classList.remove("active");
        divtrasparente.classList.remove("active");

        // Após a transição, esconde os elementos
        setTimeout(() => {
            divfinal.style.display = "none";
            divtrasparente.style.display = "none";
        }, 400); // 400ms igual ao transition do CSS
    }
};

eel.expose(update_progress);
function update_progress(data) {
    console.log("Dados recebidos do Python:", data); // Para depuração

    // Elementos HTML que você deseja atualizar
    const osProcessando = document.getElementById('os-processando');
    const quantidade = document.getElementById('quantidade');
    const totalCount = document.getElementById('total-count');
    const oserros = document.getElementById('oserros');
    const tempoEstimado = document.getElementById('tempoestimado');
    const porcentagemConcluida = document.getElementById('porcentagem-concluida');
    const divencerrarfinal = document.getElementById('DivencerrarFinal');
    

    // Atualiza "Processando OS"
    // Espera-se que 'data.os_processando' contenha o identificador do item atual
    if (osProcessando && data.os_processando !== undefined) {
        osProcessando.innerText = data.os_processando;
    }

    // Atualiza "OS Processadas" (quantidade)
    // Espera-se que 'data.quantidade' contenha o número de itens processados
    if (quantidade && data.quantidade !== undefined) {
        quantidade.innerText = data.quantidade;
    }

    // Atualiza o total de OS a serem processadas (total-count)
    // Espera-se que 'data.total_count' contenha o número total de itens
    if (totalCount && data.total_count !== undefined) {
        totalCount.innerText = ` de ${data.total_count}`; // Ex: "150 de 300"
    } else if (totalCount) {
        totalCount.innerText = ""; // Limpa se não houver contagem total
    }

    // Atualiza "OS com Erros"
    // Espera-se que 'data.oserros' contenha o número de erros
    if (oserros && data.oserros !== undefined) {
        oserros.innerText = data.oserros;
    }

    // Atualiza "Tempo Estimado"
    // Espera-se que 'data.tempoestimado' contenha a estimativa de tempo
    if (tempoEstimado && data.tempoestimado !== undefined) {
        tempoEstimado.innerText = data.tempoestimado;
    }

    // Atualiza "Porcentagem Concluída"
    // Espera-se que 'data.porcentagem_concluida' contenha a porcentagem
    if (porcentagemConcluida && data.porcentagem_concluida !== undefined) {
        porcentagemConcluida.innerText = data.porcentagem_concluida;
    }

    // Lógica para lidar com a finalização do processo
    if (data.finalizado) {
        // Esconde status de processamento
        document.getElementById('macrosite-processing-status').style.display = 'none';
        
        // Garante que as divs de confirmação de encerramento/pausa manual e o overlay
        // sejam escondidos quando a macro finaliza, caso estivessem visíveis.
        const divEncerrar = document.getElementById('Divencerrar');
        const divPausar = document.getElementById('Divpausar');
        const divTransps = document.getElementById('transps');

        if (divEncerrar) divEncerrar.style.display = 'none';
        if (divPausar) divPausar.style.display = 'none';
        if (divTransps) divTransps.style.display = 'none';

        // Mostra status de conclusão (o resumo detalhado com tempos, contagens, etc.)
        document.getElementById('macrosite-completion-status').style.display = 'block';


        // Atualiza os campos finais
        if (data.start_datetime) document.getElementById('start-datetime').innerText = data.start_datetime;
        if (data.end_datetime) document.getElementById('end-datetime').innerText = data.end_datetime;
        if (data.processed_count !== undefined) document.getElementById('processed-count').innerText = data.processed_count;
        if (data.error_count !== undefined) document.getElementById('error-count').innerText = data.error_count;
        if (data.total_time) document.getElementById('total-time').innerText = data.total_time;

        // REMOVIDO: mostrarEncerramentoFinal();
        // A DivencerrarFinal (mensagem "Macro encerrada com sucesso") só deve aparecer
        // no fluxo de encerramento MANUAL do usuário (quando ele clica "Sim" na Divencerrar),
        // e não quando a macro termina naturalmente seu processamento.
    }

    // Lógica para lidar com erros críticos do processo
    if (data.error) {
        alert("Erro no processo: " + data.error);
    }
}

function showSuggestionForm() {
    document.getElementById('suggestion-form').style.display = 'block';
    document.getElementById('suggestion-message').textContent = ''; // Clear previous messages
    document.getElementById('user-suggestion').value = ''; // Clear textarea
}

// Function to hide the suggestion form
function hideSuggestionForm() {
    document.getElementById('suggestion-form').style.display = 'none';
}

// Function to handle submitting the suggestion
async function submitSuggestion() {
    const suggestionText = document.getElementById('user-suggestion').value.trim();
    const suggestionMessage = document.getElementById('suggestion-message');

    if (suggestionText === '') {
        suggestionMessage.style.color = 'red';
        suggestionMessage.textContent = 'Por favor, digite sua sugestão antes de enviar.';
        return;
    }

    suggestionMessage.style.color = '#007bff';
    suggestionMessage.textContent = 'Enviando sugestão...';

    try {
        // Here you would call your eel backend function to handle the suggestion
        // For example:
        // await eel.send_suggestion_to_backend(suggestionText)();

        // Simulate a successful send (remove in real implementation)
        await new Promise(resolve => setTimeout(resolve, 1500));

        suggestionMessage.style.color = 'green';
        suggestionMessage.textContent = 'Obrigado! Sua sugestão foi enviada com sucesso.';
        document.getElementById('user-suggestion').value = ''; // Clear the textarea

        // Optionally, hide the form after a short delay
        setTimeout(() => {
            hideSuggestionForm();
        }, 3000);

    } catch (error) {
        console.error("Erro ao enviar sugestão:", error);
        suggestionMessage.style.color = 'red';
        suggestionMessage.textContent = 'Erro ao enviar sua sugestão. Tente novamente.';
    }
}

function startNewMacro() {
    const divprocessamento = document.getElementById("macrosite-completion-status")
    const divcomecar = document.getElementById("macrosite-form")
    const divpreview = document.getElementById("site-preview")
    const loginneta = document.getElementById("neta-login");
    const senhaneta = document.getElementById("neta-password");
    const tipoaquivocsvexcel = document.getElementById("csvOption");
    const tipoaquivohidropde = document.getElementById("pdeOption");
    const selecionaraquivo = document.getElementById("arquivo-csv");

    if(divprocessamento && divcomecar && divpreview && loginneta && senhaneta && tipoaquivocsvexcel && tipoaquivohidropde && selecionaraquivo) {
        divprocessamento.style.display = "none";
        divcomecar.style.display = "block";
        divpreview.style.display = "block";
        loginneta.value = '';
        senhaneta.value = '';
        tipoaquivocsvexcel.checked = true; // Reseta para CSV
        tipoaquivohidropde.checked = true;
        selecionaraquivo.value = ''; // Limpa o nome do arquivo selecionado
    }
}

async function viewResultsFolder() {
    console.log("Solicitando abertura da pasta de resultados...");
    try {
        const result = await eel.open_results_folder()(); // Chama a função Python exposta
        
        if (result) { // Verifica se houve um retorno
            if (result.status === "success") {
                console.log("Comando para abrir pasta enviado com sucesso:", result.message);
                // Normalmente, nenhuma mensagem é necessária para o usuário aqui,
                // pois o explorador de arquivos deve abrir.
            } else {
                console.error("Erro retornado pelo Python ao tentar abrir pasta:", result.message);
                // Você pode exibir uma mensagem de erro para o usuário se desejar
                const errorDiv = document.getElementById('macrosite-error-message'); // Supondo que você tenha um div para erros
                if (errorDiv) {
                    errorDiv.textContent = "Não foi possível abrir a pasta de resultados: " + result.message;
                    errorDiv.style.display = 'block';
                    setTimeout(() => { errorDiv.style.display = 'none'; }, 7000); // Esconde após 7 segundos
                } else {
                    alert("Erro ao abrir pasta de resultados: " + result.message);
                }
            }
        } else {
            console.warn("Nenhum resultado retornado pela chamada eel.open_results_folder(). Verifique o backend.");
            // alert("Não foi possível confirmar a ação de abrir a pasta. Verifique o console do backend.");
        }
    } catch (error) {
        console.error("Erro ao tentar chamar eel.open_results_folder():", error);
        // Exibe um erro genérico
        const errorDiv = document.getElementById('macrosite-error-message');
        if (errorDiv) {
            errorDiv.textContent = "Erro de comunicação ao tentar abrir a pasta de resultados.";
            errorDiv.style.display = 'block';
            setTimeout(() => { errorDiv.style.display = 'none'; }, 7000);
        } else {
            alert("Ocorreu um erro ao tentar abrir a pasta de resultados. Verifique o console para mais detalhes.");
        }
    }
}

async function preencherCampos_NETA() {
    const usuarioId = sessionStorage.getItem('user_id');
    if (!usuarioId) return;
    try {
        // Corrigido: chama o endpoint correto para NETA
        const res = await eel.get_neta_vinculo_by_user_id(usuarioId)();
        const loginInput = document.getElementById('neta-login');
        const senhaInput = document.getElementById('neta-password'); // Corrigido o id para 'neta-senha'
        if (res && res.status === 'success' && res.neta_login && res.neta_senha) {
            // Preenche login e senha reais e desabilita os campos
            if (loginInput) {
                loginInput.value = res.neta_login || '';
                loginInput.readOnly = true;
                loginInput.parentElement.style.display = 'block';
                loginInput.style.backgroundColor = 'rgb(230, 228, 228)';
                loginInput.style.cursor = 'not-allowed'; // Opcional: muda o cursor para indicar que o campo é somente leitura
            }
            if (senhaInput) {
                senhaInput.value = res.neta_senha || '';
                senhaInput.readOnly = true;
                senhaInput.parentElement.style.display = 'block';
                senhaInput.style.backgroundColor = 'rgb(230, 228, 228)';
                senhaInput.style.cursor = 'not-allowed'; // Opcional: muda o cursor para indicar que o campo é somente leitura
            }
        } else {
            // Se não houver vínculo, limpa e habilita os campos
            if (loginInput) {
                loginInput.value = '';
                loginInput.readOnly = false;
                loginInput.parentElement.style.display = 'block';
            }
            if (senhaInput) {
                senhaInput.value = '';
                senhaInput.readOnly = false;
                senhaInput.parentElement.style.display = 'block';
            }
        }
    } catch (e) {
        // opcional: mostrar erro
        console.error('Erro ao preencher campos NETA:', e);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    preencherCampos_NETA();
    // ...outros códigos do DOMContentLoaded...
});
