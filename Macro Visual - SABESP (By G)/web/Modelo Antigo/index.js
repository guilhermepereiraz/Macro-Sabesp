
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
    const tempoEstimadoDiv = document.getElementById('tempoestimado'); // Use o ID diretamente aqui e em outros lugares
    const porcentagemConcluidaDiv = document.getElementById('porcentagem-concluida');
    const iniciarMacroBotao = document.getElementById('iniciar-macro');
    const arquivoCSVInput = document.getElementById('arquivo-csv');

    // Função para atualizar o atributo 'accept' do input de arquivo
    function atualizarFiltroArquivo() {
        arquivoInput.accept = csvOption.checked ? '.csv' : (excelOption.checked ? '.xlsx, .xls' : '');
    }

    csvOption.addEventListener('change', atualizarFiltroArquivo);
    excelOption.addEventListener('change', atualizarFiltroArquivo);
    atualizarFiltroArquivo(); // Inicializa o filtro

    // Função para converter ArrayBuffer para Base64
    function arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    // Processar

    async function lerArquivoSelecionado() {
        const arquivo = arquivoInput.files[0];
        const loginUsuario = document.getElementById('login2').value;
        const senhaUsuario = document.getElementById('password2').value;
        let tipoArquivo = csvOption.checked ? 'csv' : (excelOption.checked ? 'excel' : '');
        const identificadorUsuario = obterParametroDaURL('identificador');

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
                    document.getElementById('macrosite').style.display = 'none';
                    document.getElementById('sitepross2').style.display = 'block';

                    const resultadoPython = await eel.iniciar_macro_multi_thread(conteudoArquivo, loginUsuario, senhaUsuario, nomeArquivo, tipoArquivo, identificadorUsuario)();
                    console.log('Resultado da macro:', resultadoPython);

                    if (resultadoPython) {
                        if (resultadoPython.status === "erro") {
                            console.error("Erro do Python:", resultadoPython.mensagem);
                            if (mensagemErroDiv) {
                                mensagemErroDiv.textContent = resultadoPython.mensagem;
                                mensagemErroDiv.style.display = 'block';
                                document.getElementById('sitepross2').style.display = 'none';
                                document.getElementById('macrosite').style.display = 'block';
                            } else {
                                alert(resultadoPython.mensagem);
                            }
                        } else if (resultadoPython.status === "sucesso") {
                            console.log("Macro processada com sucesso.");
                            // Lógica para exibir a tela de conclusão
                        } else {
                            console.warn("Resposta inesperada do Python:", resultadoPython);
                            alert("Ocorreu um erro inesperado.");
                        }
                    } else {
                        console.error("Nenhuma resposta do Python.");
                        alert("Erro na comunicação com o servidor.");
                    }
                };
                leitor.onerror = function (evento) {
                    console.error('Erro ao ler o arquivo:', evento.target.error);
                    alert('Erro ao ler o arquivo.');
                };
                leitor[tipoArquivo === 'csv' ? 'readAsText' : 'readAsArrayBuffer'](arquivo, 'UTF-8');
            } catch (erro) {
                console.error('Ocorreu um erro:', erro);
                alert('Ocorreu um erro ao processar o arquivo.');
            }
        } else if (!arquivo) {
            mensagemErroDiv.textContent = 'Por favor, selecione um arquivo.';
            mensagemErroDiv.style.display = 'block';
            console.log('Por favor, selecione um arquivo.');
        } else if (!loginUsuario || !senhaUsuario) {
            mensagemErroDiv.textContent = 'Por favor, digite o login e a senha para continuar.';
            mensagemErroDiv.style.display = 'block';
            console.log('Por favor, faça login.');
        } else if (!tipoArquivo) {
            mensagemErroDiv.textContent = 'Por favor, selecione o tipo de arquivo (CSV ou Excel).';
            mensagemErroDiv.style.display = 'block';
            console.log('Por favor, selecione o tipo de arquivo (CSV ou Excel).');
            
        } else if (!identificadorUsuario) {
            console.error('Identificador do usuário não encontrado na URL.');
            alert('Erro: Identificador do usuário não encontrado. Faça login novamente.');
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

    eel.expose(atualizar_status_os, 'atualizar_status_os');
    function atualizar_status_os(os_numero, total_processadas, total_a_processar, thread_id, status) {
        if (osprocessandoDiv) osprocessandoDiv.innerText = `OS: ${os_numero}`;
        if (quantidadeProcessadaDiv) quantidadeProcessadaDiv.innerText = `${total_processadas} de ${total_a_processar}`;
        if (porcentagemConcluidaDiv) {
           const porcentagem = Math.floor((total_processadas / total_a_processar) * 100);
           porcentagemConcluidaDiv.innerText = `${porcentagem}%`
        }
        console.log(`Atualizando OS: ${os_numero}, Status: ${status}`); // Para debug
    }

    eel.expose(atualizar_tempo_restante_js, 'atualizar_tempo_restante_js');
    function atualizar_tempo_restante_js(tempo_restante) {
        if (tempoEstimadoDiv) {
            tempoEstimadoDiv.innerText = `Tempo estimado: ${tempo_restante}`;
        }
        console.log(`Tempo restante: ${tempo_restante}`); // Para debug
    }
});

