// sugestao.js

// Função para deslogar (mantida para consistência da nav-bar)
window.deslogar = function () {
    console.log("[sugestao.js] Chamada a deslogar.");
    sessionStorage.removeItem('nomeUsuario');
    sessionStorage.removeItem('user_id');
    sessionStorage.removeItem('sessionStartTime');
    console.log("[sugestao.js] sessionStorage limpos. Redirecionando para login.html");
    window.location.href = './login.html';
};

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
    const loggedInTimeSpan = document.getElementById('logged-in-time');
    if (!loggedInTimeSpan) return;
    const now = Date.now();
    const elapsedMilliseconds = now - sessionStartTime;
    const elapsedSeconds = Math.floor(elapsedMilliseconds / 1000);
    loggedInTimeSpan.innerText = formatTime(elapsedSeconds);
}

// Funções para feedback e leitura de arquivos (já existiam, mantidas)
function showFeedback(message, type = 'success') {
    const feedbackMessage = document.getElementById('feedback-message');
    feedbackMessage.textContent = message;
    feedbackMessage.className = `feedback-message ${type}`;
    feedbackMessage.style.display = 'block';
    setTimeout(() => { feedbackMessage.style.display = 'none'; }, 5000);
}

// Armazenamento temporário dos arquivos para que possam ser removidos antes do envio
let currentSelectedFiles = [];

