document.addEventListener('DOMContentLoaded', function() {
    const formContainer = document.getElementById('carregandocerto');

    // Lógica para animar a entrada do formulário
    if (formContainer) {
        // Usa requestAnimationFrame para garantir que o estado inicial do CSS seja aplicado
        // antes de adicionar a classe que inicia a transição.
        requestAnimationFrame(() => {
             // Um pequeno setTimeout adicional pode dar mais robustez em alguns navegadores
             setTimeout(() => {
                 formContainer.classList.add('is-visible');
                 console.log("Animação de entrada do formulário acionada.");
             }, 50); // Pequeno atraso (ex: 50ms)
        });
    }

    // Adiciona a lógica para os ícones de mostrar/ocultar senha
    const passwordToggleIcons = document.querySelectorAll('.password-toggle-icon');

    passwordToggleIcons.forEach(function(icon) {
        icon.addEventListener('click', function() {
            const input = this.previousElementSibling; // Pega o input que está imediatamente antes do ícone
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);

            // Alterna a classe do ícone para mudar a aparência (opcional)
            this.classList.toggle('fa-eye'); // Ícone de olho fechado
            this.classList.toggle('fa-eye-slash'); // Ícone de olho aberto
        });
    });

    // --- Código relacionado a mostrarVerificadoEsumirSpinner e mostrarErroEsumirSpinner REMOVIDO ---
    // Incluía MutationObservers e verificações iniciais de display style.
    // Se precisar de feedback visual (spinner, etc.), implemente a lógica necessária aqui ou em outras funções.
    // --- Fim do código removido ---

    console.log("DOMContentLoaded event fully processed.");
});