function mostrarmacro() {
    // Obter referências para todas as divs relevantes de AMBAS as macros
    const macro = document.getElementById('macro'); // Container geral do SITE, se aplicável
    const macrosite = document.getElementById('macrosite'); // Tela inicial do SITE
    const siteProssDiv = document.getElementById('sitepross2'); // Tela de processamento do SITE
    const sitePopupDiv = document.getElementById('sitepopup'); // Popup do SITE
    const siteFinishDiv = document.getElementById('sitefinish'); // Tela de finalização do SITE (do SITE)
    const conclusaosite = document.getElementById('siteconclusao'); // Outra tela de conclusão do SITE, se aplicável

    const consultageralDiv = document.getElementById('consultageral'); // Tela inicial da Consulta Geral
    const consultpross2Div = document.getElementById('consultpross2'); // Tela de processamento da Consulta Geral
    const csPopupDiv = document.getElementById('cs-popup'); // Popup da Consulta Geral
    const csFinishDiv = document.getElementById('cs-finish'); // Tela de finalização da Consulta Geral


    console.log("Verificando estado das interfaces antes de mostrar 'macrosite'...");
    console.log("Estado 'macrosite':", macrosite ? macrosite.style.display : 'Elemento não encontrado');
    console.log("Estado 'siteProssDiv':", siteProssDiv ? siteProssDiv.style.display : 'Elemento não encontrado');
    console.log("Estado 'sitePopupDiv':", sitePopupDiv ? sitePopupDiv.style.display : 'Elemento não encontrado');
    console.log("Estado 'siteFinishDiv':", siteFinishDiv ? siteFinishDiv.style.display : 'Elemento não encontrado');
    console.log("Estado 'conclusaosite':", conclusaosite ? conclusaosite.style.display : 'Elemento não encontrado');
    console.log("Estado 'consultageralDiv':", consultageralDiv ? consultageralDiv.style.display : 'Elemento não encontrado');
    console.log("Estado 'consultpross2Div':", consultpross2Div ? consultpross2Div.style.display : 'Elemento não encontrado');
    console.log("Estado 'csPopupDiv':", csPopupDiv ? csPopupDiv.style.display : 'Elemento não encontrado');
    console.log("Estado 'csFinishDiv':", csFinishDiv ? csFinishDiv.style.display : 'Elemento não encontrado');


    // --- VERIFICAÇÃO PREDOMINANTE: Se QUALQUER tela de processamento/popup/finalização está aberta, não mostre a tela inicial do SITE ---
    if (
        (siteProssDiv && siteProssDiv.style.display === 'block') ||
        (sitePopupDiv && sitePopupDiv.style.display === 'block') ||
        (siteFinishDiv && siteFinishDiv.style.display === 'block') ||
        (conclusaosite && conclusaosite.style.display === 'block') || // Verifica telas do SITE
        (consultageralDiv && consultageralDiv.style.display === 'block') || // Verifica telas da Consulta Geral
        (consultpross2Div && consultpross2Div.style.display === 'block') ||
        (csPopupDiv && csPopupDiv.style.display === 'block') ||
        (csFinishDiv && csFinishDiv.style.display === 'block')
    ) {
        console.log("Uma interface predominante (Macro SITE ou Consulta Geral) já está visível. Impedindo a exibição de 'macrosite'.");
        // Opcional: Adicionar um alerta ou mensagem para o usuário aqui
        // alert("Por favor, feche a outra macro antes de abrir a Macro SITE.");
        return; // Sai da função sem mostrar 'macrosite'
    }
    // --- FIM DA VERIFICAÇÃO PREDOMINANTE ---


    // Se nenhuma interface predominante estiver aberta, mostre a tela inicial da Macro SITE
    if (macrosite) {
        if (macrosite.style.display === 'none' || macrosite.style.display === '') {
             // Opcional: Ocultar outras telas iniciais aqui se houver (ex: tela inicial da Consulta Geral)
             if (consultageralDiv) consultageralDiv.style.display = 'none';

            macrosite.style.display = 'block';
            console.log("Exibindo 'macrosite'.");
        } else {
            console.log("'macrosite' já está visível.");
        }
    } else {
        console.error("Elemento 'macrosite' não encontrado.");
    }

    // A verificação original dos elementos da Macro SITE ainda é útil se você quiser garantir
    // que não está tentando mostrar a tela inicial do SITE enquanto o processamento/popup do SITE já está ativo.
    // No entanto, a verificação predominante acima já cobre a maioria desses casos.
}

function fecharsite() {
    const macrositeDiv = document.getElementById('macrosite');
    const loginInput = document.getElementById('login2');
    const senhaInput = document.getElementById('password2');
    const arquivoCsvInput = document.getElementById('arquivo-csv');

    if (macrositeDiv && loginInput && senhaInput && arquivoCsvInput) {
        macrositeDiv.style.display = 'none';
        loginInput.value = '';
        senhaInput.value = '';
        arquivoCsvInput.value = '';
    } else {
        console.error("Um ou mais elementos com IDs 'macrosite', 'login2', 'password2' ou 'arquivo-csv' não foram encontrados.");
    }
}

function deslogar() {
    const deslog = document.getElementById('deslog');
    if (deslog) {
        window.location.href = './login.html';
    } else {
        console.error("Elemento com ID 'deslog' não encontrado.");
    }
}

function obterParametroDaURL(nome) {
    nome = nome.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp('[?&]' + nome + '(=([^&#]*)|&|#|$)');
    const results = regex.exec(window.location.href);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

window.onload = function () {
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
        const mes = (agora.getMonth() + 1).toString().padStart(2, '0');
        const ano = agora.getFullYear();

        // Encontra o elemento span dentro do h3 e atualiza o texto
        const spanElement = horarioAtualElement.querySelector('span');
        if (spanElement) {
            spanElement.textContent = ` ${dia}/${mes}/${ano} - ${horas}:${minutos}:${segundos} `;
        } else {
            console.error("Elemento <span> dentro de #horario-atual não encontrado.");
        }
    }
}

