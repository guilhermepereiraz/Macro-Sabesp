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

// Função para salvar a nova senha
async function salvarNovaSenha() {
    const senhaAtual = document.getElementById('password-atual').value;
    const senhaAtualRepeat = document.getElementById('password-atual-repeat').value;
    const novaSenha = document.getElementById('password-nova').value;
    const novaSenhaRepeat = document.getElementById('password-nova-repeat').value;
    const mensagemErro = document.getElementById('mensagem-erro-troca-senha');

    // Limpa mensagens de erro anteriores
    mensagemErro.textContent = '';
    mensagemErro.style.color = 'red';

    // Verifica se a senha atual e a repetição são iguais
    if (senhaAtual !== senhaAtualRepeat) {
        mensagemErro.textContent = 'A senha atual e a repetição não coincidem.';
        return;
    }

    // Verifica se a nova senha e a repetição são iguais
    if (novaSenha !== novaSenhaRepeat) {
        mensagemErro.textContent = 'A nova senha e a repetição não coincidem.';
        return;
    }

    // Verifica se a nova senha é diferente da senha atual
    if (senhaAtual === novaSenha) {
        mensagemErro.textContent = 'A nova senha deve ser diferente da senha atual.';
        return;
    }

    try {
        // Chama o backend para salvar a nova senha
        const userId = obterParametroDaURL('identificador');
        const response = await eel.alterar_senha_primeiro_login(userId, senhaAtual, novaSenha)();
        if (response.status === 'success') {
            mensagemErro.textContent = 'Senha alterada com sucesso, redirecionando...';
            mensagemErro.style.color = 'green';

            // Atualiza o último login antes de redirecionar
            await eel.atualizar_ultimo_login()();

            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000); // Redireciona após 2 segundos
        } else {
            mensagemErro.textContent = response.message || 'Erro ao alterar a senha. Tente novamente mais tarde.';
        }
    } catch (error) {
        mensagemErro.textContent = 'Erro ao comunicar com o servidor. Tente novamente mais tarde.';
        console.error('[firstlogin.js] Erro ao salvar nova senha:', error);
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

        const particleCount = 20 * (timeLeft / duration); // Reduzido o número de partículas

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