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

    preencherCamposWFM_SITE();

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
        if (statusOSAtual) statusOSAtual.textContent = "- Calculando..";
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
        // Atualiza apenas o número da OS processando
        if (statusOSAtual) {
            statusOSAtual.textContent = os_number;
        }

        // Atualiza apenas a quantidade processada e o total
        if (statusContadorOS) {
            statusContadorOS.textContent = `${processed_count} de ${total_count}`;
        }

        // Calcula e atualiza a barra de progresso e a porcentagem
        if (total_count > 0) // Evita divisão por zero
        {
            const progress = (processed_count / total_count) * 100;
            if (progressBar) {
                progressBar.style.width = `${progress}%`;
                progressBar.setAttribute('aria-valuenow', progress);
            }
            // Atualiza apenas a porcentagem concluída no elemento com ID 'porcentagem-concluida'
            const porcentagemConcluidaElement = document.getElementById('porcentagem-concluida');
            if (porcentagemConcluidaElement) {
                porcentagemConcluidaElement.textContent = `${progress.toFixed(0)}%`;
            }
        } else {
             // Lida com o caso de total_count ser 0 (arquivo vazio, por exemplo)
             if (progressBar) {
                progressBar.style.width = '0%';
                progressBar.setAttribute('aria-valuenow', 0);
             }
             const porcentagemConcluidaElement = document.getElementById('porcentagem-concluida');
             if (porcentagemConcluidaElement) {
                 porcentagemConcluidaElement.textContent = '0%';
             }
        }
    }

    eel.expose(atualizar_tempo_restante_js);
    function atualizar_tempo_restante_js(time_remaining_formatted) {
        // Atualiza apenas o tempo estimado restante
        if (statusTempoRestante) {
            statusTempoRestante.textContent = time_remaining_formatted;
        }
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
                console.warn("Identificador não fornecido. Certifique-se de que o campo está preenchido no frontend.");
            } else if (!identificadorInput) {
                console.warn("Identificador input não encontrado no HTML. O valor será enviado como vazio.");
            }

            if (missingFields.length > 0) {
                display_macro_error_frontend("Por favor, preencha todos os campos e selecione um arquivo.");
                return; // Interrompe aqui se a validação falhar, sem alterar as divs.
            }

            // Se a validação passou, então alteramos a visibilidade das divs
            if (sitePreviewDiv) sitePreviewDiv.style.display = 'none';
            if (formContainerDiv) formContainerDiv.style.display = 'none';
            if (statusProcessamentoDiv) statusProcessamentoDiv.style.display = 'block';

            // A validação do arquivo já foi feita, mas uma checagem extra não prejudica.
            // No entanto, a lógica principal de validação está acima.
            // Esta parte pode ser redundante se a validação de 'arquivo' em missingFields for suficiente.
            if (!arquivo) { 
                // Este bloco teoricamente não deveria ser alcançado se a validação acima estiver correta.
                alert('Por favor, selecione um arquivo antes de iniciar o processamento.');
                // Reverter a visibilidade caso algo muito inesperado aconteça e chegue aqui
                if (sitePreviewDiv) sitePreviewDiv.style.display = 'block';
                if (formContainerDiv) formContainerDiv.style.display = 'block';
                if (statusProcessamentoDiv) statusProcessamentoDiv.style.display = 'none';
                return;
            }

            // Ler o arquivo como base64
            const reader = new FileReader();
            reader.onload = async (event) => {
                const conteudoBase64 = event.target.result.split(',')[1]; // Remove o prefixo data:...

                try {
                    // Chamar a função do backend via Eel
                    const resultado = await eel.iniciar_macro_eel(
                        conteudoBase64,
                        login,
                        senha,
                        arquivo.name,
                        document.querySelector('input[name="arquivoTipo"]:checked').value,
                        identificador
                    )();

                    if (resultado.status === 'sucesso') {
                        alert('Macro iniciada com sucesso!');
                    } else {
                        alert(`Erro ao iniciar a macro: ${resultado.message}`);
                    }
                } catch (error) {
                    console.error('Erro ao chamar a macro no backend:', error);
                    alert('Erro ao iniciar a macro. Verifique os logs para mais detalhes.');
                }
            };

            reader.readAsDataURL(arquivo);
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

    // Listeners para botões de Encerrar (se você tiver esses botões no seu HTML)
    const encerrarBotao = document.getElementById('encerrar');

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

