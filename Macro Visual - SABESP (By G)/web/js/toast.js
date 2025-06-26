// toast.js - Centraliza a lógica do toast de notificação cross-tab

function mostrarToast(mensagem = 'Macro Consulta Geral foi finalizada com êxito.') {
    const toast = document.getElementById('notificacaoMacroToast');
    if (toast) {
        // Se já está visível, só mantém, não reinicia animação
        if (toast.classList.contains('visible')) {
            // Atualiza a mensagem se for diferente
            const msg = toast.querySelector('.toast-message');
            if (msg && msg.textContent !== mensagem) msg.textContent = mensagem;
            return;
        }
        const msg = toast.querySelector('.toast-message');
        if (msg) msg.textContent = mensagem;
        toast.classList.remove('visible');
        // Força reflow para reiniciar a animação
        void toast.offsetWidth;
        toast.classList.add('visible');
        // Marca no sessionStorage que o toast está visível
        sessionStorage.setItem('toastVisivel', 'true');
    }
}

function fecharToast() {
    const toast = document.getElementById('notificacaoMacroToast');
    if (toast) {
        toast.classList.remove('visible');
        // Remove o flag do sessionStorage
        sessionStorage.removeItem('toastVisivel');
    }
}

// Listener para eventos cross-tab via localStorage
window.addEventListener('storage', function(event) {
    if (event.key === 'macroFinalizada' && event.newValue === 'true') {
        mostrarToast();
        // Limpa o evento para evitar múltiplos disparos
        localStorage.setItem('macroFinalizada', 'false');
    }
});

// Permite disparar o toast manualmente para testes
window.testarToast = function() {
    mostrarToast();
};

async function viewResultsFolder() {
    console.log("Solicitando abertura da pasta de resultados...");
    try {
        const result = await eel.open_results_folder()(); // Chama a função Python exposta
        
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

// Exibe o toast se o flag estiver ativo ao carregar a página (persistência até fechar)
window.addEventListener('DOMContentLoaded', function() {
    const toast = document.getElementById('notificacaoMacroToast');
    if (sessionStorage.getItem('toastVisivel') === 'true' && toast && !toast.classList.contains('visible')) {
        mostrarToast();
    }
});

// Exemplo: para disparar manualmente, execute no console: window.testarToast();
