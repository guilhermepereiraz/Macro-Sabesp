document.addEventListener('DOMContentLoaded', function() {
    async function lerArquivoSelecionado() {
        const arquivoInput = document.getElementById('arquivo-csv');
        const arquivo = arquivoInput.files[0];
        const loginUsuarioInput = document.getElementById('login2');
        const senhaUsuarioInput = document.getElementById('password2');
        const loginUsuario = loginUsuarioInput.value;
        const senhaUsuario = senhaUsuarioInput.value;

        if (arquivo && loginUsuario && senhaUsuario) {
            try {
                const leitor = new FileReader();
                leitor.onload = async function(evento) {
                    const conteudoCSV = evento.target.result;
                    // Passe o loginUsuario e senhaUsuario como argumentos adicionais
                    console.log('Conteúdo CSV:', conteudoCSV);
                    console.log('Login Usuário:', loginUsuario);
                    console.log('Senha Usuário:', senhaUsuario);
                    const resultadoPython = await eel.iniciar_macro_multi_thread(conteudoCSV, loginUsuario, senhaUsuario)();
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
    const pausarBotao = document.querySelector('.h2p'); // Seleciona o botão "Pausar"

    if (pausarBotao) {
        if (macroPausada) {
            pausarBotao.textContent = 'Continuar';
            eel.pausar_macro_backend()(); // Chama a função Python para pausar
        } else {
            pausarBotao.textContent = 'Pausar';
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