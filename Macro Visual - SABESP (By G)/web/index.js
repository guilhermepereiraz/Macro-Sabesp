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
    const macro = document.getElementById('macro');
    const macrosite = document.getElementById('macrosite');
    const siteProssDiv = document.getElementById('sitepross2');
    const sitePopupDiv = document.getElementById('sitepopup');
    const siteFinishDiv = document.getElementById('sitefinish');
    const conclusaosite = document.getElementById('siteconclusao');

    console.log("Elemento 'macro' encontrado:", macro);
    console.log("Elemento 'macrosite' encontrado:", macrosite);
    console.log("Elemento 'siteProssDiv' encontrado:", siteProssDiv);
    console.log("Elemento 'sitepopup' encontrado:", sitePopupDiv);
    console.log("Elemento 'sitefinish' encontrado:", siteFinishDiv);

    if (macro && macrosite && siteProssDiv && sitePopupDiv && siteFinishDiv) {
        if (siteProssDiv.style.display === 'block' || sitePopupDiv.style.display === 'block' || conclusaosite.style.display == 'block' || siteFinishDiv.style.display === 'block') {
            console.log("Uma das divs ('siteProssDiv', 'sitepopup' ou 'sitefinish') está visível. Impedindo a exibição de 'macrosite'.");
            return;
        }
        if (macrosite.style.display === 'none' || macrosite.style.display === '') {
            macrosite.style.display = 'block';
            console.log("Exibindo 'macrosite'.");
        } else {
            console.log("'macrosite' já está visível.");
        }
    } else {
        console.error("Um ou mais elementos com IDs não foram encontrados.");
    }
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
