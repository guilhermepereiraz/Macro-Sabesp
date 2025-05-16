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

    // Código da animação anime.js
    var textWrapper = document.querySelector('.ml7 .letters');
    if (textWrapper) {
        textWrapper.innerHTML = textWrapper.textContent.replace(/\S/g, "<span class='letter'>$&</span>");
        anime.timeline({loop: true})
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
    const loginInput = document.getElementById('site-login');
    const senhaInput = document.getElementById('site-password');
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
        if ( !currentTimeElement) {
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
        if (inputArquivo && csvOption && excelOption) {
            if (csvOption.checked) {
                inputArquivo.accept = '.csv';
            } else if (excelOption.checked) {
                inputArquivo.accept = '.xlsx,.xls';
            } else {
                inputArquivo.accept = '';
            }
        }
    }
    // Adicionando listeners APÓS a declaração dos elementos e da função
    if (csvOption) csvOption.addEventListener('change', atualizarFiltroArquivo);
    if (excelOption) excelOption.addEventListener('change', atualizarFiltroArquivo);
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

            if (arquivoInputFile.files && arquivoInputFile.files[0]) {
                var reader = new FileReader();
                reader.onload = function(event) {
                    var conteudoBase64 = event.target.result.split(',')[1];
                    if (typeof eel !== 'undefined') {
                         eel.iniciar_macro_consulta_geral_frontend(
                            conteudoBase64,
                            login,
                            senha,
                            nomeArquivo,
                            tipoArquivo,
                            tipoPesquisa
                        );
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


}; // Fim de window.onload


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
}

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
}

function stopTipCycle() {
    // Para o intervalo de dicas
    if (tipIntervalId) {
        clearInterval(tipIntervalId);
        tipIntervalId = null;
        console.log("Ciclo de dicas parado.");
    }
}

// >>> FIM CÓDIGO PARA DICAS COM FADE (FUNÇÕES E VARIÁVEIS NO FINAL) <<<


// --- PONTOS ONDE stopTipCycle DEVE SER CHAMADO ---
// Você precisará chamar stopTipCycle() quando o processamento terminar (sucesso ou erro)
// ou quando o usuário clicar nos botões 'Encerrar' ou 'Pausar' (se Pausar interromper o ciclo das dicas).

// Exemplo: Se você tiver uma função que o backend Eel chama ao finalizar o processamento:
/*
eel.expose(function onProcessingComplete(status, message) {
    // Lógica para exibir a mensagem de conclusão na UI
    // ...

    stopTipCycle(); // <--- CHAMADA PARA PARAR O CICLO DE DICAS AQUI

    // Lógica para mostrar o resumo na div de conclusão
    // ...
});
*/

// Exemplo: Se você tiver um listener de evento para o botão 'Encerrar':
/*
// Obtenha a referência do botão encerrar no window.onload
const encerrarBotao = document.getElementById('encerrar');
if (encerrarBotao) {
    encerrarBotao.addEventListener('click', function() {
        console.log("Botão Encerrar clicado.");
        // Lógica para enviar sinal de encerramento ao backend via Eel
        // if (typeof eel !== 'undefined') {
        //     eel.cancel_processing();
        // }

        stopTipCycle(); // <--- CHAMADA PARA PARAR O CICLO DE DICAS AQUI

        // Lógica para atualizar a UI para o estado de encerramento
        // ... (ocultar status, mostrar resumo de encerramento, etc.) ...
    });
}
*/

// Exemplo: Se você tiver um listener de evento para o botão 'Pausar':
/*
// Obtenha a referência do botão pausar no window.onload
const pausarBotao = document.getElementById('pausar');
if (pausarBotao) {
    pausarBotao.addEventListener('click', function() {
        console.log("Botão Pausar clicado.");
        // Lógica para enviar sinal de pausa ao backend via Eel
        // if (typeof eel !== 'undefined') {
        //    eel.pause_processing();
        // }

        // Decida se as dicas continuam rodando ao pausar.
        // Se não continuarem, chame stopTipCycle() aqui.
        // stopTipCycle(); // <--- CHAMADA PARA PARAR O CICLO DE DICAS AQUI (SE QUISER PARAR NA PAUSA)

        // Lógica para atualizar a UI para o estado de pausa (mudar texto, aparência do botão, etc.)
        // ...
    });
}
*/