function mostrarVerificadoEsumirSpinner() {
    return new Promise(resolve => {
        const spinner = document.querySelector('#carregandocerto .spinner-border');
        const imagemVerificado = document.getElementById('verificado');

        if (spinner && spinner.style.display !== 'none') {
            // Passo 1: Spinner visível por 3 segundos
            setTimeout(() => { // <-- Primeiro timer de 3000ms (3 segundos)
                if (spinner) {
                    spinner.style.display = 'none'; // Esconde o spinner
                }
                if (imagemVerificado) {
                    imagemVerificado.style.display = 'block'; // Mostra a imagem

                    // Passo 2: Imagem visível por mais 3 segundos
                    setTimeout(() => { // <-- Segundo timer de 3000ms (3 segundos)
                        // Opcional: Se quiser esconder a imagem após os 3s dela
                        // if (imagemVerificado) {
                        //     imagemVerificado.style.display = 'none';
                        // }
                        resolve(); // Resolve a promise após a duração da imagem
                    }, 2000); // A imagem fica visível por 3 segundos
                } else {
                    // Se a imagem não for encontrada, espera 3s de onde ela estaria antes de resolver
                     setTimeout(() => {
                         resolve();
                    }, 2000);
                }
            }, 2000); // O spinner fica visível por 3 segundos
        } else {
             // Se o spinner não estiver visível, resolve imediatamente
             resolve();
        }
    });
}

function mostrarErroEsumirSpinner() {
     return new Promise(resolve => {
        const spinner = document.querySelector('#carregandoerrado .spinner-border');
        const imagemErro = document.getElementById('nao-verificado');
        const carregandoErradoDiv = document.getElementById('carregandoerrado');

        if (carregandoErradoDiv && carregandoErradoDiv.style.display !== 'none') {
            // Passo 1: Spinner visível por 3 segundos
            setTimeout(() => {
                if (spinner && spinner.style.display !== 'none') {
                    spinner.style.display = 'none'; // Esconde o spinner
                }

                if (imagemErro) {
                    imagemErro.style.display = 'block'; // Mostra a imagem

                    // Passo 2: Imagem visível por mais 3 segundos
                    setTimeout(() => {
                         // Opcional: Se quiser esconder a imagem após os 3s dela
                        // if (imagemErro) {
                        //     imagemErro.style.display = 'none';
                        // }
                         resolve(); // Resolve a promise após a duração da imagem
                    }, 2000); // A imagem fica visível por 3 segundos
                } else {
                     // Se a imagem não for encontrada, espera 3s de onde ela estaria antes de resolver
                    setTimeout(() => {
                         resolve();
                    }, 2000); // Espera 3s de onde a imagem *estaria*
                }
            }, 2000); // O spinner fica visível por 3 segundos
        } else {
            // Se a div de erro não estiver visível, resolve imediatamente
            resolve();
        }
     });
}

async function verificarLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const mensagemErroElement = document.getElementById('mensagem-erro');
    const principalDiv = document.getElementById('principal');
    const carregandoCertoDiv = document.getElementById('carregandocerto');
    const carregandoErradoDiv = document.getElementById('carregandoerrado');

    mensagemErroElement.innerText = '';

    principalDiv.style.display = 'none';
    carregandoErradoDiv.style.display = 'none';
    // Garante que a div de sucesso esteja oculta antes de resetar e mostrar
    carregandoCertoDiv.style.display = 'none';


    // --- NOVO: Resetar estado da div de sucesso antes de mostrá-la ---
    const spinnerCerto = document.querySelector('#carregandocerto .spinner-border');
    const imagemVerificado = document.getElementById('verificado');
    if (spinnerCerto) spinnerCerto.style.display = 'block'; // Define o spinner de sucesso como visível
    if (imagemVerificado) imagemVerificado.style.display = 'none'; // Define a imagem de sucesso como oculta
    // --------------------------------------------------------------

    carregandoCertoDiv.style.display = 'flex'; // Mostra a div de sucesso


    const identificador = await eel.verificar_credenciais(email, password)();

    if (identificador) {
        // LOGIN BEM-SUCEDIDO
        console.log("Login bem-sucedido. Aguardando animação de sucesso...");
        await mostrarVerificadoEsumirSpinner(); // Aguarda a animação (3s spinner + 3s imagem)
        console.log("Animação de sucesso completa. Redirecionando...");
        window.location.href = `index.html?identificador=${encodeURIComponent(identificador)}`;
    } else {
        // LOGIN FALHOU
        console.log("Login falhou. Exibindo tela de erro...");

        carregandoCertoDiv.style.display = 'none'; // Oculta a div de sucesso

        // Resetar estado da div de erro antes de mostrá-la (já tínhamos feito isso)
        const spinnerErro = document.querySelector('#carregandoerrado .spinner-border');
        const imagemErro = document.getElementById('nao-verificado');
        if (spinnerErro) spinnerErro.style.display = 'block'; // Define o spinner de erro como visível
        if (imagemErro) imagemErro.style.display = 'none'; // Define a imagem de erro como oculta

        carregandoErradoDiv.style.display = 'flex'; // Mostra a div de erro

        await mostrarErroEsumirSpinner(); // Aguarda a animação de erro (3s spinner + 3s imagem)

        // Após a animação de erro terminar:
        carregandoErradoDiv.style.display = 'none'; // Oculta a div de erro
        principalDiv.style.display = 'flex'; // Mostra a tela principal de login
        mensagemErroElement.innerText = 'Email ou senha incorretos.'; // Exibe a mensagem de erro
    }
}

