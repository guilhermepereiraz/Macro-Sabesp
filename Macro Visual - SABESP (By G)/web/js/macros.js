const carouselContainer = document.querySelector('.carousel-container');
const carouselItems = document.getElementById('macroCarouselItems');
const btnPrev = document.getElementById('carouselPrev');
const btnNext = document.getElementById('carouselNext');
const paginationDotsContainer = document.getElementById('carouselPagination');

let currentIndex = 0;
let itemWidth = 0;
let itemsPerPage = 1;

function updateCarouselDisplay() {
    const offset = -currentIndex * itemWidth;
    carouselItems.style.transform = `translateX(${offset}px)`;

    btnPrev.disabled = currentIndex === 0;
    btnNext.disabled = currentIndex >= carouselItems.children.length - itemsPerPage;

    updatePaginationDots();
}

function updatePaginationDots() {
    if (!paginationDotsContainer) return;

    const dots = paginationDotsContainer.querySelectorAll('.carousel-dot');
    dots.forEach((dot, index) => {
        const pageIndex = Math.floor(currentIndex / itemsPerPage);
        if (index === pageIndex) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

function createPaginationDots() {
    if (!paginationDotsContainer) return;

    paginationDotsContainer.innerHTML = '';
    const totalItems = carouselItems.children.length;
    const numberOfPages = Math.ceil(totalItems / itemsPerPage);

    for (let i = 0; i < numberOfPages; i++) {
        const dot = document.createElement('span');
        dot.classList.add('carousel-dot');
        dot.addEventListener('click', () => {
            currentIndex = i * itemsPerPage;
            updateCarouselDisplay();
        });
        paginationDotsContainer.appendChild(dot);
    }
    updatePaginationDots();
}

function calculateCarouselMetrics() {
    const firstItem = carouselItems.children[0];
    if (firstItem) {
        const itemStyle = getComputedStyle(firstItem);
        const gap = parseFloat(getComputedStyle(carouselItems).gap) || 0;
        const marginRight = parseFloat(itemStyle.marginRight) || 0;

        const spacing = gap > 0 ? gap : marginRight;

        itemWidth = firstItem.offsetWidth + spacing;

        const containerWidth = carouselContainer.offsetWidth -
                                           (parseFloat(getComputedStyle(carouselContainer).paddingLeft) || 0) -
                                           (parseFloat(getComputedStyle(carouselContainer).paddingRight) || 0);

        itemsPerPage = Math.floor(containerWidth / itemWidth) || 1;
    } else {
        itemWidth = 0;
        itemsPerPage = 1;
    }
    createPaginationDots();
}

btnNext.addEventListener('click', () => {
    if (currentIndex < carouselItems.children.length - itemsPerPage) {
        currentIndex++;
        updateCarouselDisplay();
    }
});

btnPrev.addEventListener('click', () => {
    if (currentIndex > 0) {
        currentIndex--;
        updateCarouselDisplay();
    }
});

window.addEventListener('resize', () => {
    calculateCarouselMetrics();
    currentIndex = Math.max(0, Math.min(currentIndex, carouselItems.children.length - itemsPerPage));
    updateCarouselDisplay();
});

// >>> Definição da função iniciarTransicaoPagina (mover para antes de window.onload) <<<
function iniciarTransicaoPagina() {
     console.log("[macros.js] Chamada a iniciarTransicaoPagina.");
     const bodyElement = document.body;
     if (bodyElement) {
         bodyElement.style.display = 'block';
         setTimeout(() => {
             bodyElement.classList.add('is-visible');
             console.log("[macros.js] Transição de entrada iniciada para o body.");
             // Inicializa o carrossel aqui, após o display ser ajustado e um pequeno atraso
             calculateCarouselMetrics();
             updateCarouselDisplay();
         }, 5); // Atraso após display:block antes de adicionar a classe e inicializar carrossel
     } else {
         console.error("[macros.js] Elemento body não encontrado.");
     }
}


// >>> Definição da função obterParametroDaURL (mover para antes de window.onload) <<<
function obterParametroDaURL(nome) {
    //console.log("[macros.js] Chamada a obterParametroDaURL para o parâmetro:", nome); // Comentado para reduzir logs

    nome = nome.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp('[?&]' + nome + '(=([^&#]*)|&|#|$)');
    const results = regex.exec(window.location.href);

    //console.log("[macros.js] URL atual:", window.location.href); // Comentado para reduzir logs
    //console.log("[macros.js] Resultados da Regex:", results); // Comentado para reduzir logs


    if (!results) {
        //console.log("[macros.js] Parâmetro não encontrado na URL."); // Comentado para reduzir logs
        return null;
    }
    if (!results[2]) {
        //console.log("[macros.js] Parâmetro encontrado, mas o valor está vazio."); // Comentado para reduzir logs
        return '';
    }
    const decodedValue = decodeURIComponent(results[2].replace(/\+/g, ' '));
    //console.log("[macros.js] Valor do parâmetro encontrado e decodificado:", decodedValue); // Comentado para reduzir logs
    return decodedValue;
}


// >>> Definição da função atualizarHorarioAtual (mover para antes de window.onload) <<<
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
        console.error("[macros.js] Elemento com ID 'current-time' não encontrado no DOM ao atualizar horário.");
    }
}


// >>> Lógica para obter e exibir o nome do usuário ao carregar a página <<<
// Esta lógica deve ser executada quando a janela inteira estiver carregada
window.onload = async function () {
    console.log("[macros.js] window.onload UNIFICADO iniciado.");

    const nomeUsuarioElement = document.getElementById('nome-usuario');
    let identificadorUsuario = null;

    const identificadorUsuarioDaURL = obterParametroDaURL('identificador');
    const userIdFromUrl = obterParametroDaURL('user_id');
    const firstLoginComplete = obterParametroDaURL('first_login_complete');

    console.log("[macros.js] Valor de identificadorUsuarioDaURL:", identificadorUsuarioDaURL);
    console.log("[macros.js] Valor de userIdFromUrl:", userIdFromUrl);
    console.log("[macros.js] Valor de firstLoginComplete:", firstLoginComplete);
    console.log("[macros.js] Elemento nomeUsuarioElement:", nomeUsuarioElement);

    if (identificadorUsuarioDaURL) {
        identificadorUsuario = identificadorUsuarioDaURL;
        sessionStorage.setItem('nomeUsuario', identificadorUsuario);
        console.log("[macros.js] Nome do usuário obtido da URL (identificador) e armazenado em sessionStorage.");
    } else if (userIdFromUrl && firstLoginComplete === 'true') {
         console.log("[macros.js] Redirecionado do primeiro login. Obtendo nome do usuário por ID...");
         try {
             const resultadoNome = await eel.get_username_by_id(userIdFromUrl)();
             console.log("[macros.js] Resultado get_username_by_id:", resultadoNome);

             if (resultadoNome && resultadoNome.status === 'success') {
                 identificadorUsuario = resultadoNome.username;
                 sessionStorage.setItem('nomeUsuario', identificadorUsuario);
                 console.log("[macros.js] Nome do usuário obtido por ID e armazenado em sessionStorage.");
             } else {
                 console.error("[macros.js] Falha ao obter nome do usuário por ID:", resultadoNome);
             }
         } catch (error) {
             console.error("[macros.js] Erro na chamada Eel para get_username_by_id:", error);
         }
    } else {
        identificadorUsuario = sessionStorage.getItem('nomeUsuario');
        if (identificadorUsuario) {
             console.log("[macros.js] Nome do usuário obtido do sessionStorage (fallback).");
        } else {
             console.log("[macros.js] Nome do usuário não encontrado em URL ou sessionStorage. Usuário pode não estar logado.");
        }
    }

    if (identificadorUsuario && nomeUsuarioElement) {
        nomeUsuarioElement.textContent = identificadorUsuario;
        console.log("[macros.js] Nome do usuário exibido:", identificadorUsuario);
    } else if (nomeUsuarioElement) {
         nomeUsuarioElement.textContent = "Usuário Padrão";
         console.log("[macros.js] Nome do usuário não atualizado. Identificador nulo ou elemento não encontrado. Exibindo padrão.");
    }

    if (typeof iniciarTransicaoPagina === 'function') {
        iniciarTransicaoPagina();
        console.log("[macros.js] iniciarTransicaoPagina chamada.");
    } else {
        console.error("[macros.js] Função iniciarTransicaoPagina não definida.");
    }

    if (typeof atualizarHorarioAtual === 'function') {
        atualizarHorarioAtual();
        console.log("[macros.js] atualizarHorarioAtual chamada.");
    } else {
        console.error("[macros.js] Função atualizarHorarioAtual não definida.");
    }

    if (typeof atualizarHorarioAtual === 'function') {
        setInterval(atualizarHorarioAtual, 1000);
        console.log("[macros.js] setInterval para atualizarHorarioAtual configurado.");
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

    console.log("[macros.js] window.onload UNIFICADO finalizado.");
};


function deslogar() {
    console.log("[macros.js] Chamada a deslogar.");
    const deslog = document.getElementById('deslog'); // Este ID pode ser do botão de logout
    if (deslog) {
        sessionStorage.removeItem('nomeUsuario'); // Limpa o nome do usuário no logout
        console.log("[macros.js] sessionStorage 'nomeUsuario' limpo. Redirecionando para login.html");
        window.location.href = './login.html';
    } else {
        console.error("[macros.js] Elemento com ID 'deslog' (botão de logout) não encontrado.");
         // Mesmo se o botão não for encontrado, tentar redirecionar e limpar storage pode ser desejável
         sessionStorage.removeItem('nomeUsuario');
         console.log("[macros.js] sessionStorage 'nomeUsuario' limpo (fallback). Redirecionando para login.html");
         window.location.href = './login.html';
    }
}


// Funções Eel expostas (verifique se há duplicações com outros JS files)
// eel.expose(alguma_funcao_aqui);

// >>> Funções de Callback para o Backend (movidas para fora do DOMContentLoaded/window.onload) <<<
// Se o backend chamar estas funções, elas precisam estar acessíveis globalmente.
// Exposição para a função de atualização de status da Macro SITE (se o backend chamar)
// eel.expose(atualizar_status_os, 'atualizar_status_os'); // Certifique-se de que atualizar_status_os está definida globalmente se for chamada

// Exposição para a função de atualização de tempo restante da Macro SITE (se o backend chamar)
// eel.expose(atualizar_tempo_restante_js, 'atualizar_tempo_restante_js'); // Certifique-se de que atualizar_tempo_restante_js está definida globalmente se for chamada


// >>> Funções relacionadas à Macro Consulta Geral (moved to macros.js) <<<
// Se estas funções são usadas na página macros.html (e não apenas login.html),
// suas definições precisam estar aqui ou em um arquivo JS compartilhado.
// Mova as definições das funções da Consulta Geral (lerArquivoSelecionadoconsultageral, fecharconsultageral, etc.)
// e suas respectivas exposições Eel (@eel.expose no backend e eel.expose() no frontend) para este arquivo.

// Exemplo: Mover a definição de lerArquivoSelecionadoconsultageral para cá
/*
function lerArquivoSelecionadoconsultageral(...) { ... }
window.lerArquivoSelecionadoconsultageral = lerArquivoSelecionadoconsultageral; // Se chamada do HTML

// Exemplo: Mover as funções de popup/finalização da Consulta Geral
function fecharPopupCS() { ... }
function voltarParaProcessarCS() { ... }
function CSfinalizarProcesso() { ... }
function CSconfirmarFecharAplicacao() { ... }

// Exemplo: Mover as exposições Eel específicas da Consulta Geral (se o backend chamar)
// eel.expose(atualizar_status_os_consulta_geral, 'atualizar_status_os_consulta_geral');
// eel.expose(exibir_conclusao_consulta_geral, 'exibir_conclusao_consulta_geral');

*/


// >>> Outras funções específicas de Macro SITE (mover para macros.js se estiverem lá) <<<
// Se funções como mostrarmacro, fecharsite, etc., pertencem APENAS à Macro SITE
// e esta é a página de macros, mantenha-as aqui.

// Função mostrarmacro (definida aqui fora do DOMContentLoaded/window.onload)
function mostrarmacro() {
    const macrosite = document.getElementById('macrosite');
    const siteProssDiv = document.getElementById('sitepross2');
    const sitePopupDiv = document.getElementById('sitepopup');
    const siteFinishDiv = document.getElementById('sitefinish');
    const conclusaosite = document.getElementById('siteconclusao');
    const consultageralDiv = document.getElementById('consultageral');
    const consultpross2Div = document.getElementById('consultpross2');
    const csPopupDiv = document.getElementById('cs-popup');
    const csFinishDiv = document.getElementById('cs-finish');

    console.log("[macros.js] Chamada a mostrarmacro.");

    if (
        (siteProssDiv && siteProssDiv.style.display === 'block') ||
        (sitePopupDiv && sitePopupDiv.style.display === 'block') ||
        (siteFinishDiv && siteFinishDiv.style.display === 'block') ||
        (conclusaosite && conclusaosite.style.display === 'block') ||
        (consultageralDiv && consultageralDiv.style.display === 'block') ||
        (consultpross2Div && consultpross2Div.style.display === 'block') ||
        (csPopupDiv && csPopupDiv.style.display === 'block') ||
        (csFinishDiv && csFinishDiv.style.display === 'block')
    ) {
        console.log("[macros.js] Uma interface predominante já está visível. Impedindo a exibição de 'macrosite'.");
        return;
    }

    if (macrosite) {
        if (macrosite.style.display === 'none' || macrosite.style.display === '') {
            if (consultageralDiv) consultageralDiv.style.display = 'none'; // Oculta outras telas iniciais
            macrosite.style.display = 'block';
            console.log("[macros.js] Exibindo 'macrosite'.");
        } else {
            console.log("[macros.js] 'macrosite' já está visível.");
        }
    } else {
        console.error("[macros.js] Elemento 'macrosite' não encontrado.");
    }
}

// Função fecharsite (definida aqui fora do DOMContentLoaded/window.onload)
function fecharsite() {
    console.log("[macros.js] Chamada a fecharsite.");
    const macrositeDiv = document.getElementById('macrosite');
    const loginInput = document.getElementById('login2');
    const senhaInput = document.getElementById('password2');
    const arquivoCsvInput = document.getElementById('arquivo-csv');

    if (macrositeDiv && loginInput && senhaInput && arquivoCsvInput) {
        macrositeDiv.style.display = 'none';
        loginInput.value = '';
        senhaInput.value = '';
        arquivoCsvInput.value = '';
        console.log("[macros.js] Tela da Macro SITE fechada e campos resetados.");
    } else {
        console.error("[macros.js] Um ou mais elementos necessários para fecharsite não foram encontrados.");
    }
}

// >>> Definição da função exibir_conclusao_site (se for usada nesta página) <<<
// Se esta função for chamada pelo Eel ou por outro lugar em macros.js, defina-a aqui.
// eel.expose(exibir_conclusao_site); // Lembre-se de expor no Eel no Python se for chamada.
function exibir_conclusao_site(resultado) { // Exemplo: assume que recebe o resultado do backend
    console.log("[macros.js] Chamada a exibir_conclusao_site.");
    const siteProssDiv = document.getElementById('sitepross2');
    const siteFinishDiv = document.getElementById('sitefinish'); // Supondo que há uma div para conclusão

    if (siteProssDiv) siteProssDiv.style.display = 'none';

    if (siteFinishDiv) {
        // Atualize a tela de conclusão com base no 'resultado'
        // Ex: siteFinishDiv.querySelector('#mensagem-final').textContent = resultado.mensagem;
        siteFinishDiv.style.display = 'block';
         console.log("[macros.js] Exibindo tela de conclusão da Macro SITE.");
    } else {
        console.error("[macros.js] Elemento da tela de conclusão (sitefinish) não encontrado.");
    }
    // Implemente a lógica de exibição dos resultados finais aqui
}

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
}

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