// Função para exibir arquivos selecionados
function displaySelectedFiles() {
    const fileListDiv = document.getElementById('file-list');
    fileListDiv.innerHTML = ''; // Limpa a lista existente

    if (currentSelectedFiles.length === 0) {
        fileListDiv.style.display = 'none';
        return;
    }

    fileListDiv.style.display = 'block';
    currentSelectedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <span>${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)</span>
            <button type="button" class="remove-file-btn" data-index="${index}">
                <i class="fas fa-times"></i>
            </button>
        `;
        fileListDiv.appendChild(fileItem);
    });

    // Adiciona event listeners para os botões de remover
    fileListDiv.querySelectorAll('.remove-file-btn').forEach(button => {
        button.addEventListener('click', function() {
            const indexToRemove = parseInt(this.dataset.index);
            currentSelectedFiles.splice(indexToRemove, 1); // Remove o arquivo do array
            displaySelectedFiles(); // Atualiza a exibição
        });
    });
}

// Função para ler um arquivo e convertê-lo para Base64
function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}


document.addEventListener('DOMContentLoaded', function() {
    console.log("[sugestao.js] DOMContentLoaded disparado.");

    // Lógica para preencher o nome do usuário e o tempo de sessão na nav-bar
    const nomeUsuarioElement = document.getElementById('nome-usuario');
    const identificadorUsuario = sessionStorage.getItem('nomeUsuario');
    if (identificadorUsuario && nomeUsuarioElement) {
        nomeUsuarioElement.textContent = identificadorUsuario;
    } else if (nomeUsuarioElement) {
        nomeUsuarioElement.textContent = "Usuário Padrão";
    }

    // Inicia a atualização do horário atual
    atualizarHorarioAtual();
    setInterval(atualizarHorarioAtual, 1000);

    // Inicia a atualização do tempo logado
    let sessionStartTime = sessionStorage.getItem('sessionStartTime');
    if (sessionStartTime) {
        sessionStartTime = parseInt(sessionStartTime, 10);
        if (!isNaN(sessionStartTime)) {
            updateLoggedInTime(sessionStartTime);
            setInterval(() => {
                updateLoggedInTime(sessionStartTime);
            }, 1000);
        }
    }

    // --- Lógica das Abas ---
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    let currentSuggestionType = 'nova-macro'; // Define o tipo de sugestão inicial

    // Garante que só os campos da aba ativa estão habilitados
    function switchSuggestionType(type) {
        tabButtons.forEach(button => {
            if (button.dataset.type === type) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });

        tabContents.forEach(content => {
            // Apenas oculta/mostra, a validação será feita no JS
            if (content.id.startsWith(type)) {
                content.style.display = 'block'; // Mostra o conteúdo da aba
                content.classList.add('active');
            } else {
                content.style.display = 'none'; // Oculta o conteúdo da aba
                content.classList.remove('active');
            }
        });
        currentSuggestionType = type;
        console.log(`Tipo de sugestão alterado para: ${currentSuggestionType}`);
    }

    // Adiciona event listeners para os botões de aba
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            switchSuggestionType(button.dataset.type);
        });
    });

    // Ativa a aba inicial
    switchSuggestionType(currentSuggestionType);


    // --- Lógica do Formulário ---
    const sugestaoForm = document.getElementById('sugestao-form');
    if (sugestaoForm) {
        sugestaoForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            console.log("[Sugestão] Submit disparado");

            // Coleta os campos comuns a ambas as abas
            const nomeInput = document.getElementById('seu-nome-area');
            const emailInput = document.getElementById('email-remetente-sugestao'); // NOVO ID
            const prioridadeInput = document.getElementById('prioridade-sugestao');
            const anexoInput = document.getElementById('anexo-sugestao');

            // Validação dos campos comuns
            if (!nomeInput || !nomeInput.value.trim()) {
                showFeedback('Por favor, preencha seu nome.', 'error');
                return;
            }
            if (!emailInput || !emailInput.value.trim()) {
                showFeedback('Por favor, preencha seu e-mail.', 'error');
                return;
            }
            if (!emailInput.value.includes('@') || !emailInput.value.includes('.')) {
                showFeedback('Por favor, insira um e-mail válido.', 'error');
                return;
            }

            let titulo = '';
            let descricao = '';
            let ambienteSoftware = '';
            let processoAtual = '';
            let processoDesejado = '';
            let macroExistente = '';
            let descricaoMelhoria = '';

            // Validação e coleta de dados específicos da aba ativa
            if (currentSuggestionType === 'Nova Macro') {
                titulo = document.getElementById('titulo-sugestao')?.value.trim();
                descricao = document.getElementById('descricao-sugestao')?.value.trim();
                ambienteSoftware = document.getElementById('ambiente-software')?.value.trim();
                processoAtual = document.getElementById('processo-atual')?.value.trim();
                processoDesejado = document.getElementById('processo-desejado')?.value.trim();

                if (!titulo || !descricao || !ambienteSoftware || !processoAtual || !processoDesejado) {
                    showFeedback('Por favor, preencha todos os campos obrigatórios para Sugerir Nova Macro.', 'error');
                    return;
                }
            } else if (currentSuggestionType === 'Melhoria') {
                macroExistente = document.getElementById('macro-existente')?.value;
                descricaoMelhoria = document.getElementById('descricao-melhoria')?.value.trim();

                if (!macroExistente || macroExistente === '') {
                    showFeedback('Por favor, selecione uma macro existente para melhoria.', 'error');
                    return;
                }
                if (!descricaoMelhoria) {
                    showFeedback('Por favor, preencha a descrição da melhoria sugerida.', 'error');
                    return;
                }
            }

            // Validação do anexo (se for obrigatório)
            // Se o anexo não for obrigatório, remova esta validação
            if (!anexoInput || anexoInput.files.length === 0) {
                showFeedback('Por favor, anexe pelo menos um arquivo.', 'error');
                console.warn("[Sugestão] Nenhum anexo selecionado.");
                return;
            }

            // Monte o objeto com os dados do formulário
            const dadosSugestao = {
                nome: nomeInput.value,
                email: emailInput.value,
                prioridade: prioridadeInput.value,
                data_envio: new Date().toLocaleString(),
                anexos: [],
                tipo: currentSuggestionType, // 'nova-macro' ou 'melhoria'
                // Dados específicos da aba
                titulo_sugestao: titulo,
                descricao_sugestao: descricao,
                ambiente_software: ambienteSoftware,
                processo_atual: processoAtual,
                processo_desejado: processoDesejado,
                macro_existente: macroExistente,
                descricao_melhoria: descricaoMelhoria
            };
            console.log("[Sugestão] Dados montados:", dadosSugestao);

            // Processa anexos (se houver)
            if (anexoInput && anexoInput.files.length > 0) {
                for (const file of anexoInput.files) {
                    try {
                        const base64Content = await readFileAsBase64(file);
                        dadosSugestao.anexos.push({
                            nome: file.name,
                            conteudo_base64: base64Content
                        });
                    } catch (error) {
                        showFeedback(`Erro ao preparar o arquivo "${file.name}" para envio.`, 'error');
                        console.error("[Sugestão] Erro ao ler arquivo:", error);
                        return;
                    }
                }
            }

            // Chame a função Python via Eel
            const destinatarioFixo = "seu@email.com"; // Troque pelo destinatário desejado
            try {
                console.log("[Sugestão] Chamando eel.enviar_email_sugestao...");
                const response = await eel.enviar_email_sugestao(dadosSugestao, destinatarioFixo)();
                console.log("[Sugestão] Resposta do backend:", response);
                if (response.sucesso) { // Use 'sucesso' conforme o retorno do Python
                    showFeedback('Sugestão enviada com sucesso! Obrigado.', 'success');
                    sugestaoForm.reset();
                    currentSelectedFiles = []; // Limpa os arquivos selecionados
                    displaySelectedFiles(); // Atualiza a exibição
                    // Opcional: Voltar para a aba padrão 'nova-macro' após o envio
                    switchSuggestionType('nova-macro');
                } else {
                    showFeedback(`Erro ao enviar sugestão: ${response.mensagem}`, 'error'); // Use 'mensagem'
                }
            } catch (error) {
                showFeedback('Erro de comunicação com o servidor.', 'error');
                console.error("[Sugestão] Erro na chamada do eel:", error);
            }
        });
    }
});

if (window.eel) {
    eel.expose(function update_progress(data) {
        if (data && data.macro_concluida) {
            const toast = document.getElementById('notificacaoMacroToast');
            if (!toast || !toast.classList.contains('visible')) {
                mostrarToast('Macro Consulta Geral foi finalizada com êxito.');
                sessionStorage.setItem('toastVisivel', 'true');
            }
        }
    }, 'update_progress');
}

window.addEventListener('storage', function(event) {
    if (event.key === 'macroFinalizada' && event.newValue === 'true') {
        const toast = document.getElementById('notificacaoMacroToast');
        if (!toast || !toast.classList.contains('visible')) {
            mostrarToast('Macro Consulta Geral foi finalizada com êxito.');
            sessionStorage.setItem('toastVisivel', 'true');
        }
        localStorage.setItem('macroFinalizada', 'false');
    }
});

// Ao carregar a página, se o toast está marcado como visível, mostra (sem reiniciar animação)
document.addEventListener('DOMContentLoaded', function() {
    const toast = document.getElementById('notificacaoMacroToast');
    if (sessionStorage.getItem('toastVisivel') === 'true' && toast && !toast.classList.contains('visible')) {
        mostrarToast('Macro Consulta Geral foi finalizada com êxito.');
    }
});

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