// Atualiza o horário imediatamente ao carregar a página
atualizarHorarioAtual();

// Atualiza o horário a cada segundo
setInterval(atualizarHorarioAtual, 1000);

function fecharsite2() {
    const siteProssDiv = document.getElementById('sitepross2');
    if (siteProssDiv) {
        siteProssDiv.style.display = 'none';
    } else {
        console.error("Elemento com ID 'sitepross2' não encontrado.");
    }
}

// atualizar OS (SEGUNDA DEFINIÇÃO - MANTENDO ESTA)
eel.expose(atualizar_status_os_final, 'atualizar_status_os'); // Expõe com o nome correto
function atualizar_status_os_final(id_os, item_atual, total_itens, porcentagem, tempo_estimado) {
    console.log('Atualizando status:', id_os, item_atual, total_itens, 'Porcentagem:', porcentagem, 'Tempo Estimado:', tempo_estimado);
    const contadorElement = document.getElementById('quantidade'); // Use o ID correto
    const porcentagemConcluidaElement = document.getElementById('porcentagem-concluida');
    const tempoEstimadoElement = document.getElementById('tempoestimado'); // Use o ID correto

    if (contadorElement) {
        contadorElement.textContent = `${item_atual} de ${total_itens}`;
    } else {
        console.error("Elemento com ID 'quantidade' não encontrado.");
    }

    if (porcentagemConcluidaElement && porcentagem !== -1) {
        porcentagemConcluidaElement.textContent = `${porcentagem}%`;
    } else if (!porcentagemConcluidaElement) {
        console.error("Elemento com ID 'porcentagem-concluida' não encontrado.");
    }

    if (tempoEstimadoElement) {
        tempoEstimadoElement.textContent = `Tempo estimado: ${tempo_estimado}`;
    } else {
        console.error("Elemento com ID 'tempoestimado' não encontrado.");
    }
}

// Pausar macro

let macroPausada = false;                                         // Variável para rastrear o estado de pausa