function obterParametroDaURL(nome) {
    nome = nome.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp('[?&]' + nome + '(=([^&#]*)|&|#|$)');
    const results = regex.exec(window.location.href);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

// Função para salvar a nova senha - AGORA ASSÍNCRONA E CHAMA O BACKEND PYTHON
async function salvarNovaSenha() {
    console.log("Função salvarNovaSenha chamada!");

    const senhaAtual = document.getElementById('password-atual').value;
    const senhaAtualRepeat = document.getElementById('password-atual-repeat').value;
    const novaSenha = document.getElementById('password-nova').value;
    const novaSenhaRepeat = document.getElementById('password-nova-repeat').value;
    const mensagemErro = document.getElementById('mensagem-erro-troca-senha');

    // Limpa a mensagem de erro anterior no início
    if (mensagemErro) {
       mensagemErro.textContent = "";
       mensagemErro.style.display = 'none'; // Oculta a mensagem de erro inicialmente
       mensagemErro.style.color = ''; // Resetar a cor para o padrão (geralmente vermelho para erros)
    }


    // Exemplo básico de validação (mantido)
    if (senhaAtual !== senhaAtualRepeat) {
        if (mensagemErro) {
            mensagemErro.textContent = "A repetição da senha atual não coincide.";
            mensagemErro.style.display = 'block'; // Mostra a mensagem de erro
             mensagemErro.style.color = 'red'; // Garante a cor vermelha para erro
        }
        console.warn("Validação falhou: Repetição da senha atual não coincide.");
        return;
    }
    if (novaSenha !== novaSenhaRepeat) {
         if (mensagemErro) {
            mensagemErro.textContent = "A repetição da nova senha não coincide.";
            mensagemErro.style.display = 'block'; // Mostra a mensagem de erro
            mensagemErro.style.color = 'red'; // Garante a cor vermelha para erro
         }
        console.warn("Validação falhou: Repetição da nova senha não coincide.");
        return;
    }
    if (senhaAtual === novaSenha) {
         if (mensagemErro) {
             mensagemErro.textContent = "A nova senha deve ser diferente da senha atual.";
             mensagemErro.style.display = 'block'; // Mostra a mensagem de erro
             mensagemErro.style.color = 'red'; // Garante a cor vermelha para erro
         }
         console.warn("Validação falhou: Nova senha igual à senha atual.");
         return;
     }

    // Limpa a mensagem de erro e oculta se a validação passou
    if (mensagemErro) {
       mensagemErro.textContent = "";
       mensagemErro.style.display = 'none';
       mensagemErro.style.color = ''; // Resetar a cor
    }
    console.log("Validação básica passou. Senha atual (digitada): [OCULTA]", "Nova senha (digitada): [OCULTA]"); // Melhor não logar senhas

    const userId = obterParametroDaURL('user_id');
    if (!userId) {
        if (mensagemErro) {
            mensagemErro.textContent = "Erro: ID do usuário não encontrado na URL.";
            mensagemErro.style.display = 'block'; // Mostra a mensagem de erro
            mensagemErro.style.color = 'red'; // Garante a cor vermelha para erro
        }
        console.error("User ID not found in URL for password change.");
        return;
    }
    console.log("ID do usuário obtido da URL:", userId);

    const confirmButton = document.querySelector('#formulario-container button');
     if (confirmButton) {
         confirmButton.disabled = true;
         console.log("Botão 'Confirmar' desabilitado.");
     } else {
         console.warn("Botão 'Confirmar' não encontrado.");
     }


    // --- Adicionar feedback visual de carregamento aqui (opcional) ---
    // Ex: Mostrar um spinner ou mudar o texto do botão

    try {
        console.log("Chamando eel.alterar_senha_primeiro_login...");
        // A chamada assíncrona para o backend Python
        const resultadoAlteracao = await eel.alterar_senha_primeiro_login(
            userId,
            senhaAtual, // Passa a senha atual (se seu fluxo exigir validação)
            novaSenha
        )(); // O '()' final é importante para chamar a função retornada pelo await eel


        console.log("Resposta recebida de eel.alterar_senha_primeiro_login:", resultadoAlteracao);

        // --- Remover feedback visual de carregamento aqui ---

        if (resultadoAlteracao && resultadoAlteracao.status === 'success') {
            console.log("Senha alterada com sucesso no backend.");
            sessionStorage.removeItem('nomeUsuario');

            // *** Adicionar mensagem de sucesso antes de redirecionar ***
            if (mensagemErro) {
                mensagemErro.textContent = "Senha alterada com sucesso! Redirecionando...";
                mensagemErro.style.color = 'green'; // Opcional: muda a cor para verde
                mensagemErro.style.display = 'block';
            }
            console.log("Mostrando mensagem de sucesso e preparando redirecionamento.");


            // Redireciona após um pequeno atraso para permitir que o usuário veja a mensagem
            setTimeout(() => {
                // Redireciona para a página principal e sinaliza que o primeiro login foi concluído
                // Ajuste 'index.html' ou 'macros.html' para a URL correta
                console.log("Redirecionando para index.html...");
                window.location.href = `index.html?first_login_complete=true&user_id=${encodeURIComponent(userId)}`;
                // OU (descomente a linha correta que você usa)
                // window.location.href = `macros.html?first_login_complete=true&user_id=${encodeURIComponent(userId)}`;
            }, 2000); // Atraso de 2 segundos (2000 milissegundos)


        } else if (resultadoAlteracao && resultadoAlteracao.status === 'incorrect_current_password') {
            if (mensagemErro) {
                mensagemErro.textContent = "A senha atual fornecida está incorreta.";
                mensagemErro.style.display = 'block'; // Mostra a mensagem de erro
                 mensagemErro.style.color = 'red'; // Garante a cor vermelha para erro
            }
            console.warn("Falha ao alterar senha: Senha atual incorreta.");
        } else if (resultadoAlteracao && resultadoAlteracao.status === 'db_error') {
             if (mensagemErro) {
                 mensagemErro.textContent = "Ocorreu um erro no banco de dados ao salvar a senha.";
                 mensagemErro.style.display = 'block'; // Mostra a mensagem de erro
                 mensagemErro.style.color = 'red'; // Garante a cor vermelha para erro
             }
             console.error("Erro DB ao alterar senha:", resultadoAlteracao);
        } else if (resultadoAlteracao && resultadoAlteracao.status === 'internal_error') {
             if (mensagemErro) {
                 mensagemErro.textContent = "Ocorreu um erro interno no servidor. Tente novamente.";
                 mensagemErro.style.display = 'block'; // Mostra a mensagem de erro
                 mensagemErro.style.color = 'red'; // Garante a cor vermelha para erro
             }
             console.error("Erro interno ao alterar senha:", resultadoAlteracao);
        } else {
             // Tratar casos onde resultadoAlteracao é null, undefined ou tem um status inesperado
             const statusDesconhecido = resultadoAlteracao ? resultadoAlteracao.status : 'Desconhecido';
             if (mensagemErro) {
                 mensagemErro.textContent = `Ocorreu um erro inesperado ao processar sua solicitação (Status: ${statusDesconhecido}).`;
                 mensagemErro.style.display = 'block'; // Mostra a mensagem de erro
                 mensagemErro.style.color = 'red'; // Garante a cor vermelha para erro
             }
             console.error("Resposta inesperada do backend:", resultadoAlteracao);
        }

    } catch (error) {
        // Este bloco é executado se a chamada Eel falhar completamente (ex: Python crash, comunicação perdida)
        if (mensagemErro) {
             mensagemErro.textContent = "Erro de comunicação com o servidor. Verifique o console para mais detalhes.";
             mensagemErro.style.display = 'block'; // Mostra a mensagem de erro
             mensagemErro.style.color = 'red'; // Garante a cor vermelha para erro
        }
        console.error("Erro na chamada Eel para alterar senha:", error);
        // Se o erro for um objeto de erro do JavaScript, pode ter mais informações em error.message ou error.stack
        if (error instanceof Error) {
            console.error("Detalhes do erro:", error.message, error.stack);
        }
    } finally {
         // Reabilita o botão 'Confirmar' aconteça o que acontecer (exceto se redirecionar)
         // Adicionar um pequeno delay antes de reabilitar o botão pode ser útil para o usuário ver a mensagem
         // Ajustei para só reabilitar se não houver redirecionamento pendente
         setTimeout(() => {
             // Verifica se a página atual ainda é a de primeiro login antes de reabilitar o botão
             if (confirmButton && window.location.href.includes('firstlogin.html')) {
                  confirmButton.disabled = false;
                   console.log("Botão 'Confirmar' reabilitado.");
             }
         }, 500); // Atraso de 500ms antes de verificar e reabilitar

    }
}

// ANIMACAO CONFETES

  function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    // Função para iniciar o efeito de confetes
    function startConfetti() {
        const duration = 60 * 60 * 1000; // 1 hora
        const animationEnd = Date.now() + duration;
        const defaults = {
            startVelocity: 10, // Velocidade reduzida
            spread: 360,
            ticks: 30, // Ticks aumentados para suavizar o efeito
            zIndex: 0
        };

        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 100 * (timeLeft / duration); // Reduzido o número de partículas

            // Confetes caindo de posições aleatórias
            confetti({
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
                spread: 360,
                startVelocity: 10,  // Velocidade mais baixa
                ticks: 30,  // Aumentar os ticks para um efeito mais suave
                zIndex: 0
            });

            confetti({
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
                spread: 360,
                startVelocity: 10,  // Velocidade mais baixa
                ticks: 30,  // Aumentar os ticks para um efeito mais suave
                zIndex: 0
            });
        }, 100); // Aumentando o intervalo entre as explosões para diminuir a frequência
    }

    // Inicia o efeito ao carregar a página
    window.onload = function () {
        startConfetti();
    };