// Transição de rolagem macro

document.addEventListener('DOMContentLoaded', function() {
    const triggers = document.querySelectorAll('.left-div > h1[id$="-trigger"]');

    triggers.forEach(trigger => {
        trigger.addEventListener('click', function() {
            const contentId = this.id.replace('-trigger', '-content');
            const contentElement = document.getElementById(contentId);

            if (contentElement) {
                contentElement.classList.toggle('expanded');
            }
        });
    });
});

function mostrarmacro(){
    const macro = document.getElementById('macro');
    const macrosite = document.getElementById('macrosite');

    console.log("Elemento 'macro' encontrado:", macro);
    console.log("Elemento 'macrosite' encontrado:", macrosite);

    if (macro && macrosite) {
        macrosite.style.display = 'block';
    } else {
        console.error("Um ou ambos os elementos com IDs 'macro' ou 'macrosite' não foram encontrados.");
    }
}

function fecharsite() {
    const fecharBotao = document.getElementById('fecharsite');
    const macrositeDiv = document.getElementById('macrosite');
    const loginInput = document.getElementById('login2');
    const senhaInput = document.getElementById('password2');
    const arquivoCsvInput = document.getElementById('arquivo-csv'); // Seleciona o input de arquivo

    if (fecharBotao && macrositeDiv && loginInput && senhaInput && arquivoCsvInput) {
        macrositeDiv.style.display = 'none';
        loginInput.value = ''; // Limpa o valor do campo de login
        senhaInput.value = ''; // Limpa o valor do campo de senha
        arquivoCsvInput.value = ''; // Limpa o valor do campo de arquivo
    } else {
        console.error("Um ou mais elementos com IDs 'fecharsite', 'macrosite', 'login2', 'password2' ou 'arquivo-csv' não foram encontrados.");
    }
}

function deslogar() {
    const deslog = document.getElementById('deslog');

    if (deslog) {
        window.location.href = './login.html'; // Tente com './'
        // Ou tente com:
        // window.location.href = '/index.html';
    } else {
        console.error("Elemento com ID 'deslog' não encontrado.");
    }
}


