function iniciarTransicaoPagina() {
    console.log("[index.js] Chamada a iniciarTransicaoPagina.");
    const bodyElement = document.body;
    if (bodyElement) {
        bodyElement.style.display = 'block';
        setTimeout(() => {
            bodyElement.classList.add('is-visible');
            console.log("[index.js] Transição de entrada iniciada para o body.");
        }, 5); // Pequeno atraso após display:block
    } else {
        console.error("[index.js] Elemento body não encontrado.");
    }
}

document.addEventListener('DOMContentLoaded', (event) => {
    console.log('DOMContentLoaded disparado. Chamando iniciarTransicaoPagina.');
    iniciarTransicaoPagina();
    console.log('DOMContentLoaded finalizado.');
});

function chamarDuvida() {
    const lampadaIcon = document.getElementById('iconeduvida');
    const divDuvida = document.getElementById('duvida-vectora');

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

async function preencherCamposVectora() {
    const usuarioId = sessionStorage.getItem('user_id');
    if (!usuarioId) return;
    try {
        const res = await eel.get_vectora_vinculo_by_user_id(usuarioId)();
        const loginInput = document.getElementById('vectora-login');
        const senhaInput = document.getElementById('vectora-password');
        const costumerInput = document.getElementById('vectora-costumer');
        if (res && res.status === 'success' && res.vectora_login && res.vectora_senha && res.vectora_costumer) {
            // Preenche login e senha reais e desabilita os campos
            if (costumerInput) {
                costumerInput.value = res.vectora_costumer || '';
                costumerInput.readOnly = true;
                costumerInput.parentElement.style.display = 'none';
                costumerInput.style.backgroundColor = 'rgb(230, 228, 228)';
                costumerInput.style.cursor = 'not-allowed'; // Opcional: muda o cursor para indicar que o campo é somente leitura
            }
            if (loginInput) {
                loginInput.value = res.vectora_login || '';
                loginInput.readOnly = true;
                loginInput.parentElement.style.display = 'none';
                loginInput.style.backgroundColor = 'rgb(230, 228, 228)';
                loginInput.style.cursor = 'not-allowed'; // Opcional: muda o cursor para indicar que o campo é somente leitura
            }
            if (senhaInput) {
                senhaInput.value = res.vectora_senha || '';
                senhaInput.readOnly = true;
                senhaInput.parentElement.style.display = 'none';
                senhaInput.style.backgroundColor = 'rgb(230, 228, 228)';
                senhaInput.style.cursor = 'not-allowed'; // Opcional: muda o cursor para indicar que o campo é somente leitura
            }
        } else {
            // Se não houver vínculo, limpa e habilita os campos
            if (costumerInput) {
                costumerInput.value = '';
                costumerInput.readOnly = false;
                costumerInput.parentElement.style.display = 'block';
            }
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
        console.error('Erro ao preencher campos Vectora:', e);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    preencherCamposVectora();
    startTipCycle();
    atualizarHorarioAtual();
    // ...outros códigos do DOMContentLoaded...
});

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
    "Verifique se a coluna 'INSTALAÇÃO' está correta no seu arquivo.",
    "Em caso de lentidão reinicie, encerre e começe um novo processo.", // Dica nova
    "O processo pode levar um tempo, dependendo do volume de dados.",
    "Em caso de muitos erros, revise os dados de entrada e as credenciais do VECTORA.",
    "O relatório final será gerado automaticamente na sua Área de Trabalho.",
    "Certifique-se de que sua conexão com a internet está estável.",
    "Não feche o programa enquanto o robô estiver trabalhando.",
    "Certifique-se de que o VECTORA está instavel para fazer a busca.",
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


function processarDeliberacao() {
    const botaoinciairmacro = document.getElementById('processar');
    const dicas = document.getElementById('iconeduvida');
    const previewvectora = document.getElementById('site-preview');
    const abalogin = document.getElementById('macrosite-form');
    const abaexecutar = document.getElementById('macrosite-processing-status');
    const costumer = document.getElementById('vectora-costumer');
    const login = document.getElementById('vectora-login');
    const senha = document.getElementById('vectora-password');
    const msgerro = document.getElementById('macrosite-error-message');
    const fileInput = document.getElementById('arquivo-csv');
    const file = fileInput.files[0];

    // Sempre esconde a mensagem de erro ao tentar processar novamente
    msgerro.style.display = 'none';
    msgerro.textContent = '';

    if (!costumer || costumer.value.trim() === '') {
        msgerro.textContent = 'Por favor, preencha o campo CLIENTE antes de iniciar a macro.';
        msgerro.style.display = 'block';
        return;
    }
    if (!login || login.value.trim() === '') {
        msgerro.textContent = 'Por favor, preencha o campo LOGIN antes de iniciar a macro.';
        msgerro.style.display = 'block';
        return;
    }
    if (!senha || senha.value.trim() === '') {
        msgerro.textContent = 'Por favor, preencha o campo SENHA antes de iniciar a macro.';
        msgerro.style.display = 'block';
        return;
    }
    if (!file) {
        msgerro.textContent = 'Por favor, selecione um arquivo EXCEL antes de iniciar a macro.';
        msgerro.style.display = 'block';
        return;
    }

    // Pega o identificador do usuário do sessionStorage ou outro contexto
    const identificador_usuario = sessionStorage.getItem('nomeUsuario') || 'Usuário não identificado';
    const nome_arquivo = file.name;
    const tipo_arquivo = 'excel'; // ou detecte pelo nome

    if (botaoinciairmacro && dicas && previewvectora && abalogin && abaexecutar) {
        dicas.style.display = 'none';
        previewvectora.style.display = 'none';
        abalogin.style.display = 'none';
        abaexecutar.style.display = 'block';
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const conteudo_base64 = e.target.result;
        eel.iniciar_macro_deliberacaoo(
            costumer.value,
            login.value,
            senha.value,
            conteudo_base64,
            nome_arquivo,
            tipo_arquivo,
            identificador_usuario
        )();
    };
    reader.readAsDataURL(file);
}

eel.expose(atualizar_status_macro);
function atualizar_status_macro(processando, status, quantidade, erros, total, tempo_legivel, cor_status) {
    document.getElementById('os-processando').textContent = processando || '-';
    const statusSpan = document.getElementById('os-status');
    statusSpan.textContent = status || '-';
    // Aplica cor ao status
    if (cor_status) {
        statusSpan.style.color = cor_status;
    } else {
        statusSpan.style.color = '';
    }
    // Exibe no formato "processados de total"
    if (typeof quantidade !== 'undefined' && typeof total !== 'undefined') {
        document.getElementById('quantidade').textContent = `${quantidade} de ${total}`;
    } else {
        document.getElementById('quantidade').textContent = quantidade || '0';
    }
    document.getElementById('oserros').textContent = erros || '0';
    // Atualiza tempo estimado se vier como parâmetro
    if (typeof tempo_legivel !== 'undefined') {
        document.getElementById('tempoestimado').textContent = tempo_legivel || '-';
    }
}

eel.expose(atualizar_tempo_estimado);
function atualizar_tempo_estimado(tempo_legivel) {
    document.getElementById('tempoestimado').textContent = tempo_legivel || '-';
}

eel.expose(atualizar_porcentagem_concluida);
function atualizar_porcentagem_concluida(porcentagem) {
    document.getElementById('porcentagem-concluida').textContent = porcentagem || '-';
}

// Carrega a foto de perfil ao iniciar
async function loadProfilePicture() {
    try {
        const userId = sessionStorage.getItem('user_id');
        if (!userId) {
            console.warn("user_id não encontrado no sessionStorage.");
            return;
        }
        const res = await eel.get_user_profile_data(userId)();
        const profileImg = document.getElementById('profile-img');
        const profileIcon = document.getElementById('profile-icon');
        if (res && res.status === 'success' && res.data && res.data.foto_perfil_url) {
            if (profileImg) {
                profileImg.src = res.data.foto_perfil_url;
                profileImg.style.display = 'block';
            }
            if (profileIcon) {
                profileIcon.style.display = 'none';
            }
        } else {
            if (profileImg) profileImg.style.display = 'none';
            if (profileIcon) profileIcon.style.display = 'block';
        }
    } catch (e) {
        console.error('Erro ao carregar foto de perfil:', e);
    }
}
window.addEventListener('DOMContentLoaded', loadProfilePicture);

async function viewResultsFolder() {
    console.log("Solicitando abertura da pasta de resultados...");
    try {
        const result = await eel.open_results_foldervectora()(); // Chama a função Python exposta
        
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
    const vectoracostumer = document.getElementById("vectora-costumer");
    const loginneta = document.getElementById("vectora-login");
    const senhaneta = document.getElementById("vectora-password");
    const tipoaquivocsvexcel = document.getElementById("arquivo-csv");
  

    if(divprocessamento && divcomecar && divpreview && loginneta && senhaneta && vectoracostumer) {
        divprocessamento.style.display = "none";
        divcomecar.style.display = "block";
        divpreview.style.display = "block";
        tipoaquivocsvexcel.value = ''; // Limpa o campo de arquivo

    }
    // ZERA CAMPOS DE STATUS NA INTERFACE
    const osProcessando = document.getElementById('os-processando');
    const quantidade = document.getElementById('quantidade');
    const totalCount = document.getElementById('total-count');
    const oserros = document.getElementById('oserros');
    const status =  document.getElementById('os-status');
    const tempoEstimado = document.getElementById('tempoestimado');
    const porcentagemConcluida = document.getElementById('porcentagem-concluida');
    if (osProcessando) osProcessando.innerText = '';
    if (quantidade) quantidade.innerText = '';
    if (totalCount) totalCount.innerText = '';
    if (status) status.innerText = '';
    if (oserros) oserros.innerText = '';
    if (tempoEstimado) tempoEstimado.innerText = '';
    if (porcentagemConcluida) porcentagemConcluida.innerText = '';
}

// Atualiza o horário atual
function atualizarHorarioAtual() {
    const horarioAtualElement = document.getElementById('current-time');

    if (horarioAtualElement) {
        const agora = new Date();
        const horas = agora.getHours().toString().padStart(2, '0');
        const minutos = agora.getMinutes().toString().padStart(2, '0');
        const segundos = agora.getSeconds().toString().padStart(2, '0');
        const dia = agora.getDate().toString().padStart(2, '0');
        const mes = (agora.getMonth() + 1).toString().padStart(2, '0');
        const ano = agora.getFullYear();

        horarioAtualElement.textContent = `${dia}/${mes}/${ano} - ${horas}:${minutos}:${segundos}`;
    } else {
        console.error("[index.js] Elemento com ID 'current-time' não encontrado no DOM ao atualizar horário.");
    }
}

// Atualiza o tempo logado
function formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function updateLoggedInTime(sessionStartTime) {
    const loggedInTimeSpan = document.getElementById('logged-in-time');
    if (!loggedInTimeSpan) return;
    const now = Date.now();
    const elapsedMilliseconds = now - sessionStartTime;
    const elapsedSeconds = Math.floor(elapsedMilliseconds / 1000);
    loggedInTimeSpan.innerText = formatTime(elapsedSeconds);
}

function obterParametroDaURL(nome) {
    //console.log("[index.js] Chamada a obterParametroDaURL para o parâmetro:", nome); // Comentado para reduzir logs

    nome = nome.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp('[?&]' + nome + '(=([^&#]*)|&|#|$)');
    const results = regex.exec(window.location.href);

    //console.log("[index.js] URL atual:", window.location.href); // Comentado para reduzir logs
    //console.log("[index.js] Resultados da Regex:", results); // Comentado para reduzir logs

    if (!results) {
        //console.log("[index.js] Parâmetro não encontrado na URL."); // Comentado para reduzir logs
        return null;
    }
    if (!results[2]) {
        //console.log("[index.js] Parâmetro encontrado, mas o valor está vazio."); // Comentado para reduzir logs
        return '';
    }
    const decodedValue = decodeURIComponent(results[2].replace(/\+/g, ' '));
    //console.log("[index.js] Valor do parâmetro encontrado e decodificado:", decodedValue); // Comentado para reduzir logs
    return decodedValue;
}

window.onload = async function () {
    console.log("[index.js] window.onload UNIFICADO iniciado.");

    const nomeUsuarioElement = document.getElementById('nome-usuario');
    let identificadorUsuario = null;

    const identificadorUsuarioDaURL = obterParametroDaURL('identificador');
    const userIdFromUrl = obterParametroDaURL('user_id');
    const firstLoginComplete = obterParametroDaURL('first_login_complete');

    console.log("[index.js] Valor de identificadorUsuarioDaURL:", identificadorUsuarioDaURL);
    console.log("[index.js] Valor de userIdFromUrl:", userIdFromUrl);
    console.log("[index.js] Valor de firstLoginComplete:", firstLoginComplete);
    console.log("[index.js] Elemento nomeUsuarioElement:", nomeUsuarioElement);

    if (identificadorUsuarioDaURL) {
        identificadorUsuario = identificadorUsuarioDaURL;
        sessionStorage.setItem('nomeUsuario', identificadorUsuario);
        console.log("[index.js] Nome do usuário obtido da URL (identificador) e armazenado em sessionStorage.");
    } else if (userIdFromUrl && firstLoginComplete === 'true') {
         console.log("[index.js] Redirecionado do primeiro login. Obtendo nome do usuário por ID...");
         try {
             const resultadoNome = await eel.get_username_by_id(userIdFromUrl)();
             console.log("[index.js] Resultado get_username_by_id:", resultadoNome);

             if (resultadoNome && resultadoNome.status === 'success') {
                 identificadorUsuario = resultadoNome.username;
                 sessionStorage.setItem('nomeUsuario', identificadorUsuario);
                 sessionStorage.setItem('user_id', resultadoNome.user_id); // <-- Adicionando esta linha
                 console.log("[index.js] Nome do usuário obtido por ID e armazenado em sessionStorage.");
             } else {
                 console.error("[index.js] Falha ao obter nome do usuário por ID:", resultadoNome);
             }
         } catch (error) {
             console.error("[index.js] Erro na chamada Eel para get_username_by_id:", error);
         }
    } else {
        identificadorUsuario = sessionStorage.getItem('nomeUsuario');
        if (identificadorUsuario) {
             console.log("[index.js] Nome do usuário obtido do sessionStorage (fallback).");
        } else {
             console.log("[index.js] Nome do usuário não encontrado em URL ou sessionStorage. Usuário pode não estar logado.");
        }
    }

    if (identificadorUsuario && nomeUsuarioElement) {
        nomeUsuarioElement.textContent = identificadorUsuario;
        console.log("[index.js] Nome do usuário exibido:", identificadorUsuario);
    } else if (nomeUsuarioElement) {
         nomeUsuarioElement.textContent = "Usuário Padrão";
         console.log("[index.js] Nome do usuário não atualizado. Identificador nulo ou elemento não encontrado. Exibindo padrão.");
    }

    if (typeof iniciarTransicaoPagina === 'function') {
        iniciarTransicaoPagina();
        console.log("[index.js] iniciarTransicaoPagina chamada.");
    } else {
        console.error("[index.js] Função iniciarTransicaoPagina não definida.");
    }

    if (typeof atualizarHorarioAtual === 'function') {
        atualizarHorarioAtual();
        console.log("[index.js] atualizarHorarioAtual chamada.");
    } else {
        console.error("[index.js] Função atualizarHorarioAtual não definida.");
    }

    if (typeof atualizarHorarioAtual === 'function') {
        setInterval(atualizarHorarioAtual, 1000);
        console.log("[index.js] setInterval para atualizarHorarioAtual configurado.");
    }

    // --- Lógica do timer logado ---
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
        const urlParams = new URLSearchParams(window.location.search);
        const loginTimeParam = urlParams.get('login_time');
        console.log(`Timer: sessionStartTime não encontrado no sessionStorage. Tentando obter da URL. Valor: ${loginTimeParam}`);

        if (loginTimeParam) {
            sessionStartTime = parseInt(loginTimeParam, 10);
            if (!isNaN(sessionStartTime)) {
                 console.log("Timer: sessionStartTime válido obtido da URL.");
                sessionStorage.setItem('sessionStartTime', sessionStartTime);
                 console.log("Timer: sessionStartTime salvo em sessionStorage a partir da URL.");
                 if (typeof updateLoggedInTime === 'function') {
                    updateLoggedInTime(sessionStartTime);
                    setInterval(() => {
                        updateLoggedInTime(sessionStartTime);
                    }, 1000);
                     console.log("Timer: Timer iniciado usando URL.");
                 } else {
                     console.error("Timer: Função updateLoggedInTime não definida neste escopo (após obter da URL).");
                      const loggedInTimeSpan = document.getElementById('logged-in-time');
                      if (loggedInTimeSpan) {
                         loggedInTimeSpan.innerText = "Erro JS (timer URL)";
                      }
                 }
            } else {
                console.error("Timer: Parâmetro 'login_time' inválido na URL.");
                const loggedInTimeSpan = document.getElementById('logged-in-time');
                 if (loggedInTimeSpan) {
                    loggedInTimeSpan.innerText = "Erro no timer (URL)";
                 }
            }
        } else {
            console.warn("Timer: Parâmetro 'login_time' não encontrado em URL nem sessionStorage. O timer não iniciará.");
            const loggedInTimeSpan = document.getElementById('logged-in-time');
            if (loggedInTimeSpan) {
                loggedInTimeSpan.innerText = "Não iniciado";
            }
        }
    }
    // --- Fim da lógica do timer logado ---

    console.log("[index.js] window.onload UNIFICADO finalizado.");
};

eel.expose(mostrarResumoFinalDeliberacao);
function mostrarResumoFinalDeliberacao({
    inicio, termino, processados, erros, tempoTotal
}) {
    // Esconde a div de processamento
    document.getElementById('macrosite-processing-status').style.display = 'none';
    // Mostra a div de conclusão
    document.getElementById('macrosite-completion-status').style.display = 'block';
    // Preenche os campos de resumo
    document.getElementById('start-datetime').textContent = inicio || '-';
    document.getElementById('end-datetime').textContent = termino || '-';
    document.getElementById('processed-count').textContent = processados || '0';
    document.getElementById('error-count').textContent = erros || '0';
    document.getElementById('total-time').textContent = tempoTotal || '-';
}

// ...removido mostrarToast e fecharToast duplicados, usar apenas as do toast.js...

if (window.eel) {
    eel.expose(function update_progress(data) {
        if (data && data.macro_concluida) {
            mostrarToast('Macro Consulta Geral foi finalizada com êxito.');
            localStorage.setItem('macroFinalizada', 'true');
        }
    }, 'update_progress');
}

window.addEventListener('storage', function(event) {
    if (event.key === 'macroFinalizada' && event.newValue === 'true') {
        mostrarToast('Macro Consulta Geral foi finalizada com êxito.');
        localStorage.setItem('macroFinalizada', 'false');
    }
});