function mostrarCadastro() {
    console.log("Mostrar formulário de cadastro");
}

const carregandoCertoDiv = document.getElementById('carregandocerto');
const carregandoErradoDiv = document.getElementById('carregandoerrado');

if (carregandoCertoDiv && carregandoCertoDiv.style.display !== 'none') {
    mostrarVerificadoEsumirSpinner();
}

if (carregandoErradoDiv && carregandoErradoDiv.style.display !== 'none') {
     mostrarErroEsumirSpinner();
}

const observerCerto = new MutationObserver(function(mutationsList, observer) {
    for (const mutation of mutationsList) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
            const targetElement = mutation.target;
            if (targetElement.style.display !== 'none') {
                mostrarVerificadoEsumirSpinner();
            }
        }
    }
});
 if (carregandoCertoDiv) {
    observerCerto.observe(carregandoCertoDiv, { attributes: true, attributeFilter: ['style'] });
}

const observerErro = new MutationObserver(function(mutationsList, observer) {
    for (const mutation of mutationsList) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
            const targetElement = mutation.target;
             if (targetElement.style.display !== 'none') {
                 mostrarErroEsumirSpinner();
            }
        }
    }
});
 if (carregandoErradoDiv) {
     observerErro.observe(carregandoErradoDiv, { attributes: true, attributeFilter: ['style'] });
 }

 function mostrarCadastro() {
    const principalDiv = document.getElementById('principal');
    const cadastroDiv = document.getElementById('cadastro');
    const mensagemErroElement = document.getElementById('mensagem-erro'); // Pega a mensagem de erro do login

    if (principalDiv && cadastroDiv) {
        // Limpa os campos do formulário de login antes de esconder a div principal
        limparCamposFormulario('login-form');
        // Limpa a mensagem de erro do login
        if (mensagemErroElement) {
            mensagemErroElement.innerText = '';
        }

        // Limpa classes de transição anteriores para resetar o estado
        principalDiv.classList.remove('fade-in', 'fade-out');
        cadastroDiv.classList.remove('fade-in', 'fade-out');

        // 1. Inicia a transição de saída para a div principal
        principalDiv.classList.add('fade-out');

        // Espera a transição da div principal terminar (agora com 100ms, conforme seu código)
        setTimeout(() => {
            // Após a div principal ter sumido (opacidade 0), remove ela do layout
            principalDiv.style.display = 'none';

            // 2. Prepara a div cadastro para aparecer:
            // Define o display para que ela passe a participar do layout
            cadastroDiv.style.display = 'flex'; // Muda de none para flex

            // Força o browser a reconhecer que o display mudou
            cadastroDiv.offsetWidth; // Força reflow

            // 3. Adiciona a classe para iniciar a transição de entrada da div cadastro
             setTimeout(() => {
                 cadastroDiv.classList.add('fade-in');
             }, 10); // Pequeno atraso (10ms é geralmente suficiente)

        }, 100); // **Usando 100ms conforme o seu código**

        // Opcional: Remova a classe fade-in se a div cadastro já estava visível anteriormente
        // Isso é útil se a função for chamada para alternar entre as telas
        cadastroDiv.classList.remove('fade-in'); // Removido daqui, será adicionado no timeout

    }
}


function mostrarLogin() {
    const principalDiv = document.getElementById('principal');
    const cadastroDiv = document.getElementById('cadastro');
    const mensagemErroElement = document.getElementById('mensagem-erro'); // Pega a mensagem de erro do login

    if (principalDiv && cadastroDiv) {
         // Limpa os campos do formulário de cadastro antes de esconder a div cadastro
        limparCamposFormulario('login-form2');
         // Se houver uma mensagem de erro na tela de cadastro, limpe-a aqui (assumindo um ID, ex: mensagem-erro-cadastro)
         // const mensagemErroCadastroElement = document.getElementById('mensagem-erro-cadastro');
         // if (mensagemErroCadastroElement) {
         //    mensagemErroCadastroElement.innerText = '';
         // }


        // Limpa classes de transição anteriores para resetar o estado
        principalDiv.classList.remove('fade-in', 'fade-out');
        cadastroDiv.classList.remove('fade-in', 'fade-out');

        // 1. Inicia a transição de saída para a div cadastro
        cadastroDiv.classList.add('fade-out');

        // Espera a transição da div cadastro terminar (agora com 500ms, conforme seu código)
        setTimeout(() => {
            // Após a div cadastro ter sumido (opacidade 0), remove ela do layout
            cadastroDiv.style.display = 'none';

            // 2. Prepara a div principal para aparecer:
            // Define o display para que ela passe a participar do layout
            principalDiv.style.display = 'flex'; // Muda de none para flex

            // Força o browser a reconhecer que o display mudou
            principalDiv.offsetWidth; // Força reflow

            // 3. Adiciona a classe para iniciar a transição de entrada da div principal
             setTimeout(() => {
                 principalDiv.classList.add('fade-in');
             }, 10); // Pequeno atraso (10ms)

        }, 500); // **Usando 500ms conforme o seu código**

        // Limpa a mensagem de erro do login ao voltar para a tela principal
        if (mensagemErroElement) {
            mensagemErroElement.innerText = '';
        }
    }
}