function obterParametroDaURL(nome) {
    nome = nome.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp('[?&]' + nome + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(window.location.href);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

window.onload = function() {
    const identificadorUsuario = obterParametroDaURL('identificador');
    const nomeUsuarioElement = document.getElementById('nome-usuario');

    if (identificadorUsuario && nomeUsuarioElement) {
        nomeUsuarioElement.textContent = identificadorUsuario;
    }
};

function atualizarHorarioAtual() {
    const horarioAtualElement = document.getElementById('horario-atual');
    if (horarioAtualElement) {
        const agora = new Date();
        const horas = agora.getHours().toString().padStart(2, '0');
        const minutos = agora.getMinutes().toString().padStart(2, '0');
        const segundos = agora.getSeconds().toString().padStart(2, '0');

        const dia = agora.getDate().toString().padStart(2, '0');
        const mes = (agora.getMonth() + 1).toString().padStart(2, '0'); // Adiciona 1 ao mês e formata para dois dígitos
        const ano = agora.getFullYear();

        // O primeiro filho (childNodes[0]) é a tag <img>
        // O segundo filho (childNodes[1]) é o nó de texto "Horario atual"
        if (horarioAtualElement.childNodes.length > 1 && horarioAtualElement.childNodes[1].nodeType === 3) {
            horarioAtualElement.childNodes[1].textContent = ` ${dia}/${mes}/${ano} - ${horas}:${minutos}:${segundos} `;
        } else {
            console.error("Estrutura do h3 'horario-atual' não esperada.");
        }
    }
}

// Atualiza o horário imediatamente ao carregar a página
atualizarHorarioAtual();

// Atualiza o horário a cada segundo (opcional, para um relógio dinâmico)
setInterval(atualizarHorarioAtual, 1000);


//Carregar o arquivo da macro

document.addEventListener('DOMContentLoaded', function() {
    async function lerArquivoSelecionado() {
        const arquivoInput = document.getElementById('arquivo-csv');
        const arquivo = arquivoInput.files[0];
        const loginUsuarioInput = document.getElementById('login2');
        const senhaUsuarioInput = document.getElementById('password2');
        const loginUsuario = loginUsuarioInput.value;
        const senhaUsuario = senhaUsuarioInput.value;
        const siteProssDiv = document.getElementById('sitepross2');
        const macrositeDiv = document.getElementById('macrosite');
        if (arquivo && loginUsuario && senhaUsuario) {
            try {
                const leitor = new FileReader();
                leitor.onload = async function(evento) {
                    const conteudoCSV = evento.target.result;
                    // Passe o loginUsuario e senhaUsuario como argumentos adicionais
                    console.log('Conteúdo CSV:', conteudoCSV);
                    console.log('Login Usuário:', loginUsuario);
                    console.log('Senha Usuário:', senhaUsuario);
                    macrositeDiv.style.display = 'none';
                    siteProssDiv.style.display = 'block';
                    const resultadoPython = await eel.iniciar_macro_com_arquivo(conteudoCSV, loginUsuario, senhaUsuario)();
                    console.log('Resultado da macro:', resultadoPython);
                    alert(resultadoPython);
                };
                leitor.onerror = function(evento) {
                    console.error('Erro ao ler o arquivo:', evento.target.error);
                    alert('Erro ao ler o arquivo CSV.');
                };
                leitor.readAsText(arquivo, 'UTF-8');
            } catch (erro) {
                console.error('Ocorreu um erro:', erro);
                alert('Ocorreu um erro ao processar o arquivo.');
            }
        } else {
            alert('Por favor, selecione um arquivo CSV e faça login.');
        }
    }

    // Exponha a função ao escopo global para que o onclick no HTML possa encontrá-la
    window.lerArquivoSelecionado = lerArquivoSelecionado;
});

// fechar site 2

function fecharsite2() {
    const siteProssDiv = document.getElementById('sitepross2');
    const fecharBotao2 = document.getElementById('fecharsite2'); // Pegando o botão de fechar específico desta div

    if (siteProssDiv && fecharBotao2) {
        siteProssDiv.style.display = 'none';
    } else {
        console.error("Um ou ambos os elementos com IDs 'sitepross2' ou 'fecharsite2' não foram encontrados.");
    }
}


// atualizar OS
document.addEventListener('DOMContentLoaded', function() {
    async function atualizar_status_os(id_os, item_atual, total_itens, porcentagem, tempo_estimado) { // Recebe 'tempo_estimado'
        console.log('Atualizando status:', id_os, item_atual, total_itens, 'Porcentagem:', porcentagem, 'Tempo Estimado:', tempo_estimado);
        const osElement = document.getElementById('os-processando');
        const contadorElement = document.querySelector('#sitepross2 h3:nth-child(4)');
        const porcentagemConcluidaElement = document.getElementById('porcentagem-concluida');
        const tempoEstimadoElement = document.querySelector('#sitepross2 h3:nth-child(6)'); // Ajuste o seletor se necessário

        if (osElement) {
            osElement.innerText = `OS: ${id_os}`;
        } else {
            console.error("Elemento <h3> com ID 'os-processando' não encontrado.");
        }

        if (contadorElement) {
            contadorElement.textContent = `${item_atual} de ${total_itens}`;
        } else {
            console.error("Elemento <h3> para contador não encontrado.");
        }

        if (porcentagemConcluidaElement && porcentagem !== -1) {
            porcentagemConcluidaElement.textContent = `${porcentagem}%`;
        } else if (!porcentagemConcluidaElement) {
            console.error("Elemento <h3> com ID 'porcentagem-concluida' não encontrado.");
        }

        if (tempoEstimadoElement) {
            tempoEstimadoElement.textContent = `Tempo estimado: ${tempo_estimado}`;
        } else {
            console.error("Elemento <h3> para tempo estimado não encontrado.");
        }
    }

    eel.expose(atualizar_status_os, 'atualizar_status_os');
});

// Pausar macro

let macroPausada = false; // Variável para rastrear o estado de pausa

function pausarMacro() {
    macroPausada = !macroPausada; // Inverte o estado de pausa
    const pausarBotao = document.getElementById('btnpause');

    if (pausarBotao) {
        if (macroPausada) {
            pausarBotao.textContent = 'Continuar';
            eel.pausar_macro_backend()(); // Chama a função Python para pausar
        } else {
            pausarBotao.textContent = 'Pausar';
            console.log("Chamando eel.continuar_macro_backend()"); // ADICIONE ESTE LOG
            eel.continuar_macro_backend()(); // Chama a função Python para continuar
        }
    } else {
        console.error("Elemento com classe 'h2p' (botão Pausar) não encontrado.");
    }
}

// mostrar erro no login function mostrarErroLogin() {

    function mostrarErroLogin() {
        alert("Erro no login detectado no servidor!");
        // Ou você pode atualizar um elemento HTML específico para mostrar o erro
        const statusLoginDiv = document.getElementById('status-login');
        if (statusLoginDiv) {
            statusLoginDiv.textContent = 'Login ou senha incorretos. Verifique e tente novamente.';
            statusLoginDiv.style.color = 'red';
        }
    }


// Mostrar PopUP

function fecharPopup() {
    const fecharBotao = document.getElementById('fecharPopup');
    const processandosite = document.getElementById('sitepross2');
    const erropopup = document.getElementById('sitepopup');

    if (fecharBotao) {
        processandosite.style.display = 'none';
        erropopup.style.display = 'block';
    } else {
        console.error("Um ou mais elementos com IDs 'fecharsite', 'macrosite', 'login2', 'password2' ou 'arquivo-csv' não foram encontrados.");
    }
}

function voltarParaProcessar() {
    const fecharBotao = document.getElementById('voltarbnt');
    const processandosite = document.getElementById('sitepross2');
    const erropopup = document.getElementById('sitepopup');

    if (fecharBotao) {
        erropopup.style.display = 'none';
        processandosite.style.display = 'block';
    } else {
        console.error("Um ou mais elementos com IDs 'fecharsite', 'macrosite', 'login2', 'password2' ou 'arquivo-csv' não foram encontrados.");
    }
}

// para a macro de vez

function confirmarFecharAplicacao() {
    console.log("Usuário confirmou o fechamento da aplicação e a interrupção da macro.");
    eel.parar_macro_backend()(); // Chama uma função Python para parar a macro
    // Opcional: Esconder o popup após a confirmação
    const sitePopup = document.getElementById('sitepopup');
    const loginInput = document.getElementById('login2');
    const senhaInput = document.getElementById('password2');
    const arquivoCsvInput = document.getElementById('arquivo-csv'); // Seleciona o input de arquivo
    if (sitePopup) {
        sitePopup.style.display = 'none';
        loginInput.value = ''; // Limpa o valor do campo de login
        senhaInput.value = ''; // Limpa o valor do campo de senha
        arquivoCsvInput.value = ''; // Limpa o valor do campo de arquivo
    }
    // Opcional: Lógica adicional no frontend após a confirmação
}
