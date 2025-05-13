// MACRO SITE

// Transição de rolagem macro
document.addEventListener('DOMContentLoaded', function () {
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

    const arquivoInput = document.getElementById('arquivo-csv');
    const csvOption = document.getElementById('csvOption');
    const excelOption = document.getElementById('excelOption');
    const mensagemErroDiv = document.getElementById('mensagem-de-erro');
    const osprocessandoDiv = document.getElementById('os-processando');
    const quantidadeProcessadaDiv = document.getElementById('quantidade');
    const tempoEstimadoDiv = document.getElementById('tempoestimado');
    const porcentagemConcluidaDiv = document.getElementById('porcentagem-concluida');
    const iniciarMacroBotao = document.getElementById('iniciar-macro');
    const arquivoCSVInput = document.getElementById('arquivo-csv');


    function atualizarFiltroArquivo() {
        arquivoInput.accept = csvOption.checked ? '.csv' : (excelOption.checked ? '.xlsx, .xls' : '');
    }

    csvOption.addEventListener('change', atualizarFiltroArquivo);
    excelOption.addEventListener('change', atualizarFiltroArquivo);
    atualizarFiltroArquivo();

    function arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }


    async function lerArquivoSelecionado() {
        const arquivo = arquivoInput.files[0];
        const loginUsuario = document.getElementById('login2').value;
        const senhaUsuario = document.getElementById('password2').value;
        let tipoArquivo = csvOption.checked ? 'csv' : (excelOption.checked ? 'excel' : '');
        // Obtém o identificador (nome do usuário) do sessionStorage, pois ele deve ter sido salvo no login ou no carregamento da página
        const identificadorUsuario = sessionStorage.getItem('nomeUsuario');

        if (mensagemErroDiv) {
            mensagemErroDiv.style.display = 'none';
            mensagemErroDiv.textContent = '';
        }

        if (osprocessandoDiv) osprocessandoDiv.innerText = 'OS: ';
        if (quantidadeProcessadaDiv) quantidadeProcessadaDiv.innerText = '0 de 9999';
        if (tempoEstimadoDiv) tempoEstimadoDiv.innerText = 'Tempo estimado:';
        if (porcentagemConcluidaDiv) porcentagemConcluidaDiv.innerText = '0%';


        if (arquivo && loginUsuario && senhaUsuario && tipoArquivo && identificadorUsuario) {
            try {
                const leitor = new FileReader();
                leitor.onload = async function (evento) {
                    const conteudoArquivo = tipoArquivo === 'csv' ? evento.target.result : arrayBufferToBase64(evento.target.result);
                    const nomeArquivo = arquivo ? arquivo.name : '';

                    console.log('Tipo de Arquivo:', tipoArquivo);
                    // Esconder a tela inicial e mostrar a de processamento
                    const macrositeDiv = document.getElementById('macrosite');
                    const siteProssDiv = document.getElementById('sitepross2');
                    if (macrositeDiv) macrositeDiv.style.display = 'none';
                    if (siteProssDiv) siteProssDiv.style.display = 'block';


                    // Chama a função Python com o identificador (nome do usuário)
                    const resultadoPython = await eel.iniciar_macro_multi_thread(conteudoArquivo, loginUsuario, senhaUsuario, nomeArquivo, tipoArquivo, identificadorUsuario)();
                    console.log('Resultado da macro:', resultadoPython);

                    // Lógica para tratar o resultado e mostrar a tela final, se necessário
                     if (resultadoPython) {
                        if (resultadoPython.status === "erro") {
                             console.error("Erro do Python:", resultadoPython.mensagem);
                             if (mensagemErroDiv) {
                                 mensagemErroDiv.textContent = resultadoPython.mensagem;
                                 mensagemErroDiv.style.display = 'block';
                             } else {
                                 alert(resultadoPython.mensagem);
                             }
                             // Voltar para a tela inicial da macro se houver erro
                             if (siteProssDiv) siteProssDiv.style.display = 'none';
                             if (macrositeDiv) macrositeDiv.style.display = 'block';
                         } else if (resultadoPython.status === "sucesso") {
                             console.log("Macro processada com sucesso.");
                             // Lógica para exibir a tela de conclusão, se aplicável
                             // Supondo que há uma função para exibir a tela de conclusão
                             if (typeof exibir_conclusao_site === 'function') {
                                exibir_conclusao_site(resultadoPython); // Chama a função de exibição de conclusão
                             } else {
                                console.warn("Função exibir_conclusao_site não definida.");
                                // Se não houver tela de conclusão, voltar para a tela inicial da macro ou outra página
                                if (siteProssDiv) siteProssDiv.style.display = 'none';
                                if (macrositeDiv) macrositeDiv.style.display = 'block';
                             }
                         } else {
                             console.warn("Resposta inesperada do Python:", resultadoPython);
                             alert("Ocorreu um erro inesperado.");
                             // Voltar para a tela inicial da macro em caso de resposta inesperada
                             if (siteProssDiv) siteProssDiv.style.display = 'none';
                             if (macrositeDiv) macrositeDiv.style.display = 'block';
                         }
                     } else {
                         console.error("Nenhuma resposta do Python.");
                         alert("Erro na comunicação com o servidor.");
                         // Voltar para a tela inicial da macro em caso de falta de resposta
                         if (siteProssDiv) siteProssDiv.style.display = 'none';
                         if (macrositeDiv) macrositeDiv.style.display = 'block';
                     }

                };
                leitor.onerror = function (evento) {
                    console.error('Erro ao ler o arquivo:', evento.target.error);
                    alert('Erro ao ler o arquivo.');
                    // Voltar para a tela inicial da macro em caso de erro de leitura de arquivo
                    const macrositeDiv = document.getElementById('macrosite');
                    if (macrositeDiv) macrositeDiv.style.display = 'block';
                };
                leitor[tipoArquivo === 'csv' ? 'readAsText' : 'readAsArrayBuffer'](arquivo, 'UTF-8');
            } catch (erro) {
                console.error('Ocorreu um erro geral:', erro);
                alert('Ocorreu um erro geral ao processar o arquivo.');
                 // Voltar para a tela inicial da macro em caso de erro geral
                 const macrositeDiv = document.getElementById('macrosite');
                 if (macrositeDiv) macrositeDiv.style.display = 'block';
            }
        } else if (!arquivo) {
            mensagemErroDiv.textContent = 'Por favor, selecione um arquivo.';
            mensagemErroDiv.style.display = 'block';
            console.log('Por favor, selecione um arquivo.');
        } else if (!loginUsuario || !senhaUsuario) {
            mensagemErroDiv.textContent = 'Por favor, digite o login e a senha para continuar.';
            mensagemErroDiv.style.display = 'block';
            console.log('Por favor, digite login e senha.');
        } else if (!tipoArquivo) {
            mensagemErroDiv.textContent = 'Por favor, selecione o tipo de arquivo (CSV ou Excel).';
            mensagemErroDiv.style.display = 'block';
            console.log('Por favor, selecione o tipo de arquivo.');

        } else if (!identificadorUsuario) {
            console.error('Identificador do usuário não encontrado no sessionStorage. Redirecionando para login.');
            alert('Erro: Informações do usuário não encontradas. Faça login novamente.');
            // Redireciona se o nome do usuário não estiver no storage (deve ter sido salvo no login)
            window.location.href = './login.html';
        }
    }

    window.lerArquivoSelecionado = lerArquivoSelecionado;

    if (arquivoCSVInput) {
        arquivoCSVInput.addEventListener('change', () => {
            if (arquivoCSVInput.files.length > 0) {
                console.log('Arquivo selecionado:', arquivoCSVInput.files[0].name);
            }
        });
    }

    if (iniciarMacroBotao) {
        iniciarMacroBotao.addEventListener('click', lerArquivoSelecionado);
    }

    // --- Funções de Callback para o Backend (expostas ao Eel) ---
    // Exposição para a função de atualização de status da Macro SITE
    // Certifique-se de que a definição desta função (atualizar_status_os) está neste arquivo ou em outro arquivo JS carregado ANTES.
    eel.expose(atualizar_status_os, 'atualizar_status_os');

    // Exposição para a função de atualização de tempo restante da Macro SITE
    // Certifique-se de que a definição desta função (atualizar_tempo_restante_js) está neste arquivo ou em outro arquivo JS carregado ANTES.
    eel.expose(atualizar_tempo_restante_js, 'atualizar_tempo_restante_js');

    // Exponha a função de exibição de conclusão se ela for chamada pelo backend
    // eel.expose(exibir_conclusao_site); // Descomente se necessário e defina a função


    // --- Funções Locais (não chamadas pelo backend) ---
    // A função `atualizar_status_os` está definida aqui, mas sua exposição precisa estar correta.
     function atualizar_status_os(os_numero, total_processadas, total_a_processar, thread_id, status) {
        if (osprocessandoDiv) osprocessandoDiv.innerText = `OS: ${os_numero}`;
        if (quantidadeProcessadaDiv) quantidadeProcessadaDiv.innerText = `${total_processadas} de ${total_a_processar}`;
        if (porcentagemConcluidaDiv) {
           const porcentagem = Math.floor((total_processadas / total_a_processar) * 100);
           porcentagemConcluidaDiv.innerText = `${porcentagem}%`
        }
        console.log(`[index.js] Atualizando OS: ${os_numero}, Status: ${status}`); // Para debug
    }

    // A função `atualizar_tempo_restante_js` está definida aqui, mas sua exposição precisa estar correta.
    function atualizar_tempo_restante_js(tempo_restante) {
        if (tempoEstimadoDiv) {
            tempoEstimadoDiv.innerText = `Tempo estimado: ${tempo_restante}`;
        }
        console.log(`[index.js] Tempo restante: ${tempo_restante}`); // Para debug
    }


}); // Fim do DOMContentLoaded