// FUNCTION CHAMAR DUVIDA


function chamarDuvida() {
    const lampadaIcon = document.getElementById('iconeduvida');
    const divDuvida = document.getElementById('duvida-site'); // O ID já está correto aqui

    // É uma boa prática verificar se os elementos foram encontrados antes de tentar usá-los
    if (lampadaIcon && divDuvida) {

        if (divDuvida.style.display === 'none' || divDuvida.style.display === '') {
            // O estado atual é "Azul / Apagado / Oculto". Vamos mudar para "Laranja / Aceso / Visível".
            console.log("Estado atual: Oculto. Mudando para: Visível (ícone Laranja).");

            // 1. Mostra a div de dúvida
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
        // Loga um erro no console se algum dos elementos não for encontrado no HTML
        if (!lampadaIcon) console.error("Elemento com ID 'iconeduvida' (ícone da lâmpada) não encontrado no DOM. Verifique seu HTML.");
        if (!divDuvida) console.error("Elemento com ID 'duvida-site' (div de dúvida) não encontrado no DOM. Verifique seu HTML.");
    }

}

// TRANSIÇÃO DE INICIAR A PAGINA 

document.addEventListener('DOMContentLoaded', (event) => {
    console.log('DOMContentLoaded disparado. Chamando iniciarTransicaoPagina.');
    // Chama a função que inicia a transição da página
    iniciarTransicaoPagina();

    // Se você tiver outras inicializações que precisam do DOM pronto
    // mas NÃO precisam esperar pela transição ou pelo setTimeout dentro de iniciarTransicaoPagina,
    // você pode colocá-las aqui fora do setTimeout da transição.

    console.log('DOMContentLoaded finalizado.');
});

function iniciarTransicaoPagina() {
    console.log("[macros.js] Chamada a iniciarTransicaoPagina.");
    const bodyElement = document.body;
    if (bodyElement) {
        bodyElement.style.display = 'block';
        setTimeout(() => {
            bodyElement.classList.add('is-visible');
            console.log("[macros.js] Transição de entrada iniciada para o body.");
            // Carrossel removido: não chama calculateCarouselMetrics nem updateCarouselDisplay
        }, 5);
    } else {
        console.error("[macros.js] Elemento body não encontrado.");
    }
}

window.onload = async function () {
    console.log("[macrosite.js] window.onload iniciado (apenas timer).");

    // --- Lógica do timer logado (lendo do sessionStorage) ---
    let sessionStartTime = sessionStorage.getItem('sessionStartTime');
    console.log(`Timer: Tentando obter sessionStartTime do sessionStorage. Valor: ${sessionStartTime}`);

    if (sessionStartTime) {
        sessionStartTime = parseInt(sessionStartTime, 10);
        if (!isNaN(sessionStartTime)) {
            console.log("Timer: sessionStartTime válido obtido do sessionStorage.");
             if (typeof updateLoggedInTime === 'function') {
                updateLoggedInTime(sessionStartTime);
                setInterval(() => {
                    updateLoggedInTime(sessionStartTime);
                }, 1000);
                 console.log("Timer: Timer iniciado usando sessionStorage.");
             } else {
                 console.error("Timer: Função updateLoggedInTime não definida neste escopo.");
                  const loggedInTimeSpan = document.getElementById('logged-in-time');
                  if (loggedInTimeSpan) {
                     loggedInTimeSpan.innerText = "Erro JS (timer)";
                 }
            }
        } else {
            console.error("Timer: Valor inválido para sessionStartTime no sessionStorage. Limpando...");
             const loggedInTimeSpan = document.getElementById('logged-in-time');
             if (loggedInTimeSpan) {
                loggedInTimeSpan.innerText = "Erro no timer (storage)";
             }
             sessionStorage.removeItem('sessionStartTime');
        }
    } else {
        // Como esta é macroSITE, a URL geralmente não virá direto do login com login_time.
        // Mas para robustez, podemos dar uma olhada rápida na URL como fallback.
        // No entanto, o foco é o sessionStorage.
        const urlParams = new URLSearchParams(window.location.search);
        const loginTimeParam = urlParams.get('login_time');
         console.log(`Timer: sessionStartTime não encontrado no sessionStorage. Checando URL (improvável). Valor: ${loginTimeParam}`);

        if (loginTimeParam) {
             sessionStartTime = parseInt(loginTimeParam, 10);
             if (!isNaN(sessionStartTime)) {
                  console.log("Timer: sessionStartTime válido obtido da URL (fallback).");
                 sessionStorage.setItem('sessionStartTime', sessionStartTime); // Salva para futuras navegações
                 console.log("Timer: sessionStartTime salvo em sessionStorage a partir da URL.");
                  if (typeof updateLoggedInTime === 'function') {
                     updateLoggedInTime(sessionStartTime);
                     setInterval(() => {
                         updateLoggedInTime(sessionStartTime);
                     }, 1000);
                      console.log("Timer: Timer iniciado usando URL (fallback).");
                  } else {
                      console.error("Timer: Função updateLoggedInTime não definida neste escopo (URL fallback).");
                       const loggedInTimeSpan = document.getElementById('logged-in-time');
                       if (loggedInTimeSpan) {
                          loggedInTimeSpan.innerText = "Erro JS (timer URL)";
                       }
                  }
             } else {
                 console.error("Timer: Parâmetro 'login_time' inválido na URL (fallback).");
                 const loggedInTimeSpan = document.getElementById('logged-in-time');
                  if (loggedInTimeSpan) {
                     loggedInTimeSpan.innerText = "Erro no timer (URL fallback)";
                  }
             }
        } else {
            console.warn("Timer: Parâmetro 'login_time' não encontrado em URL nem sessionStorage. O timer não iniciará.");
            const loggedInTimeSpan = document.getElementById('logged-in-time');
            if (loggedInTimeSpan) {
                loggedInTimeSpan.innerText = "Não iniciado";
            }
            // Opcional: Redirecionar para login se o timer é crucial e não foi encontrado
            // window.location.href = 'login.html';
        }
    }
    // --- Fim da lógica do timer logado ---

    console.log("[macrosite.js] window.onload finalizado (apenas timer).");
};


// ATUALIZAÇÃO DE HORARIO LOGADO

function formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    // Usa padStart para adicionar um zero à esquerda se o número for menor que 10
    const paddedHours = String(hours).padStart(2, '0');
    const paddedMinutes = String(minutes).padStart(2, '0');
    const paddedSeconds = String(seconds).padStart(2, '0');

    return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
};


