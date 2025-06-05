
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

// >>> Definição da função obterParametroDaURL (mover para antes de window.onload) <<<
// Precisa estar acessível pela função window.onload.
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
        console.error("[index.js] Elemento com ID 'current-time' não encontrado no DOM ao atualizar horário.");
    }
}


// >>> Definição da função iniciarTransicaoPagina (mover para antes de window.onload) <<<
function iniciarTransicaoPagina() {
    // Esta função parece estar definida mais de uma vez ou de formas inconsistentes nos seus arquivos.
    // Mantenha UMA definição correta e acessível.
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

// Função de logout
function deslogar() {
    sessionStorage.removeItem('nomeUsuario');
    sessionStorage.removeItem('user_id');
    window.location.href = './login.html';
}

// Função de transição de entrada
function iniciarTransicaoPagina() {
    const bodyElement = document.body;
    if (bodyElement) {
        bodyElement.style.display = 'block';
        setTimeout(() => {
            bodyElement.classList.add('is-visible');
        }, 5);
    }
}

