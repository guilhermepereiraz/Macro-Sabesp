// Substitua a sua função mostrarToast() em js/toast.js por esta versão:

/**
 * Mostra a notificação (toast).
 * @param {string} mensagem - A mensagem a ser exibida.
 * @param {boolean} comAnimacao - Se true, exibe com a animação de entrada. Se false, exibe instantaneamente.
 */
function mostrarToast(mensagem = 'Macro Consulta Geral foi finalizada com êxito.', comAnimacao = true) {
    const toast = document.getElementById('notificacaoMacroToast');
    if (toast) {
        const msg = toast.querySelector('.toast-message');
        if (msg) msg.textContent = mensagem;

        if (comAnimacao) {
            // Se for para animar, garantimos que a classe .no-animation seja removida.
            toast.classList.remove('no-animation');
            toast.classList.remove('visible');
            void toast.offsetWidth; // Força o reflow para a animação funcionar
            
        } else {
            // Se NÃO for para animar a entrada:
            toast.classList.add('no-animation'); // 1. Desativa a animação
        }

        // Em ambos os casos, tornamos o toast visível
        toast.classList.add('visible');
        
        // Se a entrada foi sem animação, reativamos as transições para a SAÍDA.
        if (!comAnimacao) {
            // Usamos um pequeno timeout para garantir que o navegador processe
            // a exibição instantânea antes de reativar as transições.
            setTimeout(() => {
                toast.classList.remove('no-animation'); // 2. Reativa a animação para o futuro
            }, 50); // 50ms é um tempo seguro e imperceptível
        }

        // Salva no sessionStorage para que ele persista entre as páginas
        sessionStorage.setItem('toastVisivel', 'true');
    }
}

function fecharToast() {
    const toast = document.getElementById('notificacaoMacroToast');
    if (toast) {
        toast.classList.remove('visible');
        // Limpa a memória da sessão ao fechar
        sessionStorage.removeItem('toastVisivel');
    }
}

// Listener para o gatilho inicial (quando a macro termina)
// Este sempre chamará a função COM ANIMAÇÃO.
window.addEventListener('storage', function(event) {
    if (event.key === 'macroFinalizada' && event.newValue === 'true') {
        mostrarToast('Macro Consulta Geral foi finalizada com êxito.', true); // true = com animação
        localStorage.setItem('macroFinalizada', 'false'); // Limpa o gatilho
    }
});

// Listener para quando uma nova página é carregada
// Este sempre chamará a função SEM ANIMAÇÃO.
window.addEventListener('DOMContentLoaded', function() {
    if (sessionStorage.getItem('toastVisivel') === 'true') {
        const toast = document.getElementById('notificacaoMacroToast');
        // Mostra o toast se ele estiver na memória da sessão, mas sem animar
        if (toast && !toast.classList.contains('visible')) {
            mostrarToast('Macro Consulta Geral foi finalizada com êxito.', false); // false = sem animação
        }
    }
});


// Função para o botão "Ver Resultados" (código que você já tinha)
async function viewResultsFolderPop() {
    console.log("Solicitando abertura da pasta de resultados...");
    const toast = document.getElementById('notificacaoMacroToast');

    if (toast) {
        toast.classList.remove('visible');
        sessionStorage.removeItem('toastVisivel');
    }

    if (window.eel) {
        try {
            await eel.open_results_folder()();
            console.log("Comando para abrir pasta enviado com sucesso.");
            
        } catch (error) {
            console.error("Erro ao tentar chamar eel.open_results_folder():", error);
            alert("Ocorreu um erro ao tentar abrir a pasta de resultados.");
        }
    } else {
        alert("A conexão com o backend (Eel) não está disponível.");
    }
}

/**
 * Fecha o toast com animação e, em seguida, navega para uma nova URL.
 * Impede a navegação padrão para dar tempo para a animação ser concluída.
 * @param {Event} event - O evento de clique do mouse.
 * @param {string} url - A URL para a qual navegar após a animação.
 */
function fecharToastENavegar(event, url) {
    // 1. Impede que o link navegue para a URL imediatamente
    event.preventDefault();

    const toast = document.getElementById('notificacaoMacroToast');
    if (toast) {
        // 2. Remove a classe 'visible' para iniciar a animação de saída
        toast.classList.remove('visible');
        sessionStorage.removeItem('toastVisivel');

        // 3. Aguarda a animação terminar (ex: 400ms) e SÓ DEPOIS navega
        //    (O tempo deve ser igual ao 'transition-duration' do seu CSS para o toast)
        setTimeout(() => {
            window.location.href = url;
        }, 400); // Ajuste este valor se a sua animação for mais longa ou curta
    }
}

// --- Fim do NOVO código para js/toast.js ---