// >>> Lógica para obter e exibir o nome do usuário ao carregar a página <<<
// Esta lógica deve ser executada quando a janela inteira estiver carregada
window.onload = async function () {
    console.log("[index.js] window.onload iniciado.");

    // Obtém o elemento onde o nome do usuário será exibido
    const nomeUsuarioElement = document.getElementById('nome-usuario');
    let identificadorUsuario = null; // Inicializa como null

    // Função auxiliar para obter parâmetros da URL (definida abaixo)
    // Já existe uma definição para obterParametroDaURL neste arquivo.

    // 1. Tenta obter o identificador do parâmetro 'identificador' da URL (para logins normais)
    const identificadorUsuarioDaURL = obterParametroDaURL('identificador');

    // 2. Tenta obter o user_id e o flag first_login_complete da URL (para redirecionamento do primeiro login)
    const userIdFromUrl = obterParametroDaURL('user_id');
    const firstLoginComplete = obterParametroDaURL('first_login_complete');

    console.log("[index.js] Valor de identificadorUsuarioDaURL:", identificadorUsuarioDaURL);
    console.log("[index.js] Valor de userIdFromUrl:", userIdFromUrl);
    console.log("[index.js] Valor de firstLoginComplete:", firstLoginComplete);
    console.log("[index.js] Elemento nomeUsuarioElement:", nomeUsuarioElement);


    if (identificadorUsuarioDaURL) {
        // Se o parâmetro 'identificador' está na URL (login normal), usa ele
        identificadorUsuario = identificadorUsuarioDaURL;
         // Armazena no storage para manter a sessão
        sessionStorage.setItem('nomeUsuario', identificadorUsuario);
        console.log("[index.js] Nome do usuário obtido da URL (identificador) e armazenado em sessionStorage.");

    } else if (userIdFromUrl && firstLoginComplete === 'true') {
         // Se o parâmetro 'user_id' e 'first_login_complete=true' estão na URL (redirecionamento do primeiro login)
         console.log("[index.js] Redirecionado do primeiro login. Obtendo nome do usuário por ID...");
         try {
             // Chama a nova função Python para obter o nome pelo ID
             // Certifique-se de que a função Eel `get_username_by_id` está exposta no Python.
             const resultadoNome = await eel.get_username_by_id(userIdFromUrl)();
             console.log("[index.js] Resultado get_username_by_id:", resultadoNome);

             if (resultadoNome && resultadoNome.status === 'success') {
                 identificadorUsuario = resultadoNome.username; // Obtém o nome do resultado (coluna 'nome')
                 // Armazena no storage APÓS OBTER PELO ID
                 sessionStorage.setItem('nomeUsuario', identificadorUsuario);
                 console.log("[index.js] Nome do usuário obtido por ID e armazenado em sessionStorage.");
             } else {
                 console.error("[index.js] Falha ao obter nome do usuário por ID:", resultadoNome);
                 // Opcional: Tratar erro, talvez exibir um nome padrão ou redirecionar para login
                 // identificadorUsuario = "Erro ao carregar nome";
             }
         } catch (error) {
             console.error("[index.js] Erro na chamada Eel para get_username_by_id:", error);
             // Opcional: Tratar erro de comunicação
             // identificadorUsuario = "Erro de comunicação";
         }

    } else {
        // Se nenhum dos parâmetros de URL relevantes está presente, tenta obter do sessionStorage (para recarregamentos ou navegação interna)
        identificadorUsuario = sessionStorage.getItem('nomeUsuario');
        if (identificadorUsuario) {
             console.log("[index.js] Nome do usuário obtido do sessionStorage (fallback).");
        } else {
             console.log("[index.js] Nome do usuário não encontrado em URL ou sessionStorage. Usuário pode não estar logado.");
             // Opcional: Redirecionar para a página de login se não houver identificador
             // window.location.href = 'login.html';
        }
    }

    // Finalmente, atualiza o elemento HTML se um identificador foi obtido
    if (identificadorUsuario && nomeUsuarioElement) {
        nomeUsuarioElement.textContent = identificadorUsuario;
        console.log("[index.js] Nome do usuário exibido:", identificadorUsuario);
    } else if (nomeUsuarioElement) {
         // Se não conseguiu obter o nome, limpa ou define um texto padrão
         nomeUsuarioElement.textContent = "Usuário Padrão"; // Texto padrão se não logado ou erro
         console.log("[index.js] Nome do usuário não atualizado. Identificador nulo ou elemento não encontrado. Exibindo padrão.");
    }

    // >>> Mover a definição de iniciarTransicaoPagina e atualizarHorarioAtual para antes de window.onload <<<
    // Essas funções precisam estar definidas no escopo antes de serem chamadas aqui dentro.
    // Se elas estiverem definidas DENTRO de window.onload ou DOMContentLoaded, não serão acessíveis aqui.

    // Chamadas para funções que agora devem estar definidas ANTES de window.onload
    if (typeof iniciarTransicaoPagina === 'function') {
        iniciarTransicaoPagina(); // Inicia a animação de transição da página
        console.log("[index.js] iniciarTransicaoPagina chamada.");
    } else {
        console.error("[index.js] Função iniciarTransicaoPagina não definida.");
    }

    if (typeof atualizarHorarioAtual === 'function') {
        atualizarHorarioAtual(); // Exibe o horário inicial
        console.log("[index.js] atualizarHorarioAtual chamada.");
    } else {
        console.error("[index.js] Função atualizarHorarioAtual não definida.");
    }


    // Certifique-se de que o setInterval para atualizar o horário também esteja configurado corretamente.
    // Ele pode ser configurado aqui ou em um DOMContentLoaded separado, desde que atualizarHorarioAtual esteja acessível.
     if (typeof atualizarHorarioAtual === 'function') {
         setInterval(atualizarHorarioAtual, 1000); // Atualiza o horário a cada segundo
         console.log("[index.js] setInterval para atualizarHorarioAtual configurado.");
     }


    console.log("[index.js] window.onload finalizado.");
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


// Funções Eel expostas (verifique se há duplicações com outros JS files)
// eel.expose(alguma_funcao_aqui);

// Exposição para a função de atualização de status da Macro SITE
// Certifique-se de que a definição desta função (atualizar_status_os) está neste arquivo ou em outro arquivo JS carregado ANTES.
// Movi a definição para DENTRO do DOMContentLoaded, a exposição pode ficar aqui fora.
eel.expose(atualizar_status_os, 'atualizar_status_os');

// Exposição para a função de atualização de tempo restante da Macro SITE
// Certifique-se de que a definição desta função (atualizar_tempo_restante_js) está neste arquivo ou em outro arquivo JS carregado ANTES.
// Movi a definição para DENTRO do DOMContentLoaded, a exposição pode ficar aqui fora.
eel.expose(atualizar_tempo_restante_js, 'atualizar_tempo_restante_js');


// Funções de logout e mostrarmacro (definidas aqui fora do DOMContentLoaded/window.onload)
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

    console.log("[index.js] Chamada a mostrarmacro.");

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
        console.log("[index.js] Uma interface predominante já está visível. Impedindo a exibição de 'macrosite'.");
        return;
    }

    if (macrosite) {
        if (macrosite.style.display === 'none' || macrosite.style.display === '') {
            if (consultageralDiv) consultageralDiv.style.display = 'none'; // Oculta outras telas iniciais
            macrosite.style.display = 'block';
            console.log("[index.js] Exibindo 'macrosite'.");
        } else {
            console.log("[index.js] 'macrosite' já está visível.");
        }
    } else {
        console.error("[index.js] Elemento 'macrosite' não encontrado.");
    }
}

