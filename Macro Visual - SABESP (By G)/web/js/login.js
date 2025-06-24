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
    // Seleciona o slide correto para os termos (o segundo slide-switch na tela de login)
    const slideSwitches = document.querySelectorAll('.slide-switch input[type="checkbox"]');
    // O segundo slide é o de termos de licença
    const termosSlider = slideSwitches[1];
    const inputemail = document.getElementById('email');
    const inputsenha = document.getElementById('password');

    mensagemErroElement.innerText = '';

    // Validação do aceite dos termos (slider)
    if (!termosSlider || !termosSlider.checked) {
        mensagemErroElement.innerText = 'Você deve aceitar os termos da licença para continuar.';
        mensagemErroElement.style.display = 'block';
        mensagemErroElement.style.color = 'red';
        mensagemErroElement.style.fontWeight = 'bolder';
        mensagemErroElement.style.opacity = '1';
        mensagemErroElement.style.visibility = 'visible';
        mensagemErroElement.scrollIntoView({behavior: 'smooth', block: 'center'});
        return;
    }

    if (!inputemail || inputemail.value.trim() === '') {
        mensagemErroElement.innerText = 'Você preenche seu email para continuar.';
        mensagemErroElement.style.display = 'block';
        mensagemErroElement.style.color = 'red';
        mensagemErroElement.style.fontWeight = 'bolder';
        mensagemErroElement.style.opacity = '1';
        mensagemErroElement.style.visibility = 'visible';
        mensagemErroElement.scrollIntoView({behavior: 'smooth', block: 'center'});
        return;
    }

    if (!inputsenha || inputsenha.value.trim() === '') {
        mensagemErroElement.innerText = 'Você preenche sua senha para continuar.';
        mensagemErroElement.style.display = 'block';
        mensagemErroElement.style.color = 'red';
        mensagemErroElement.style.fontWeight = 'bolder';
        mensagemErroElement.style.opacity = '1';
        mensagemErroElement.style.visibility = 'visible';
        mensagemErroElement.scrollIntoView({behavior: 'smooth', block: 'center'});
        return;
    }


    principalDiv.style.display = 'none';
    carregandoErradoDiv.style.display = 'none';
    carregandoCertoDiv.style.display = 'none';

    const spinnerCerto = document.querySelector('#carregandocerto .spinner-border');
    const imagemVerificado = document.getElementById('verificado');
    if (spinnerCerto) spinnerCerto.style.display = 'block';
    if (imagemVerificado) imagemVerificado.style.display = 'none';

    carregandoCertoDiv.style.display = 'flex';

    // Chama a função Python - agora retorna um objeto { status: '...', identifier: '...' }
    const resultadoLogin = await eel.verificar_credenciais(email, password)();

    console.log("Resultado do login:", resultadoLogin); // Log para depuração


    // --- Adaptação da lógica baseada no 'status' retornado ---
    if (resultadoLogin && resultadoLogin.status === 'success') {
        // LOGIN BEM-SUCEDIDO (Regular Login)
        console.log("Login bem-suucedido (Regular). Aguardando animação de sucesso...");
        const identificador = resultadoLogin.identifier; // Pega o identificador do objeto retornado
        const userId = resultadoLogin.user_id; // novo campo retornado pelo backend
        sessionStorage.setItem('nomeUsuario', identificador);
        sessionStorage.setItem('user_id', userId); // <-- ESSA LINHA É O QUE FALTAVA!

        await mostrarVerificadoEsumirSpinner(); // Original: Aguarda a animação de sucesso
        console.log("Animação de sucesso completa. Redirecionando para Index...");
        const loginStartTime = Date.now();
        sessionStorage.setItem('sessionStartTime', loginStartTime);
        // Original: Redireciona para index.html usando o identificador
        sessionStorage.setItem('nomeUsuario', identificador);
        window.location.href = `index.html?identificador=${encodeURIComponent(identificador)}&login_time=${loginStartTime}`;

    } else if (resultadoLogin && resultadoLogin.status === 'first_login') {
        // Primeiro login: redireciona para firstlogin.html com o user_id
        const userId = resultadoLogin.identifier;
        window.location.href = `firstlogin.html?identificador=${encodeURIComponent(userId)}&first_login_complete=true`;
        return;
    } else {
        // LOGIN FALHOU (Senha incorreta, usuário não encontrado, erro DB, erro interno, etc.)
        console.log("Login falhou. Status:", resultadoLogin ? resultadoLogin.status : 'unknown'); // Loga o status da falha
        console.log("Exibindo tela de erro...");

        // Original: Oculta a div de sucesso (estado de carregamento)
        carregandoCertoDiv.style.display = 'none';

        // Original: Resetar estado da div de erro antes de mostrá-la
        const spinnerErro = document.querySelector('#carregandoerrado .spinner-border');
        const imagemErro = document.getElementById('nao-verificado');
        if (spinnerErro) spinnerErro.style.display = 'block';
        // Corrigido o nome da variável 'imagemImagemErro' para 'imagemErro'
        if (imagemErro) imagemErro.style.display = 'none';

        // Original: Mostra a div de erro
        carregandoErradoDiv.style.display = 'flex';

        await mostrarErroEsumirSpinner(); // Original: Aguarda a animação de erro

        // Original: Após a animação de erro terminar:
        carregandoErradoDiv.style.display = 'none'; // Oculta a div de erro
        principalDiv.style.display = 'flex'; // Mostra a tela principal de login

        // Define e exibe a mensagem de erro com base no status de falha (opcional, mas recomendado)
        let errorMessage = 'Email ou senha incorretos.'; // Mensagem padrão para 'incorrect_password'

        if (resultadoLogin) {
            if (resultadoLogin.status === 'user_not_found') {
                 errorMessage = 'Usuário não encontrado.';
            } else if (resultadoLogin.status === 'db_error' || resultadoLogin.status === 'internal_error') {
                 errorMessage = 'Ocorreu um erro no servidor. Tente novamente.';
            }
            // 'incorrect_password' usará a mensagem padrão
        }
        // Original: Exibe a mensagem de erro
        setTimeout(() => {
            mensagemErroElement.innerText = errorMessage;
            mensagemErroElement.style.display = 'block';
            mensagemErroElement.style.color = 'red';
            mensagemErroElement.style.fontWeight = 'bolder';
            mensagemErroElement.style.opacity = '1';
            mensagemErroElement.style.visibility = 'visible';
            mensagemErroElement.style.zIndex = '9999';
            mensagemErroElement.classList && mensagemErroElement.classList.remove('fade-out', 'fade-in', 'invisible', 'hidden');
            mensagemErroElement.scrollIntoView({behavior: 'smooth', block: 'center'});
        }, 100);
    }
}