function limparCamposFormulario(formId) {
    const form = document.getElementById(formId);
    if (form) {
        const inputs = form.querySelectorAll('input, select, textarea, mensagem-erro'); // Inclui select e textarea para maior compatibilidade
        inputs.forEach(input => {
            if (input.type === 'text' || input.type === 'email' || input.type === 'password' || input.tagName === 'TEXTAREA' || input.tagName === 'erromsg') {
                input.value = ''; // Limpa campos de texto, email, senha e textareas
            } else if (input.type === 'checkbox' || input.type === 'radio') {
                input.checked = false; // Desmarca checkboxes e radio buttons
            } else if (input.tagName === 'SELECT') {
                input.selectedIndex = 0; // Seleciona a primeira opção em selects
            }
        });
    }
}

// Solicitar cadastro 


async function verificarLogindasd() { // Mantida como async por causa da chamada Eel
    const cargo = document.getElementById('cargo').value;
    const nome = document.getElementById('nome').value;
    const emailUsuario = document.getElementById('email2').value; // Renomeado para clareza: email do usuário
    const matricula = document.getElementById('matricula').value;
    const concordoTermos = document.getElementById('input222').checked; // Para o checkbox
    const mensagemErroElement = document.getElementById('mensagem-2'); // Elemento para mensagens na tela de cadastro

    // Limpa mensagens de erro anteriores
    mensagemErroElement.innerText = '';
    mensagemErroElement.style.color = 'red'; // Define a cor padrão para erro (usado para erros)

    // **Validação básica**
    if (!cargo || !nome || !emailUsuario || !matricula) { // Use emailUsuario aqui
        mensagemErroElement.innerText = 'Por favor, preencha todos os campos obrigatórios.';
        return;
    }
     if (!concordoTermos) {
         mensagemErroElement.innerText = 'Você deve concordar com os termos da licença.';
         return;
    }
    // Você pode adicionar validações de formato de email, etc. aqui

    // **Dados a serem enviados (para o backend)**
    const dadosCadastro = {
        cargo: cargo,
        nome: nome,
        emailUsuario: emailUsuario,
        matricula: matricula,
        concordoTermos: concordoTermos
    };

    // **Chama a função Python para ENVIAR OS DOIS EMAILS AUTOMÁTICOS**
    // ESTA PARTE REQUER QUE VOCÊ TENHA A FUNÇÃO PYTHON ATUALIZADA PARA ENVIAR AMBOS OS EMAILS
    const destinatarioFixo = 'guilherme.spereira42@senacsp.edu.br'; // Seu destinatário fixo (ainda passado como dado)

    try {
        // Exibe uma mensagem de processamento
        mensagemErroElement.style.color = 'blue';
        mensagemErroElement.innerText = 'Processando solicitação e enviando emails automáticos...';

        // Chama a função Python (esta função agora envia dois emails)
        const resultadoEnvio = await eel.enviar_email_cadastro_automatico(dadosCadastro, destinatarioFixo)();

        // Processa o resultado retornado pelo Python
        if (resultadoEnvio && resultadoEnvio.sucesso) {
            const numeroChamado = resultadoEnvio.numeroChamado || 'Não especificado'; // Pega o número gerado no backend
            mensagemErroElement.style.color = 'green';
            // Mensagem final indicando que ambos os emails foram enviados automaticamente
            mensagemErroElement.innerText = `Solicitação de cadastro processada com sucesso! Chamado ${numeroChamado} criado. Um e-mail de confirmação foi enviado para ${emailUsuario}.`;

             // Opcional: Limpar o formulário após sucesso
             limparCamposFormulario('login-form2');

        } else {
            // Se o backend reportou falha em um ou ambos os envios
            mensagemErroElement.style.color = 'red';
            const numeroChamado = resultadoEnvio ? resultadoEnvio.numeroChamado || 'Não especificado' : 'Não especificado';
             mensagemErroElement.innerText = `Erro ao processar sua solicitação (Falha no envio de e-mails - Chamado ${numeroChamado}): ${resultadoEnvio ? resultadoEnvio.mensagem : 'Erro desconhecido'}`;
            console.error("Erro no envio de emails via Python:", resultadoEnvio);
        }

    } catch (e) {
        // Ocorreu um erro na comunicação Eel
        mensagemErroElement.style.color = 'red';
        mensagemErroElement.innerText = 'Ocorreu um erro na comunicação com o sistema de envio de emails. Tente novamente.';
        console.error("Erro na chamada Eel:", e);
    }
}
