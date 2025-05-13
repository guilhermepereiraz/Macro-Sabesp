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
window.onload = async function () { // Mude para async function para usar await
    console.log("[macros.js] window.onload iniciado.");
    // Obtém o elemento onde o nome do usuário será exibido
    const nomeUsuarioElement = document.getElementById('nome-usuario');
    let identificadorUsuario = null; // Inicializa como null

    // 1. Tenta obter o identificador do parâmetro 'identificador' da URL (para logins normais)
    const identificadorUsuarioDaURL = obterParametroDaURL('identificador');

    // 2. Tenta obter o user_id e o flag first_login_complete da URL (para redirecionamento do primeiro login)
    const userIdFromUrl = obterParametroDaURL('user_id');
    const firstLoginComplete = obterParametroDaURL('first_login_complete');

    console.log("[macros.js] Valor de identificadorUsuarioDaURL:", identificadorUsuarioDaURL);
    console.log("[macros.js] Valor de userIdFromUrl:", userIdFromUrl);
    console.log("[macros.js] Valor de firstLoginComplete:", firstLoginComplete);
    console.log("[macros.js] Elemento nomeUsuarioElement:", nomeUsuarioElement);


    if (identificadorUsuarioDaURL) {
        // Se o parâmetro 'identificador' está na URL (login normal), usa ele
        identificadorUsuario = identificadorUsuarioDaURL;
         // Armazena no storage para manter a sessão
        sessionStorage.setItem('nomeUsuario', identificadorUsuario);
        console.log("[macros.js] Nome do usuário obtido da URL (identificador) e armazenado em sessionStorage.");

    } else if (userIdFromUrl && firstLoginComplete === 'true') {
         // Se o parâmetro 'user_id' e 'first_login_complete=true' estão na URL (redirecionamento do primeiro login)
         console.log("[macros.js] Redirecionado do primeiro login. Obtendo nome do usuário por ID...");
         try {
             // Chama a nova função Python para obter o nome pelo ID
             // Certifique-se de que a função Eel `get_username_by_id` está exposta no Python.
             const resultadoNome = await eel.get_username_by_id(userIdFromUrl)();
             console.log("[macros.js] Resultado get_username_by_id:", resultadoNome);

             if (resultadoNome && resultadoNome.status === 'success') {
                 identificadorUsuario = resultadoNome.username; // Obtém o nome do resultado (coluna 'nome')
                 // Armazena no storage APÓS OBTER PELO ID
                 sessionStorage.setItem('nomeUsuario', identificadorUsuario);
                 console.log("[macros.js] Nome do usuário obtido por ID e armazenado em sessionStorage.");
             } else {
                 console.error("[macros.js] Falha ao obter nome do usuário por ID:", resultadoNome);
                 // Opcional: Tratar erro, talvez exibir um nome padrão ou redirecionar para login
                 // identificadorUsuario = "Erro ao carregar nome";
             }
         } catch (error) {
             console.error("[macros.js] Erro na chamada Eel para get_username_by_id:", error);
             // Opcional: Tratar erro de comunicação
             // identificadorUsuario = "Erro de comunicação";
         }

    } else {
        // Se nenhum dos parâmetros de URL relevantes está presente, tenta obter do sessionStorage (para recarregamentos ou navegação interna)
        identificadorUsuario = sessionStorage.getItem('nomeUsuario');
        if (identificadorUsuario) {
             console.log("[macros.js] Nome do usuário obtido do sessionStorage (fallback).");
        } else {
             console.log("[macros.js] Nome do usuário não encontrado em URL ou sessionStorage. Usuário pode não estar logado.");
             // Opcional: Redirecionar para a página de login se não houver identificador
             // window.location.href = 'login.html';
        }
    }

    // Finalmente, atualiza o elemento HTML se um identificador foi obtido
    if (identificadorUsuario && nomeUsuarioElement) {
        nomeUsuarioElement.textContent = identificadorUsuario;
        console.log("[macros.js] Nome do usuário exibido:", identificadorUsuario);
    } else if (nomeUsuarioElement) {
         // Se não conseguiu obter o nome, limpa ou define um texto padrão
         nomeUsuarioElement.textContent = "Usuário Padrão"; // Texto padrão se não logado ou erro
         console.log("[macros.js] Nome do usuário não atualizado. Identificador nulo ou elemento não encontrado. Exibindo padrão.");
    }


    // Chamadas para funções que agora devem estar definidas ANTES de window.onload
     if (typeof iniciarTransicaoPagina === 'function') {
         iniciarTransicaoPagina(); // Inicia a animação de transição da página
         console.log("[macros.js] iniciarTransicaoPagina chamada.");
     } else {
         console.error("[macros.js] Função iniciarTransicaoPagina não definida.");
     }

     if (typeof atualizarHorarioAtual === 'function') {
         atualizarHorarioAtual(); // Exibe o horário inicial
         console.log("[macros.js] atualizarHorarioAtual chamada.");
     } else {
         console.error("[macros.js] Função atualizarHorarioAtual não definida.");
     }

     // Certifique-se de que o setInterval para atualizar o horário também esteja configurado corretamente.
     if (typeof atualizarHorarioAtual === 'function') {
         setInterval(atualizarHorarioAtual, 1000); // Atualiza o horário a cada segundo
         console.log("[macros.js] setInterval para atualizarHorarioAtual configurado.");
     }


    console.log("[macros.js] window.onload finalizado.");
};

// Definir o DOMContentLoaded listener para inicializações que dependem do DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log("[macros.js] DOMContentLoaded iniciado.");
    const mainContent = document.querySelector('main.container');

    if (mainContent) {
        mainContent.classList.add('page-intro');
        setTimeout(() => {
            mainContent.classList.remove('page-intro');
            console.log("[macros.js] Transição de intro da página removida.");
        }, 30);
    } else {
        console.warn("[macros.js] Elemento main.container não encontrado para transição de intro.");
    }

     // Funções que manipulam o DOM e são chamadas DENTRO do DOMContentLoaded
     // Mantenha-as aqui se elas forem chamadas APENAS dentro deste listener.
     // Se forem chamadas de fora, suas definições precisam ser no escopo global.
     /*
     const triggers = document.querySelectorAll('.left-div > h1[id$="-trigger"]');
     triggers.forEach(trigger => {
         trigger.addEventListener('click', function () {
             const contentId = this.id.replace('-trigger', '-content');
             const contentElement = document.getElementById(contentId);
             if (contentElement) {
                 contentElement.classList.toggle('expanded');
             }
         });
     });
     */

     console.log("[macros.js] DOMContentLoaded finalizado.");
});


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


// >>> Funções relacionadas à Macro Consulta Geral (movidas para macros.js) <<<
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