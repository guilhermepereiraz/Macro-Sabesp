// clique no botao fixo

function abrirDuvida() {
    const divduvida = document.getElementById("overlayText");
    const transp = document.getElementById("transp");

    if (!divduvida || !transp) {
        console.error("Erro: Elementos overlayText ou transp nao encontrados!");
        return;
    }

    // Alterna as classes para animar
    const aberto = divduvida.classList.contains("active");
    if (!aberto) {
        divduvida.classList.add("active");
        transp.classList.add("active");
    } else {
        divduvida.classList.remove("active");
        transp.classList.remove("active");
    }
}

// Opcional: fechar ao clicar no fundo escuro
document.addEventListener("DOMContentLoaded", function () {
    const transp = document.getElementById("transp");
    const divduvida = document.getElementById("overlayText");
    if (transp) {
        transp.addEventListener("click", function () {
            divduvida.classList.remove("active");
            transp.classList.remove("active");
        });
    }
});

// AQUI É ONDE VOCÊ DEVE ADICIONAR A LINHA PARA FORÇAR O IDIOMA
var Tawk_API = Tawk_API || {}, Tawk_LoadStart = new Date();
// -->> ADICIONE A LINHA ABAIXO AQUI <<--
Tawk_API.customisation = {
    'language': 'pt-BR'
};
(function () {
    var s1 = document.createElement("script"), s0 = document.getElementsByTagName("script")[0];
    s1.async = true;
    s1.src = 'https://embed.tawk.to/68290321e9a0a8190cd25408/1irg38f62';
    s1.charset = 'UTF-8';
    s1.setAttribute('crossorigin', '*');
    s0.parentNode.insertBefore(s1, s0);
})();

let tawkInterval = setInterval(esconderTawkTo, 200);

function esconderTawkTo() {
    // Esconde todos os iframes do Tawk.to (chat e botão)
    document.querySelectorAll('iframe[title="chat widget"], iframe[src*="tawk.to"]').forEach(function (iframe) {
        iframe.style.display = "none";
    });
}

function mostrarTawkTo() {
    // Esconde overlay, fundo escuro e botão fixo
    document.getElementById("overlayText")?.classList.remove("active");
    document.getElementById("transp")?.classList.remove("active");
    document.getElementById("fixedButton")?.style.setProperty("display", "none", "important");

    // Para de esconder o chat
    clearInterval(tawkInterval);
    // Mostra todos os iframes do Tawk.to
    document.querySelectorAll('iframe[title="chat widget"], iframe[src*="tawk.to"]').forEach(function (iframe) {
        iframe.style.display = "";
    });
    // Abre o chat
    if (window.Tawk_API) {
        Tawk_API.maximize();
    }
}

var Tawk_API = Tawk_API || {};
Tawk_API.onChatMinimized = function () {
    // Esconde o chat novamente
    document.querySelectorAll('iframe[title="chat widget"], iframe[src*="tawk.to"]').forEach(function (iframe) {
        iframe.style.display = "none";
    });
    // Mostra o botão fixo
    document.getElementById("fixedButton")?.style.setProperty("display", "", "important");
};

window.addEventListener('DOMContentLoaded', function () {
    const toast = document.getElementById('notificacaoMacroToast');
    if (toast) {
        // Garante que a animação reinicia se recarregar
        toast.classList.remove('visible');
        setTimeout(() => {
            toast.classList.add('visible');
            setTimeout(() => {
                toast.classList.remove('visible');
            }, 10000); // 9 segundos visível
        }, 100); // pequeno delay para suavizar a entrada
    }
});