function fecharsite() {
    console.log("[index.js] Chamada a fecharsite.");
    const macrositeDiv = document.getElementById('macrosite');
    const loginInput = document.getElementById('login2');
    const senhaInput = document.getElementById('password2');
    const arquivoCsvInput = document.getElementById('arquivo-csv');

    if (macrositeDiv && loginInput && senhaInput && arquivoCsvInput) {
        macrositeDiv.style.display = 'none';
        loginInput.value = '';
        senhaInput.value = '';
        arquivoCsvInput.value = '';
        console.log("[index.js] Tela da Macro SITE fechada e campos resetados.");
    } else {
        console.error("[index.js] Um ou mais elementos necessários para fecharsite não foram encontrados.");
    }
}

function deslogar() {
    console.log("[index.js] Chamada a deslogar.");
    const deslog = document.getElementById('deslog'); // Este ID pode ser do botão de logout
    if (deslog) {
        sessionStorage.removeItem('nomeUsuario'); // Limpa o nome do usuário no logout
        console.log("[index.js] sessionStorage 'nomeUsuario' limpo. Redirecionando para login.html");
        window.location.href = './login.html';
    } else {
        console.error("[index.js] Elemento com ID 'deslog' (botão de logout) não encontrado.");
         // Mesmo se o botão não for encontrado, tentar redirecionar e limpar storage pode ser desejável
         sessionStorage.removeItem('nomeUsuario');
         console.log("[index.js] sessionStorage 'nomeUsuario' limpo (fallback). Redirecionando para login.html");
         window.location.href = './login.html';
    }
}