function pausarMacro() {
    macroPausada = !macroPausada;                                        // Inverte o estado de pausa
    const pausarBotao = document.getElementById('btnpause');

    if (pausarBotao) {
        if (macroPausada) {
            pausarBotao.textContent = 'Continuar';
            eel.pausar_macro_backend()();                                    // Chama a função Python para pausar
        } else {
            pausarBotao.textContent = 'Pausar';
            console.log("Chamando eel.continuar_macro_backend()"); // ADICIONE ESTE LOG
            eel.continuar_macro_backend()();                                  // Chama a função Python para continuar
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

function confirmarFecharAplicacao() {
    console.log("Usuário clicou em 'Sim' para fechar a aplicação e interromper a macro.");

    // Chama a função Python para parar a macro
    eel.parar_macro_backend()();

    // Obtém a referência ao popup de confirmação
    const sitePopup = document.getElementById('sitepopup');

    // Esconde o popup se ele existir
    if (sitePopup) {
        sitePopup.style.display = 'none';
        console.log("Popup de fechamento escondido.");
    } else {
        console.warn("Elemento 'sitepopup' não encontrado!");
    }

    // Obtém a referência à tela de "Macro encerrada com sucesso"
    const final = document.getElementById('sitefinish');

    // Exibe a tela de conclusão se ela existir
    if (final) {
        final.style.display = 'block';
        console.log("Tela de 'Macro encerrada com sucesso' exibida.");
    } else {
        console.warn("Elemento 'sitefinish' não encontrado!");
    }

    // Opcional: Limpar campos (como você já estava fazendo)
    const loginInput = document.getElementById('login2');
    const senhaInput = document.getElementById('password2');
    const arquivoCsvInput = document.getElementById('arquivo-csv');
    if (loginInput) loginInput.value = '';
    if (senhaInput) senhaInput.value = '';
    if (arquivoCsvInput) arquivoCsvInput.value = '';

    // Lembre-se: a aplicação será fechada pelo backend Python após a chamada eel.parar_macro_backend()
}


// para a macro de vez

function finalizarProcesso() {
    const bntfechar = document.getElementById('voltarbnt2');                                    // Botão "OK" na tela de conclusão
    const final = document.getElementById('sitefinish');                                      // Tela de conclusão
    const quantidadedeprocessadors = document.getElementById('quantidade');                   // Texto de quantidade
    const osprocessadas = document.getElementById('os-processando');                         // Texto da OS
    const tempoestimado = document.getElementById('tempoestimado');                             // Texto do tempo estimado
    const porcentagem = document.getElementById('porcentagem-concluida');                     // Texto da porcentagem
    const inicio = document.getElementById('sitepross2');                                      // Texto da porcentagem

    if (bntfechar) {
        final.style.display = 'none';                                        // Esconde a tela de conclusão
        quantidadedeprocessadors.innerText = '0 de 9999: Processando..';                    // Reseta a quantidade
        osprocessadas.innerText = 'OS: ';                                     // Reseta a OS
        tempoestimado.innerText = 'Tempo estimado: Processando..';                        // Reseta o tempo estimado
        porcentagem.innerText = '0%: Processando..';


        if (inicio)
            quantidadedeprocessadors.innerText = '0 de 9999: Processando..';                // Reseta a quantidade
        osprocessadas.innerText = 'OS: ';                                 // Reseta a OS
        tempoestimado.innerText = 'Tempo estimado: Processando..';                      // Reseta o tempo estimado
        porcentagem.innerText = '0%: Processando..';                                   // Reseta a porcentagem

    }
    else {
        console.error("Elemento com ID 'voltarbnt2' nãfoi encontrado.");
    }
}

// Conclusão do SITE

eel.expose(exibir_conclusao_site);

function exibir_conclusao_site(horaInicio, dataInicio, horaTermino, dataTermino, totalOsProcessadas, tempoTotal, nomeArquivo) {
    document.getElementById('sitepross2').style.display = 'none'; // Garante que a div esteja visível
    document.getElementById('siteconclusao').style.display = 'block';

    // Início da Operação
    document.getElementById('hora_inicio').textContent = 'Hora: ' + horaInicio;
    document.getElementById('data_inicio').textContent = 'Data: ' + dataInicio;

    // Termino da Operação
    document.getElementById('hora_termino').textContent = 'Hora: ' + horaTermino;
    document.getElementById('data_termino').textContent = 'Data: ' + dataTermino;

    // Informações Finais
    document.getElementById('total_os_processadas').textContent = 'OS Processadas: ' + totalOsProcessadas;
    document.getElementById('tempo_total_operacao').textContent = 'Tempo da Operação: ' + tempoTotal;

    // Arquivo Processado
    const arquivoProcessadoElement = document.getElementById('arquivo-processado');
    if (arquivoProcessadoElement) {
        arquivoProcessadoElement.textContent = 'Arquivo Processado: ' + nomeArquivo;
    } else {
        console.error("Elemento 'arquivo-processado' não encontrado.");
    }
}


// Concluido

function rodarNovamente() {
    const siteconclusao = document.getElementById('siteconclusao');
    const site = document.getElementById('macrosite');
    const fecharBotao = document.getElementById('concluido');
    const loginInput = document.getElementById('login2');
    const senhaInput = document.getElementById('password2');
    const arquivoCsvInput = document.getElementById('arquivo-csv');

    if (siteconclusao && site && fecharBotao && loginInput && senhaInput && arquivoCsvInput) {
        siteconclusao.style.display = 'none';
        site.style.display = 'block';
        loginInput.value = '';         // Limpa o valor do campo de login
        senhaInput.value = '';         // Limpa o valor do campo de senha
        arquivoCsvInput.value = '';    // Limpa o valor do campo de arquivo
    } else {
        console.error("Um ou mais elementos com IDs 'siteconclusao', 'macrosite', 'concluido', 'login2', 'password2' ou 'arquivo-csv' não foram encontrados.");
    }
}

function concluir() {
    const siteconclusao = document.getElementById('siteconclusao');
    const fecharBotao = document.getElementById('concluido');

    if (siteconclusao && fecharBotao) {
        siteconclusao.style.display = 'none';
    } else {
        console.error("Um ou mais elementos com IDs 'siteconclusao' ou 'concluido' não foram encontrados.");
    }
}

// MACRO CONSULTA GERAL

function mostrarconsultageral() {
    // Obter a referência para a div inicial da Consulta Geral
    // Assumindo que 'consultagr' é uma div pai ou não a tela que queremos mostrar inicialmente
    // const consultagr = document.getElementById('consultagr');
    const consultageralDiv = document.getElementById('consultageral'); // A div principal da tela inicial da Consulta Geral

    // Obter referências para as divs da Macro SITE (para verificar se alguma está ativa)
    const macrositeDiv = document.getElementById('macrosite'); // Tela inicial da Macro SITE
    const siteProssDiv = document.getElementById('sitepross2'); // Tela de processamento da Macro SITE
    const sitePopupDiv = document.getElementById('sitepopup'); // Popup da Macro SITE
    const siteFinishDiv = document.getElementById('sitefinish'); // Tela de finalização da Macro SITE
    const conclusaositeDiv = document.getElementById('siteconclusao'); // Outra tela de conclusão da Macro SITE


    console.log("Verificando estado das interfaces antes de mostrar 'consultageral'...");
    console.log("Estado 'consultageralDiv':", consultageralDiv ? consultageralDiv.style.display : 'Elemento não encontrado');
    console.log("Estado 'macrositeDiv':", macrositeDiv ? macrositeDiv.style.display : 'Elemento não encontrado');
    console.log("Estado 'siteProssDiv':", siteProssDiv ? siteProssDiv.style.display : 'Elemento não encontrado');
    console.log("Estado 'sitePopupDiv':", sitePopupDiv ? sitePopupDiv.style.display : 'Elemento não encontrado');
    console.log("Estado 'siteFinishDiv':", siteFinishDiv ? siteFinishDiv.style.display : 'Elemento não encontrado');
    console.log("Estado 'conclusaositeDiv':", conclusaositeDiv ? conclusaositeDiv.style.display : 'Elemento não encontrado');


    // --- VERIFICAÇÃO PREDOMINANTE: Se QUALQUER tela da Macro SITE está aberta, não mostre a tela inicial da Consulta Geral ---
    // Verifica se a tela inicial OU qualquer tela de estado (processamento, popup, finalização) da Macro SITE está visível
    if (
        (macrositeDiv && macrositeDiv.style.display === 'block') || // Inclui a tela inicial da Macro SITE
        (siteProssDiv && siteProssDiv.style.display === 'block') ||
        (sitePopupDiv && sitePopupDiv.style.display === 'block') ||
        (siteFinishDiv && siteFinishDiv.style.display === 'block') ||
        (conclusaositeDiv && conclusaositeDiv.style.display === 'block')
    ) {
        console.log("A Macro SITE está ativa em alguma tela. Impedindo a exibição de 'consultageral'.");
        // Opcional: Adicionar um alerta ou mensagem para o usuário aqui
        // alert("Por favor, feche a Macro SITE antes de abrir a Consulta Geral.");
        return; // Sai da função sem mostrar 'consultageral'
    }
    // --- FIM DA VERIFICAÇÃO PREDOMINANTE ---


    // Se nenhuma tela da Macro SITE estiver aberta, mostre a tela inicial da Consulta Geral
    if (consultageralDiv) {
        // Opcional: Ocultar outras telas iniciais aqui se houver (ex: tela inicial de outra macro)
        // Você pode querer esconder a tela inicial da Macro SITE aqui, se ela não estiver já 'block'
        // if (macrositeDiv) macrositeDiv.style.display = 'none';


        if (consultageralDiv.style.display === 'none' || consultageralDiv.style.display === '') {
            consultageralDiv.style.display = 'block';
            console.log("Exibindo 'consultageral'.");
        } else {
            console.log("'consultageral' já está visível.");
        }
    } else {
        console.error("Elemento 'consultageral' não encontrado.");
    }
}


function fecharconsultageral() {
    const macroconsultageral = document.getElementById('consultageral');
    const csloginInput = document.getElementById('login3');
    const cssenhaInput = document.getElementById('password3');
    const csarquivoCsvInput = document.getElementById('cs-arquivo-csv');

    if (macroconsultageral && csloginInput && cssenhaInput && csarquivoCsvInput) {
        macroconsultageral.style.display = 'none';
        csloginInput.value = '';
        cssenhaInput.value = '';
        csarquivoCsvInput.value = '';
    } else {
        console.error("Um ou mais elementos com IDs 'macrosite', 'login2', 'password2' ou 'arquivo-csv' não foram encontrados.");
    }
}

// Ler aquivo e processar 

document.addEventListener('DOMContentLoaded', () => {
    const csArquivoInput = document.getElementById('cs-arquivo-csv');
    const cscsvOption = document.getElementById('cs-csvOption');
    const csexcelOption = document.getElementById('cs-excelOption');
    const csmensagemErroDiv = document.getElementById('cs-mensagem-de-erro');
    const csLoginInput = document.getElementById('login3');
    const csSenhaInput = document.getElementById('password3');
    const csProcessarBotao = document.getElementById('processargeral');
    const consultageralDiv = document.getElementById('consultageral'); // Div da tela inicial
    const consultpross2Div = document.getElementById('consultpross2'); // Div da tela de processamento

    const osprocessandoDiv = document.getElementById('os-processando'); // Elemento para OS (Pode não existir no HTML #consultpross2 fornecido)
    const csQuantidadeProcessadaDiv = document.getElementById('cs-quantidade'); // Elemento para quantidade (ID do HTML #consultpross2)
    const csTipoPesquisaDiv = document.getElementById('cs-tipodepesquisa'); // Elemento para tipo de pesquisa (ID do HTML #consultpross2)
    // Elemento para exibir a contagem de erros
    const csErrorDiv = document.getElementById('cs-error'); // <<< Adicionado para pegar o elemento de erros
    const csTempoEstimadoDiv = document.getElementById('cs-tempoestimado'); // Elemento para tempo estimado (ID do HTML #consultpross2)
    const csPorcentagemConcluidaDiv = document.getElementById('cs-porcentagem-concluida'); // Elemento para porcentagem (ID do HTML #consultpross2)


    const csPdeOption = document.getElementById('cs-pdeOption');
    const csHidroOption = document.getElementById('cs-hidroOption');

    function atualizarFiltroArquivoConsultaGeral() {
        if (csArquivoInput && cscsvOption && csexcelOption) {
             csArquivoInput.accept = cscsvOption.checked ? '.csv' : (csexcelOption.checked ? '.xlsx, .xls' : '');
        }
    }

    if (cscsvOption) {
        cscsvOption.addEventListener('change', atualizarFiltroArquivoConsultaGeral);
    }
    if (csexcelOption) {
        csexcelOption.addEventListener('change', atualizarFiltroArquivoConsultaGeral);
    }

    atualizarFiltroArquivoConsultaGeral();

    function arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    function obterParametroDaURL(nome) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(nome);
    }

    async function lerArquivoSelecionadoconsultageral() {
        const arquivo = csArquivoInput ? csArquivoInput.files[0] : null;
        const loginUsuario = csLoginInput ? csLoginInput.value : '';
        const senhaUsuario = csSenhaInput ? csSenhaInput.value : '';
        let tipoArquivo = cscsvOption && cscsvOption.checked ? 'csv' : (csexcelOption && csexcelOption.checked ? 'excel' : '');
        const tipoMacroSelecionado = csPdeOption && csPdeOption.checked ? 'PDE' : (csHidroOption && csHidroOption.checked ? 'HIDRO' : '');

        const identificadorUsuario = obterParametroDaURL('identificador');

        if (csmensagemErroDiv) {
            csmensagemErroDiv.style.display = 'none';
            csmensagemErroDiv.textContent = '';
        }

        // Resetar status na tela de processamento ao iniciar
        if (osprocessandoDiv) osprocessandoDiv.innerText = 'OS: ';
        if (csQuantidadeProcessadaDiv) csQuantidadeProcessadaDiv.innerText = '0 de 9999'; // Melhor iniciar com 0 de Total (que será atualizado)
        if (csErrorDiv) csErrorDiv.innerText = 'Erros: 0'; // <<< Resetar erros para 0
        if (csTipoPesquisaDiv) csTipoPesquisaDiv.innerText = `Tipo de Filtro: ${tipoMacroSelecionado}`;
        if (csTempoEstimadoDiv) csTempoEstimadoDiv.innerText = 'Tempo estimado: Calculando...'; // Iniciar como 'Calculando...'
        if (csPorcentagemConcluidaDiv) csPorcentagemConcluidaDiv.innerText = '0%'; // Iniciar com 0%


        if (!arquivo) {
            if (csmensagemErroDiv) {
                csmensagemErroDiv.textContent = 'Por favor, selecione um arquivo.';
                csmensagemErroDiv.style.display = 'block';
            } else {
                alert('Por favor, selecione um arquivo.');
            }
            console.log('Por favor, selecione um arquivo.');
            return;
        }

         if (!loginUsuario || !senhaUsuario) {
             if (csmensagemErroDiv) {
                 csmensagemErroDiv.textContent = 'Por favor, digite o login e a senha para continuar.';
                 csmensagemErroDiv.style.display = 'block';
             } else {
                 alert('Por favor, digite o login e a senha para continuar.');
             }
             console.log('Por favor, faça login.');
              return;
           }

           if (!tipoArquivo) {
             if (csmensagemErroDiv) {
                 csmensagemErroDiv.textContent = 'Por favor, selecione o tipo de arquivo (CSV ou Excel).';
                 csmensagemErroDiv.style.display = 'block';
             } else {
                 alert('Por favor, selecione o tipo de arquivo (CSV ou Excel).');
             }
             console.log('Por favor, selecione o tipo de arquivo (CSV ou Excel).');
             return;
           }

           if (!identificadorUsuario) {
             console.error('Identificador do usuário não encontrado na URL.');
             alert('Erro: Identificador do usuário não encontrado. Faça login novamente.');
             return;
           }


        try {
            const leitor = new FileReader();

            leitor.onload = async function (evento) {
                const conteudoArquivo = tipoArquivo === 'csv' ? evento.target.result : arrayBufferToBase64(evento.target.result);
                const nomeArquivo = arquivo.name;

                console.log('Tipo de Arquivo Selecionado:', tipoArquivo);
                console.log('Tipo de Macro Selecionado:', tipoMacroSelecionado);

                if (consultageralDiv) consultageralDiv.style.display = 'none';
                if (consultpross2Div) consultpross2Div.style.display = 'block';


                try {
                     // Chama a função Eel no backend
                    const resultadoPython = await eel.iniciar_consulta_geral_frontend(conteudoArquivo, loginUsuario, senhaUsuario, nomeArquivo, tipoArquivo, tipoMacroSelecionado, identificadorUsuario)();
                     console.log('Resultado da macro:', resultadoPython);

                     if (resultadoPython) {
                          if (resultadoPython.status === "erro") {
                              console.error("Erro do Python:", resultadoPython.mensagem);
                              if (csmensagemErroDiv) {
                                  csmensagemErroDiv.textContent = resultadoPython.mensagem;
                                  csmensagemErroDiv.style.display = 'block';
                                 if (consultpross2Div) consultpross2Div.style.display = 'none';
                                 if (consultageralDiv) consultageralDiv.style.display = 'block';
                              } else {
                                  alert("Erro: " + resultadoPython.mensagem);
                              }
                          } else if (resultadoPython.status === "sucesso") {
                              console.log("Macro processada com sucesso.");
                              // Opcional: Exibir resumo final retornado pelo backend
                              // if (resultadoPython.resumo) {
                              //     console.log("Resumo:", resultadoPython.resumo);
                              //     // Atualizar elementos finais na tela com o resumo, se necessário
                              //     // Ex: csQuantidadeProcessadaDiv.innerText = `${resultadoPython.resumo.processados} de ${resultadoPython.resumo.total_inicial}`;
                              //     // csErrorDiv.innerText = 'Erros: ' + resultadoPython.resumo.erros;
                              //     // csTempoEstimadoDiv.innerText = 'Tempo total: ' + resultadoPython.resumo.tempo_total;
                              // }
                          } else {
                              console.warn("Resposta inesperada do Python:", resultadoPython);
                              alert("Ocorreu um erro inesperado ao processar.");
                               if (consultpross2Div) consultpross2Div.style.display = 'none';
                               if (consultageralDiv) consultageralDiv.style.display = 'block';
                          }
                     } else {
                          console.error("Nenhuma resposta do Python.");
                          alert("Erro na comunicação com o servidor.");
                           if (consultpross2Div) consultpross2Div.style.display = 'none';
                           if (consultageralDiv) consultageralDiv.style.display = 'block';
                     }
                } catch (eelError) {
                     console.error('Erro ao chamar função Eel:', eelError);
                     alert('Erro ao comunicar com o backend de processamento.');
                      if (consultpross2Div) consultpross2Div.style.display = 'none';
                      if (consultageralDiv) consultageralDiv.style.display = 'block';
                }
            };

            leitor.onerror = function (evento) {
                console.error('Erro ao ler o arquivo:', evento.target.error);
                 if (csmensagemErroDiv) {
                     csmensagemErroDiv.textContent = 'Erro ao ler o arquivo.';
                     csmensagemErroDiv.style.display = 'block';
                 } else {
                     alert('Erro ao ler o arquivo.');
                 }
            };

            if (tipoArquivo === 'csv') {
                 leitor.readAsText(arquivo, 'UTF-8');
            } else if (tipoArquivo === 'excel') {
                 leitor.readAsArrayBuffer(arquivo);
            }


        } catch (erro) {
            console.error('Ocorreu um erro durante o processamento:', erro);
             if (csmensagemErroDiv) {
                 csmensagemErroDiv.textContent = 'Ocorreu um erro ao processar o arquivo.';
                 csmensagemErroDiv.style.display = 'block';
             } else {
                 alert('Ocorreu um erro ao processar o arquivo.');
             }
             if (consultpross2Div) consultpross2Div.style.display = 'none';
             if (consultageralDiv) consultageralDiv.style.display = 'block';
        }
    }

    // Exponha a função para ser chamada no HTML
    window.lerArquivoSelecionadoconsultageral = lerArquivoSelecionadoconsultageral;


    if (csArquivoInput) {
        csArquivoInput.addEventListener('change', () => {
            if (csArquivoInput.files.length > 0) {
                console.log('Arquivo selecionado:', csArquivoInput.files[0].name);
                if (csmensagemErroDiv) {
                    csmensagemErroDiv.style.display = 'none';
                    csmensagemErroDiv.textContent = '';
                }
            }
        });
    }

    // Função para fechar a tela de processamento e voltar para a inicial
    function fecharconsultageral() {
        console.log("Função fecharconsultageral chamada.");
         if (consultpross2Div && consultpross2Div.style.display !== 'none') {
             consultpross2Div.style.display = 'none';
             if (consultageralDiv) consultageralDiv.style.display = 'block';
         } else if (consultageralDiv && consultageralDiv.style.display !== 'none') {
              // Se estiver na tela inicial e chamar fecharconsultageral, esconde ela também
              consultageralDiv.style.display = 'none';
         }
         // Nota: Se precisar parar a automação ao fechar, você precisará de uma função Eel correspondente no backend.
    }
     window.fecharconsultageral = fecharconsultageral;


    // --- Funções Eel expostas para o backend chamar ---
    if (typeof eel !== 'undefined') {
         // Função para atualizar o status na tela de processamento
         // Recebe: id_os (não usado aqui), processados, total, erros, porcentagem, status_msg, tempo_estimado
         eel.expose(atualizar_status_os, 'atualizar_status_os');
         function atualizar_status_os(id_os, total_processadas, total_a_processar, erros_count, porcentagem, status_msg, tempo_estimado) { // <<< Assinatura atualizada
              // Note: id_os é o primeiro parâmetro do backend, mas pode ser None para atualizações gerais
              if (osprocessandoDiv && id_os) osprocessandoDiv.innerText = `OS: ${id_os}`; // Atualiza apenas se id_os for fornecido
              if (csQuantidadeProcessadaDiv) csQuantidadeProcessadaDiv.innerText = `${total_processadas} de ${total_a_processar}`;
              // Atualiza o elemento de erros
              if (csErrorDiv) csErrorDiv.innerText = `Erros: ${erros_count}`; // <<< Atualizando erros
              if (csPorcentagemConcluidaDiv) csPorcentagemConcluidaDiv.innerText = `${porcentagem}%`; // Porcentagem já vem calculada

              // Atualiza o elemento de tempo estimado
              if (csTempoEstimadoDiv) {
                   csTempoEstimadoDiv.innerText = `Tempo estimado: ${tempo_estimado}`; // <<< Atualizando tempo estimado
              }
              console.log(`[Consulta Geral] Processadas: ${total_processadas}/${total_a_processar}, Erros: ${erros_count}, %: ${porcentagem}, Tempo Estimado: ${tempo_estimado}, Status: ${status_msg}`);

         }


    } else {
        console.warn("Eel object not found. Python communication functions will not work.");
    }


});

function fecharPopupCS() {
    const csfecharBotao = document.getElementById('cs-voltarbnt');
    const csprocessandosite = document.getElementById('consultpross2');
    const cserropopup = document.getElementById('cs-popup');

    if (csfecharBotao) {
        csprocessandosite.style.display = 'none';
        cserropopup.style.display = 'block';
    } else {
        console.error("Um ou mais elementos com IDs 'fecharsite', 'macrosite', 'login2', 'password2' ou 'arquivo-csv' não foram encontrados.");
    }
}

function voltarParaProcessarCS() {
    const csfecharBotao = document.getElementById('cs-voltarbnt');
    const csprocessando = document.getElementById('consultpross2');
    const cserropopup = document.getElementById('cs-popup');

    if (csfecharBotao) {
        cserropopup.style.display = 'none';
        csprocessando.style.display = 'block';
    } else {
        console.error("Um ou mais elementos com IDs 'cs-voltarbnt', 'consultpross2', 'cs-popup', não foram encontrados.");
    }
}

function CSfinalizarProcesso() {
    const csbntfechar = document.getElementById('csvoltarbnt3');                                    // Botão "OK" na tela de conclusão
    const csfinal = document.getElementById('csfinish');                                      // Tela de conclusão
    const csquantidadedeprocessadors = document.getElementById('cs-quantidade');                   // Texto de quantidade     
    const cserross = document.getElementById('cs-error');                      // Texto da OS
    const cstempoestimado = document.getElementById('cs-tempoestimado');                             // Texto do tempo estimado
    const csporcentagem = document.getElementById('cs-porcentagem-concluida');                     // Texto da porcentagem
    const csinicio = document.getElementById('consultpross2');                                      // Texto da porcentagem

    if (csbntfechar) {
        csfinal.style.display = 'none';                                        // Esconde a tela de conclusão
        csquantidadedeprocessadors.innerText = '0 de 9999: Processando..';                    // Reseta a quantidade                                  // Reseta a OS
        cstempoestimado.innerText = 'Tempo estimado: Processando..';       
        cserross.innerText = 'Erros: Processando..';                     // Reseta o tempo estimado
        csporcentagem.innerText = '0%: Processando..';


        if (csinicio)
        csquantidadedeprocessadors.innerText = '0 de 9999: Processando..';
        cserross.innerText = 'Erros: Processando..';                    // Reseta a quantidade                              // Reseta a OS
        cstempoestimado.innerText = 'Tempo estimado: Processando..';                      // Reseta o tempo estimado
        csporcentagem.innerText = '0%: Processando..';                                   // Reseta a porcentagem

    }
    else {
        console.error("Elemento com ID 'csvoltarbnt3' nãfoi encontrado.");
    }
}

function CSconfirmarFecharAplicacao() {
    console.log("Usuário clicou em 'Sim' para fechar a aplicação e interromper a macro.");

    // Chama a função Python para parar a macro
    eel.csparar_macro_backend()();

    // Obtém a referência ao popup de confirmação
    const csPopup = document.getElementById('cs-popup');

    // Esconde o popup se ele existir
    if (csPopup) {
        csPopup.style.display = 'none';
        console.log("Popup de fechamento escondido.");
    } else {
        console.warn("Elemento 'cs-popup' não encontrado!");
    }

    // Obtém a referência à tela de "Macro encerrada com sucesso"
    const csfinal = document.getElementById('csfinish');

    // Exibe a tela de conclusão se ela existir
    if (csfinal) {
        csfinal.style.display = 'block';
        console.log("Tela de 'Macro encerrada com sucesso' exibida.");
    } else {
        console.warn("Elemento 'csfinish' não encontrado!");
    }

}


// PRIMEIRO LOGIN

function trocarlogin() {
    // 1. Coletar os valores dos campos de senha
    const senhaAtualInput = document.getElementById('password'); // Campo "Senha Atual" (seria a senha provisória)
    const novaSenhaInput = document.getElementById('passwordrepeat'); // Campo "Nova Senha"
    const mensagemErroDiv = document.getElementById('mensagem-2'); // Adicionei este ID no seu HTML para mensagens, ou crie um novo elemento dentro de #carregandocerto

    const senhaAtual = senhaAtualInput.value;
    const novaSenha = novaSenhaInput.value;

    // Limpa mensagens de erro anteriores
    if (mensagemErroDiv) {
        mensagemErroDiv.textContent = '';
    }

    // Adicionar validações básicas no frontend (opcional, mas recomendado)
    if (novaSenha.length < 8) { // Exemplo: verificar tamanho mínimo
        if (mensagemErroDiv) {
            mensagemErroDiv.textContent = 'A nova senha deve ter pelo menos 8 caracteres.';
        }
        return; // Interrompe a função se a validação falhar
    }
    // Adicionar outras validações de formato de senha se necessário

    // 2. Preparar os dados para enviar ao backend
    // Você precisará de alguma forma obter o identificador do usuário aqui
    // Isso pode ter sido guardado em uma variável JavaScript após o login inicial
    const usuarioIdentificador = 'algum_valor_do_identificador_do_usuario'; // SUBSTITUA PELA FORMA CORRETA DE OBTER O ID/LOGIN DO USUÁRIO

    const dadosParaBackend = {
        identificador: usuarioIdentificador,
        senhaAtualFornecida: senhaAtual, // Senha provisória/inicial digitada
        novaSenha: novaSenha
    };

    // 3. Enviar os dados para o backend para validar e trocar a senha
    // Substitua '/api/trocar-senha-primeiro-acesso' pelo endereço (endpoint) real no seu servidor
    fetch('/api/trocar-senha-primeiro-acesso', {
        method: 'POST', // Use POST para enviar dados de forma segura
        headers: {
            'Content-Type': 'application/json',
            // Se estiver usando tokens de autenticação, adicione aqui
            // 'Authorization': 'Bearer SEU_TOKEN_AQUI'
        },
        body: JSON.stringify(dadosParaBackend) // Envia os dados como JSON
    })
    .then(response => {
        // Verifica se a resposta indica sucesso (status 2xx)
        if (!response.ok) {
            // Se a resposta não for bem-sucedida, lança um erro para ser pego no .catch
            // Você pode verificar o status ou o corpo da resposta para detalhes do erro
            return response.json().then(errorData => { throw new Error(errorData.message || 'Erro ao trocar a senha.'); });
        }
        // Se a resposta for bem-sucedida, retorna os dados da resposta
        return response.json();
    })
    .then(data => {
        // 4. Lidar com a resposta de sucesso do backend
        console.log('Resposta do backend:', data);
        if (data.sucesso) { // Supondo que o backend retorna { sucesso: true } em caso de sucesso
            alert('Senha alterada com sucesso! Você será redirecionado.'); // Mensagem de sucesso
            // Ocultar a div de troca de senha
            document.getElementById('carregandocerto').style.display = 'none';
            // Ocultar a div de login principal (se ainda estiver visível por algum motivo)
             const divLoginPrincipal = document.getElementById('principal'); // Ou o ID correto da sua div de login inicial
             if(divLoginPrincipal) {
                divLoginPrincipal.style.display = 'none';
             }
             const divCadastroPrincipal = document.getElementById('cadastro'); // Ou o ID correto da sua div de cadastro
             if(divCadastroPrincipal) {
                divCadastroPrincipal.style.display = 'none';
             }


            // 5. Redirecionar o usuário para a página principal ou de dashboard
            window.location.href = '/pagina-principal.html'; // SUBSTITUA PELO ENDEREÇO DA SUA PÁGINA PRINCIPAL

        } else {
            // Lidar com falhas reportadas pelo backend (ex: senha atual incorreta)
             if (mensagemErroDiv) {
                mensagemErroDiv.textContent = data.mensagem || 'Erro ao trocar a senha. Verifique os dados.'; // Exibe mensagem do backend
             }
        }
    })
    .catch(error => {
        // 6. Lidar com erros na requisição (ex: problema de rede, erro no servidor)
        console.error('Erro na requisição:', error);
         if (mensagemErroDiv) {
            mensagemErroDiv.textContent = 'Ocorreu um erro ao processar sua solicitação. Tente novamente.';
         }
    });
}