// Função para atualizar o span com o tempo logado
function updateLoggedInTime(sessionStartTime) {
    const loggedInTimeSpan = document.getElementById('logged-in-time');
    if (!loggedInTimeSpan) {
        console.error("Elemento com ID 'logged-in-time' não encontrado.");
        return; // Sai da função se o elemento não existir
    }

    // Calcula o tempo decorrido em milissegundos
    const now = Date.now();
    const elapsedMilliseconds = now - sessionStartTime;

    // Calcula o tempo decorrido em segundos (arredondado para baixo)
    const elapsedSeconds = Math.floor(elapsedMilliseconds / 1000);

    // Formata o tempo e atualiza o span
    loggedInTimeSpan.innerText = formatTime(elapsedSeconds);
};


document.addEventListener('DOMContentLoaded', (event) => {
    console.log("[macrosite.js] DOMContentLoaded iniciado.");

    // Código da animação anime.js movido para dentro do DOMContentLoaded
    var textWrapper = document.querySelector('.ml7 .letters');
    

    // Verifica se o elemento foi encontrado antes de tentar manipular
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

    console.log("[macrosite.js] DOMContentLoaded finalizado.");
});

async function preencherCamposWFM_SITE() {
    const usuarioId = sessionStorage.getItem('user_id');
    if (!usuarioId) return;
    try {
        const res = await eel.get_wfm_vinculo_by_user_id(usuarioId)();
        const loginInput = document.getElementById('site-login');
        const senhaInput = document.getElementById('site-password');
        if (res && res.status === 'success' && res.wfm_login && res.wfm_senha) {
            // Preenche login e senha reais e desabilita os campos
            if (loginInput) {
                loginInput.value = res.wfm_login || '';
                loginInput.readOnly = true;
                loginInput.parentElement.style.display = 'block';
                loginInput.style.backgroundColor = 'rgb(230, 228, 228)';
                loginInput.style.cursor = 'not-allowed'; // Opcional: muda o cursor para indicar que o campo é somente leitura
            }
            if (senhaInput) {
                senhaInput.value = res.wfm_senha || '';
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
        console.error('Erro ao preencher campos WFM SITE:', e);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    preencherCamposWFM_SITE();
    // ...outros códigos do DOMContentLoaded...
});