// >>> Definições de Funções de Callback para o Backend (movidas para fora do DOMContentLoaded) <<<
// Se o backend chamar estas funções, elas precisam estar acessíveis globalmente.
// Já estão expostas acima, mas suas definições precisam estar no escopo correto.
/*
// Removida a definição daqui, pois foi movida para DENTRO do DOMContentLoaded no código que você enviou.
// eel.expose(atualizar_status_os, 'atualizar_status_os');
function atualizar_status_os(os_numero, total_processadas, total_a_processar, thread_id, status) {
    // Esta função está definida DENTRO do DOMContentLoaded no seu código recente.
    // Mantenha-a lá se ela manipula apenas elementos que existem no DOMContentLoaded.
    // Se o backend chamá-la ANTES ou DEPOIS, ela pode não ser acessível.
    // Considere mover definições de callbacks para fora do DOMContentLoaded/window.onload.
     console.log(`[index.js - Global Scope?] Chamada a atualizar_status_os: ${os_numero}, ${status}`);
     const osprocessandoDiv = document.getElementById('os-processando'); // Necessita do DOM
     const quantidadeProcessadaDiv = document.getElementById('quantidade'); // Necessita do DOM
     const porcentagemConcluidaDiv = document.getElementById('porcentagem-concluida'); // Necessita do DOM

     if (osprocessandoDiv) osprocessandoDiv.innerText = `OS: ${os_numero}`;
     if (quantidadeProcessadaDiv) quantidadeProcessadaDiv.innerText = `${total_processadas} de ${total_a_processar}`;
     if (porcentagemConcluidaDiv) {
        const porcentagem = Math.floor((total_processadas / total_a_processar) * 100);
        porcentagemConcluidaDiv.innerText = `${porcentagem}%`
     }
     console.log(`[index.js - Global Scope?] Atualizando OS: ${os_numero}, Status: ${status}`);
}

// Removida a definição daqui, pois foi movida para DENTRO do DOMContentLoaded.
// eel.expose(atualizar_tempo_restante_js, 'atualizar_tempo_restante_js');
function atualizar_tempo_restante_js(tempo_restante) {
    // Esta função está definida DENTRO do DOMContentLoaded no seu código recente.
    // Considere mover definições de callbacks para fora do DOMContentLoaded/window.onload.
    console.log(`[index.js - Global Scope?] Chamada a atualizar_tempo_restante_js: ${tempo_restante}`);
    const tempoEstimadoDiv = document.getElementById('tempoestimado'); // Necessita do DOM
    if (tempoEstimadoDiv) {
        tempoEstimadoDiv.innerText = `Tempo estimado: ${tempo_restante}`;
    }
    console.log(`[index.js - Global Scope?] Tempo restante: ${tempo_restante}`);
}
*/