// Mantido o restante das suas funções e código
function mostrarCadastro() {
    console.log("Mostrar formulário de cadastro");
}

// Corrigido o ID para 'carregandocerto'
const carregandoCertoDiv = document.getElementById('carregandocerto');
const carregandoErradoDiv = document.getElementById('carregandoerrado');

// Mantido o código de observação de mutação (verifique se ele ainda é necessário no seu fluxo)
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
// Corrigido o ID para 'carregandocerto'
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


function validarEmail(email) {
    // Regex simples para validar formato de e-mail
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

async function verificarLogindasd() {
    const cargo = document.getElementById('cargo').value;
    const nome = document.getElementById('nome').value;
    const emailUsuario = document.getElementById('email2').value;
    const matricula = document.getElementById('matricula').value;
    const concordoTermos = document.getElementById('input222').checked;
    const mensagemErroValidacaoInicial = document.getElementById('mensagem-4');
    // #carregandoprocesso: A div que aparece DURANTE o processo
    const carregandoprocessoDiv = document.getElementById('carregandoprocessando');
    // #mensagem-3: O parágrafo dentro de carregandoprocesso para mensagens de PROCESSANDO e ERRO do backend (VISÍVEL DURANTE O PROCESSO)
    const mensagemResultadoElement = document.getElementById('mensagem-3');
    // #cadastro: A div da tela de cadastro
    const cadastroDiv = document.getElementById('cadastro');
    // Ícones e Spinner dentro de #carregandoprocesso
    const iconeNaoVerificado = document.getElementById('nao-verificado2');
    const iconeVerificado = document.getElementById('verificado2');
    const spinnerprocessando = document.getElementById('spinerproc');
    // #mensagem-5: Para mensagens de SUCESSO (no formulário de cadastro) 
    const divcerto = document.getElementById('mensagem-5');
    const tituloprincipal = document.getElementById('tituloprinc');


    // *** NOVO: Resetar o estado inicial da interface no início da função ***
    // Limpa mensagens e reseta estilos para #mensagem-4 (validação inicial e erro final)
    if (mensagemErroValidacaoInicial) {
        mensagemErroValidacaoInicial.innerText = '';
        mensagemErroValidacaoInicial.style.color = ''; // Limpa cor anterior
        mensagemErroValidacaoInicial.style.display = 'none'; // Garante que está oculta
         mensagemErroValidacaoInicial.style.fontWeight = 'normal'; // Fonte normal
    }
    // Limpa mensagens e reseta estilos para #mensagem-5 (sucesso final)
     if (divcerto) {
        divcerto.innerText = '';
        divcerto.style.color = ''; // Limpa cor anterior
        divcerto.style.display = 'none'; // Garante que está oculta
         divcerto.style.fontWeight = 'normal'; // Fonte normal
    }
    // Limpa mensagens e reseta estilos para #mensagem-3 (processando/erro backend DURANTE processo)
    if (mensagemResultadoElement) {
        mensagemResultadoElement.innerText = '';
        mensagemResultadoElement.style.color = 'black'; // Cor padrão neutra
        mensagemResultadoElement.style.fontWeight = 'normal'; // Fonte normal
        mensagemResultadoElement.style.display = 'none'; // Garante que está oculto
    }

    // Oculta a tela de carregamento e garante que a de cadastro está visível
    if (carregandoprocessoDiv) carregandoprocessoDiv.style.display = 'none';
    if (cadastroDiv) {
        cadastroDiv.style.display = 'flex'; // ou 'block'
        cadastroDiv.style.opacity = '1'; // Garante que a div de cadastro está totalmente visível
         // Remove classes de transição caso estivessem aplicadas de um fluxo anterior
         cadastroDiv.classList.remove('fade-in', 'fade-out');
    }

    // Oculta o spinner e os ícones de resultado (reset na tela de carregamento)
    if (spinnerprocessando) spinnerprocessando.style.display = 'none';
    if (iconeVerificado) iconeVerificado.style.display = 'none';
    if (iconeNaoVerificado) iconeNaoVerificado.style.display = 'none';
    // *** Fim do Reset Inicial ***


    // ** Validação inicial (usa #mensagem-4 na tela de cadastro) **
    // Se a validação falhar, a mensagem de erro aparece em #mensagem-4
    if (!cargo || !nome || !emailUsuario || !matricula) {
        if (mensagemErroValidacaoInicial) {
            mensagemErroValidacaoInicial.innerText = 'Preencha todos os campos obrigatórios.';
            mensagemErroValidacaoInicial.style.display = 'block';
            mensagemErroValidacaoInicial.style.color = 'red';
            mensagemErroValidacaoInicial.style.fontWeight = 'bolder';
            mensagemErroValidacaoInicial.style.opacity = '1';
            mensagemErroValidacaoInicial.style.visibility = 'visible';
        }
        return;
    }
    if (!validarEmail(emailUsuario)) {
        if (mensagemErroValidacaoInicial) {
            mensagemErroValidacaoInicial.innerText = 'E-mail inválido!';
            mensagemErroValidacaoInicial.style.display = 'block';
            mensagemErroValidacaoInicial.style.color = 'red';
            mensagemErroValidacaoInicial.style.fontWeight = 'bolder';
            mensagemErroValidacaoInicial.style.opacity = '1';
            mensagemErroValidacaoInicial.style.visibility = 'visible';
        }
        return;
    }
    if (!/^[0-9]+$/.test(matricula)) {
        if (mensagemErroValidacaoInicial) {
            mensagemErroValidacaoInicial.innerText = 'A matrícula deve conter apenas números.';
            mensagemErroValidacaoInicial.style.display = 'block';
            mensagemErroValidacaoInicial.style.color = 'red';
            mensagemErroValidacaoInicial.style.fontWeight = 'bolder';
            mensagemErroValidacaoInicial.style.opacity = '1';
            mensagemErroValidacaoInicial.style.visibility = 'visible';
        }
        return;
    }
    if (!concordoTermos) {
        if (mensagemErroValidacaoInicial) {
            mensagemErroValidacaoInicial.innerText = 'Você deve concordar com os termos da licença.';
            mensagemErroValidacaoInicial.style.display = 'block';
            mensagemErroValidacaoInicial.style.color = 'red';
            mensagemErroValidacaoInicial.style.fontWeight = 'bolder';
            mensagemErroValidacaoInicial.style.opacity = '1';
            mensagemErroValidacaoInicial.style.visibility = 'visible';
        }
        return;
    }

    // Se a validação passar, oculta a mensagem de validação inicial
    if (mensagemErroValidacaoInicial) mensagemErroValidacaoInicial.style.display = 'none';


    // Dados a serem enviados
    const dadosCadastro = {
        cargo: cargo,
        nome: nome,
        emailUsuario: emailUsuario,
        matricula: matricula,
        concordoTermos: concordoTermos
    };

    const destinatarioFixo = 'guilherme.spereira42@senacsp.edu.br';

    // Variável para armazenar a mensagem de erro antes de voltar
    let mensagemErroParaCadastro = '';

    try {

        tituloprincipal.innerText = 'Validando Dados e Criando Solicitação...';
        // *** Ações antes de chamar o backend (mostrar tela de carregamento) ***
        // Oculta a tela de cadastro (agora que a validação passou)
        if (cadastroDiv) cadastroDiv.style.display = 'none';
        // Exibe a tela de carregamento/processamento
        if (carregandoprocessoDiv) carregandoprocessoDiv.style.display = 'flex'; // ou 'block'


        // Mostra o Spinner e Oculta os Ícones de Resultado para o estado "processando"
        if (spinnerprocessando) spinnerprocessando.style.display = 'block'; // Mostra o spinner
        if (iconeVerificado) iconeVerificado.style.display = 'none'; // Oculta o ícone verde
        if (iconeNaoVerificado) iconeNaoVerificado.style.display = 'none'; // Oculta o ícone vermelho

        // Exibe a mensagem de "Processando..." no parágrafo #mensagem-3 (CORRETO)
        if (mensagemResultadoElement) {
            mensagemResultadoElement.style.color = 'blue'; // Cor para a mensagem de processando
            mensagemResultadoElement.style.fontWeight = 'bolder'; // Fonte normal para processando
            mensagemResultadoElement.innerText = 'Processando solicitação e enviando emails automáticos...';
             mensagemResultadoElement.style.display = 'block'; // Garante que a mensagem de processando aparece
        }
        // *** REMOVIDO: Estava definindo a mensagem de processando no elemento de validação (#mensagem-4) ***
        // if(mensagemErroValidacaoInicial) mensagemErroValidacaoInicial.innerText = 'Processando solicitação e enviando emails automáticos...';


        // *** Fim das ações pré-backend ***


        // Chama a função Python
        const resultadoEnvio = await eel.enviar_email_cadastro_automatico(dadosCadastro, destinatarioFixo)();

        // Oculta o spinner após o resultado
        if (spinnerprocessando) spinnerprocessando.style.display = 'none';


        // Processa o resultado retornado pelo Python
        if (resultadoEnvio && resultadoEnvio.sucesso) {
            // --- CASO DE SUCESSO ---
            const numeroChamado = resultadoEnvio.numeroChamado || 'Não especificado';

            // Configura a mensagem de sucesso na tela de processamento (#mensagem-3) temporariamente
             if (mensagemResultadoElement) {
                mensagemResultadoElement.style.color = 'green'; // Cor verde para sucesso
                mensagemResultadoElement.style.fontWeight = 'bolder'; // Fonte negrito
                tituloprincipal.innerText = 'Solicitação Realizada';
                mensagemResultadoElement.innerText = `Solicitação processada com sucesso! Chamado ${numeroChamado} criado.`; // Mensagem breve na tela de processamento
                 mensagemResultadoElement.style.display = 'block'; // Garante que a mensagem de sucesso aparece em #mensagem-3
            }


            // Mostra o ícone verde de sucesso e esconde o de erro
            if (iconeVerificado) iconeVerificado.style.display = 'flex'; // MOSTRA O ÍCONE VERDE
            if (iconeNaoVerificado) iconeNaoVerificado.style.display = 'none'; // ESCONDE O ÍCONE VERMELHO


             // *** Ação Final: Voltar para o formulário após um tempo (SUCESSO) ***
             setTimeout(() => {
                 if (carregandoprocessoDiv) carregandoprocessoDiv.style.display = 'none'; // Oculta a tela de carregamento

                 // *** Configura a mensagem de sucesso FINAL (no elemento #mensagem-5 - divcerto) no formulário de cadastro ***
                 if (divcerto) {
                    divcerto.style.color = 'green'; // Cor verde para sucesso
                    divcerto.style.fontWeight = 'bolder'; // Fonte negrito
                    tituloprincipal.innerText = 'Solicitação Realizada';
                    divcerto.innerText = `Solicitação de cadastro processada com sucesso! Chamado ${numeroChamado} criado. Um e-mail de confirmação foi enviado para ${emailUsuario}.`;
                    divcerto.style.display = 'block'; // Mostra a mensagem de sucesso no formulário
                 }

                 if (cadastroDiv) {
                    cadastroDiv.style.display = 'flex'; // ou 'block' // Exibe a tela de cadastro novamente
                    cadastroDiv.style.opacity = '1'; // Garante opacidade 1 ao voltar
                 }
                 // Limpa o estado da tela de carregamento para a próxima vez
                 if (mensagemResultadoElement) {
                     mensagemResultadoElement.innerText = '';
                     mensagemResultadoElement.style.fontWeight = 'normal';
                     mensagemResultadoElement.style.display = 'none'; // Oculta a mensagem de #mensagem-3 ao voltar
                 }
                 if (iconeVerificado) iconeVerificado.style.display = 'none';
                 if (iconeNaoVerificado) iconeNaoVerificado.style.display = 'none';
                 if (spinnerprocessando) spinnerprocessando.style.display = 'none'; // Garante que o spinner está oculto

                 // Certifica que a mensagem de erro de validação (#mensagem-4) está limpa e oculta ao voltar
                 if (mensagemErroValidacaoInicial) {
                     mensagemErroValidacaoInicial.innerText = '';
                     mensagemErroValidacaoInicial.style.display = 'none';
                 }

                 // Opcional: Limpar o formulário após sucesso (chame aqui se quiser que limpe APENAS no sucesso)
                 // limparCamposFormulario('login-form2');

             }, 3000); // Tempo em milissegundos (3 segundos)


        } else {
            // --- CASO DE FALHA REPORTADA PELO BACKEND ---

            // Configura a mensagem de ERRO DURANTE O PROCESSO (no elemento correto #mensagem-3)
            const numeroChamado = resultadoEnvio ? resultadoEnvio.numeroChamado || 'Não especificado' : 'Não especificado';
            const mensagemDoBackend = resultadoEnvio ? resultadoEnvio.mensagem : 'Erro desconhecido pelo backend';

            // *** SIMPLIFICADO: Constrói a mensagem de erro usando template literals ***
            const errorMessage = `Erro ao processar sua solicitação (Falha no envio de e-mails)`;
            // *** FIM DA SIMPLIFICAÇÃO ***


            // Configura a mensagem de ERRO DURANTE O PROCESSO (no elemento correto #mensagem-3)
             if (mensagemResultadoElement) {
                mensagemResultadoElement.style.color = 'red'; // Cor vermelha para erro
                mensagemResultadoElement.style.fontWeight = 'bolder'; // Fonte negrito
                tituloprincipal.innerText = 'Solicitação Falhou'
                mensagemResultadoElement.innerText = errorMessage; // Mensagem na tela de processamento
                 mensagemResultadoElement.style.display = 'block'; // Garante que a mensagem de erro aparece em #mensagem-3
             }

            console.error("Erro no envio de emails via Python:", resultadoEnvio);

            // Mostra o ícone vermelho de erro e esconde o verde de sucesso
            if (iconeVerificado) iconeVerificado.style.display = 'none'; // Esconde o verde
            if (iconeNaoVerificado) iconeNaoVerificado.style.display = 'flex'; // Mostra o vermelho

             // Oculta o spinner após exibir ícone de resultado
             if (spinnerprocessando) spinnerprocessando.style.display = 'none';

            // *** Captura a mensagem de erro para exibir no formulário de cadastro depois ***
             mensagemErroParaCadastro = errorMessage;


            // *** Ação Final: Voltar para o formulário após um tempo (FALHA BACKEND) ***
            setTimeout(function() {
                if (carregandoprocessoDiv) carregandoprocessoDiv.style.display = 'none';

                // *** Configura a mensagem de ERRO FINAL (no elemento #mensagem-4) no formulário de cadastro ***
                 if (mensagemErroValidacaoInicial && mensagemErroParaCadastro) {
                    mensagemErroValidacaoInicial.innerText = mensagemErroParaCadastro;
                    mensagemErroValidacaoInicial.style.color = 'red'; // Cor vermelha para erro final
                    mensagemErroValidacaoInicial.style.fontWeight = 'bolder'; // Fonte negrito
                    mensagemErroValidacaoInicial.style.display = 'block'; // Mostra a mensagem de erro no formulário
                 }
                 // Garante que a mensagem de sucesso (#mensagem-5) está oculta
                 if (divcerto) divcerto.style.display = 'none';


                if (cadastroDiv) {
                    cadastroDiv.style.display = 'flex'; // ou 'block'
                    cadastroDiv.style.opacity = '1'; // Garante opacidade 1 ao voltar
                }
                 // Limpa o estado da tela de carregamento para a próxima vez
                 if (mensagemResultadoElement) {
                     mensagemResultadoElement.innerText = '';
                     mensagemResultadoElement.style.fontWeight = 'normal';
                     mensagemResultadoElement.style.display = 'none'; // Oculta a mensagem de #mensagem-3 ao voltar
                 }
                 if (iconeVerificado) iconeVerificado.style.display = 'none';
                 if (iconeNaoVerificado) iconeNaoVerificado.style.display = 'none';
                 if (spinnerprocessando) spinnerprocessando.style.display = 'none'; // Garante que o spinner está oculto


            }, 3000); // 3000 milissegundos = 3 segundos

        }

    } catch (e) {
        // --- CASO DE ERRO NA COMUNICAÇÃO EEL OU INESPERADO ---

        // Configura a mensagem de ERRO DURANTE O PROCESSO (no elemento correto #mensagem-3)
         let communicationError = 'Ocorreu um erro inesperado ou na comunicação com o sistema. Tente novamente.';
         if (mensagemResultadoElement) {
            mensagemResultadoElement.style.color = 'red'; // Cor vermelha para erro
            mensagemResultadoElement.style.fontWeight = 'bolder'; // Fonte negrito
            mensagemResultadoElement.innerText = communicationError; // Mensagem na tela de processamento
             mensagemResultadoElement.style.display = 'block'; // Garante que a mensagem de erro aparece em #mensagem-3
         }

        console.error("Erro na chamada Eel ou inesperado:", e);

        // Oculta spinner e mostra ícone vermelho de erro
        if (spinnerprocessando) spinnerprocessando.style.display = 'none'; // Oculta o spinner
        if (iconeVerificado) iconeVerificado.style.display = 'none'; // Esconde o verde
        if (iconeNaoVerificado) iconeNaoVerificado.style.display = 'flex'; // Mostra o vermelho

        // *** Captura a mensagem de erro para exibir no formulário de cadastro depois ***
         mensagemErroParaCadastro = communicationError;


        // *** Ação Final: Voltar para o formulário após um tempo (ERRO DE COMUNICAÇÃO) ***
        setTimeout(function() {
            if (carregandoprocessoDiv) carregandoprocessoDiv.style.display = 'none';

            // *** Configura a mensagem de ERRO FINAL (no elemento #mensagem-4) no formulário de cadastro ***
             if (mensagemErroValidacaoInicial && mensagemErroParaCadastro) {
                mensagemErroValidacaoInicial.innerText = mensagemErroParaCadastro;
                mensagemErroValidacaoInicial.style.color = 'red'; // Cor vermelha para erro final
                 mensagemErroValidacaoInicial.style.fontWeight = 'bolder'; // Fonte negrito
                mensagemErroValidacaoInicial.style.display = 'block'; // Mostra a mensagem de erro no formulário
             }
             // Garante que a mensagem de sucesso (#mensagem-5) está oculta
             if (divcerto) divcerto.style.display = 'none';


            if (cadastroDiv) {
                cadastroDiv.style.display = 'flex'; // ou 'block'
                 cadastroDiv.style.opacity = '1'; // Garante opacidade 1 ao voltar
            }
             // Limpa o estado da tela de carregamento para a próxima vez
            if (mensagemResultadoElement) {
                 mensagemResultadoElement.innerText = '';
                 mensagemResultadoElement.style.fontWeight = 'normal';
                 mensagemResultadoElement.style.display = 'none'; // Oculta a mensagem de #mensagem-3 ao voltar
             }
            if (iconeVerificado) iconeVerificado.style.display = 'none';
            if (iconeNaoVerificado) iconeNaoVerificado.style.display = 'none';
             if (spinnerprocessando) spinnerprocessando.style.display = 'none'; // Garante que o spinner está oculto

        }, 3000); // 3000 milissegundos = 3 segundos
    }
    // O setTimeout agora está dentro dos blocos if/else/catch.
} // Fim da função verificarLogindasd

// Função para verificar a versão do aplicativo
async function checkAppVersionForUpdate() {
    console.log("[login.js] Iniciando verificação de versão do aplicativo.");
    const localAppVersion = "1.0.5"; // Defina a versão atual do seu aplicativo aqui
    const divAtualizar = document.getElementById('divatualizar');
    const principalDiv = document.getElementById('principal'); // A div principal do conteúdo

    if (!divAtualizar || !principalDiv) {
        console.error("[login.js] Elementos 'divatualizar' ou 'principal' não encontrados.");
        return;
    }

    try {
        const response = await eel.get_atualicao_app()();
        console.log("[login.js] Resposta do backend para get_atualicao_app:", response);

        if (response.status === "success" && response.versao) {
            const backendVersion = response.versao;
            console.log(`[login.js] Versão local: ${localAppVersion}, Versão do backend: ${backendVersion}`);

            if (localAppVersion !== backendVersion) {
                console.log("[login.js] Versões diferentes! Iniciando animação de fade-out do login e fade-in da atualização.");
                
                // 1. Iniciar fade-out da principalDiv
                principalDiv.classList.add('fade-out');
                // Garante que a principalDiv está visível para o fade-out funcionar
                principalDiv.style.opacity = '1'; 
                principalDiv.classList.remove('fade-in'); // Remove a classe de fade-in caso esteja presente

                // 2. Após a transição de fade-out, esconder principalDiv e mostrar divAtualizar com fade-in
                setTimeout(() => {
                    principalDiv.style.display = 'none';
                    principalDiv.classList.remove('fade-out'); // Remove a classe fade-out para reutilização

                    divAtualizar.style.display = 'flex'; // Torna visível para aplicar o fade-in
                    // Garante que a divAtualizar começa com opacidade 0 antes de aplicar o fade-in
                    divAtualizar.style.opacity = '0'; 
                    divAtualizar.classList.add('fade-in'); // Aplica o fade-in
                }, 500); // Duração do fade-out (0.5s)

            } else {
                console.log("[login.js] Versões iguais. Nenhuma atualização necessária. Garantindo que o login esteja visível.");
                
                // 1. Esconder divAtualizar (sem fade-out, apenas display: none)
                if (divAtualizar.style.display !== 'none') {
                    divAtualizar.classList.remove('fade-in'); // Remove fade-in se estiver presente
                    divAtualizar.style.display = 'none'; // Oculta imediatamente
                    divAtualizar.style.opacity = ''; // Reseta a opacidade
                }

                // 2. Mostrar principalDiv com fade-in (se não estiver visível ou oculta por fade-out)
                if (principalDiv.style.display === 'none' || principalDiv.classList.contains('fade-out')) {
                    principalDiv.style.display = 'flex'; // Torna visível
                    principalDiv.style.opacity = '0'; // Garante que começa com opacidade 0 para o fade-in
                    principalDiv.classList.remove('fade-out'); // Remove fade-out se estiver presente
                    principalDiv.classList.add('fade-in'); // Aplica o fade-in
                } else {
                     // Se já estiver visível e sem fade-out, apenas garanta opacidade total
                    principalDiv.classList.remove('fade-in');
                    principalDiv.style.opacity = '1';
                }
            }
        } else {
            console.warn("[login.js] Não foi possível obter a versão do backend ou status não é sucesso. Mantendo login visível e garantindo que divAtualizar esteja oculta.");
            divAtualizar.style.display = 'none'; // Oculta a div se não houver versão ou erro
            divAtualizar.classList.remove('fade-in'); // Garante que não há classe fade-in
            divAtualizar.style.opacity = '';

            principalDiv.style.display = 'flex'; // Garante que o conteúdo principal esteja visível
            principalDiv.style.opacity = '0'; // Garante que começa com opacidade 0 para o fade-in
            principalDiv.classList.remove('fade-out');
            principalDiv.classList.add('fade-in'); // Aplica o fade-in para a div principal
        }
    } catch (e) {
        console.error("[login.js] Erro ao chamar eel.get_atualicao_app:", e);
        // Em caso de erro, garante que a div de atualização esteja oculta e o login visível
        divAtualizar.style.display = 'none';
        divAtualizar.classList.remove('fade-in');
        divAtualizar.style.opacity = '';

        principalDiv.style.display = 'flex';
        principalDiv.style.opacity = '0';
        principalDiv.classList.remove('fade-out');
        principalDiv.classList.add('fade-in');
    }
}


document.addEventListener('DOMContentLoaded', async function () {
    console.log('DOMContentLoaded disparado em login.js.');
    // Chama a função de verificação de versão logo no carregamento da página de login
    await checkAppVersionForUpdate();
});

function mostrarframa(){
    var container = document.getElementById('iframeLicencaContainer');
    if (container) {
        container.style.display = 'block';
        // Adiciona um listener para fechar ao clicar fora
        setTimeout(function() {
            document.addEventListener('mousedown', fecharIframeAoClicarFora);
        }, 10);
    }
}

function fecharIframeAoClicarFora(event) {
    var container = document.getElementById('iframeLicencaContainer');
    if (container && container.style.display === 'block') {
        // Só fecha se o clique não for dentro do container
        if (!container.contains(event.target)) {
            container.style.display = 'none';
            document.removeEventListener('mousedown', fecharIframeAoClicarFora);
        }
    }
}

function fecharIframeLicenca(){
    var container = document.getElementById('iframeLicencaContainer');
    if (container) {
        container.style.display = 'none';
        document.removeEventListener('mousedown', fecharIframeAoClicarFora);
    }
}