// >>> Definição da função exibir_conclusao_site (se for chamada pelo backend) <<<
// Se esta função for chamada pelo Eel, ela precisa estar definida fora do DOMContentLoaded/window.onload.
// eel.expose(exibir_conclusao_site); // Lembre-se de expor no Eel no Python se for chamada.
function exibir_conclusao_site(resultado) { // Exemplo: assume que recebe o resultado do backend
    console.log("[index.js] Chamada a exibir_conclusao_site.");
    const siteProssDiv = document.getElementById('sitepross2');
    const siteFinishDiv = document.getElementById('sitefinish'); // Supondo que há uma div para conclusão

    if (siteProssDiv) siteProssDiv.style.display = 'none';

    if (siteFinishDiv) {
        // Atualize a tela de conclusão com base no 'resultado'
        // Ex: siteFinishDiv.querySelector('#mensagem-final').textContent = resultado.mensagem;
        siteFinishDiv.style.display = 'block';
         console.log("[index.js] Exibindo tela de conclusão da Macro SITE.");
    } else {
        console.error("[index.js] Elemento da tela de conclusão (sitefinish) não encontrado.");
    }
    // Implemente a lógica de exibição dos resultados finais aqui
}

// >>> Funções de controle do Popup/Finalização da Macro SITE (se forem usadas) <<<
// fecharPopupSITE, voltarParaProcessarSITE, SITEfinalizarProcesso, SITEconfirmarFecharAplicacao
// Se estas funções forem chamadas pelo HTML (onclick), elas precisam estar no escopo global.
// Mantenha suas definições aqui fora do DOMContentLoaded/window.onload.


// >>> Funções relacionadas à Consulta Geral (Movê-las para macros.js ou um arquivo compartilhado) <<<
// lerArquivoSelecionadoconsultageral, fecharconsultageral, CSfinalizarProcesso, CSconfirmarFecharAplicacao, fecharPopupCS, voltarParaProcessarCS
// Se a Macro Consulta Geral for acessada de outras páginas além do login.html (como macros.html),
// estas funções e suas respectivas exposições Eel (@eel.expose no backend) precisam estar acessíveis
// nessas páginas. A forma ideal é ter um arquivo JS compartilhado ou definir no script específico de cada página.
// No seu código recente, elas parecem estar apenas no login.js, o que não é correto se macros.html também as usa.


// >>> Outras funções do seu código (verificar onde devem estar definidas) <<<
// Funções como mostrarLogin, mostrarCadastro, verificarLogindasd, etc. (da página de login)
// Pertencem EXCLUSIVAMENTE ao login.js. Não devem estar em index.js ou macros.js.
// Funções específicas de Macro SITE ou Macro Consulta Geral devem estar nos arquivos JS
// correspondentes (index.js, macros.js ou um arquivo compartilhado se usadas em mais de uma página).