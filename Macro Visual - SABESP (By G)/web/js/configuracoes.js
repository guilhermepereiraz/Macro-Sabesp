document.addEventListener('DOMContentLoaded', function () {
    const detailSections = document.querySelectorAll('.config-detail-section');
    const configGrid = document.querySelector('.config-grid');
    const quickSettingsSection = document.querySelector('.quick-settings-section'); // Nova
    const breadcrumb = document.getElementById('breadcrumb'); // Nova
    const currentSectionSpan = breadcrumb.querySelector('.current-section'); // Nova
    const breadcrumbMainLink = breadcrumb.querySelector('.breadcrumb-item[data-section="main"]'); // Nova

    const toastNotification = document.getElementById('toast-notification');
    const toastText = document.getElementById('toast-text');

    const confirmationModal = document.getElementById('confirmation-modal'); // Novo modal
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalConfirmBtn = document.getElementById('modal-confirm-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    const closeModalBtn = confirmationModal.querySelector('.close-button');

    // Referência ao botão "Voltar à Visão Geral"
    const backToOverviewButtonContainer = document.querySelector('.form-actions.profile-back-button-actions');


    // Inicialmente esconde todas as seções de detalhes e o breadcrumb
    detailSections.forEach(section => {
        section.style.display = 'none';
    });
    breadcrumb.style.display = 'none';
    // Garante que o botão "Voltar à Visão Geral" esteja oculto no carregamento
    if (backToOverviewButtonContainer) {
        backToOverviewButtonContainer.style.display = 'none';
        // Adiciona event listener para garantir que ao clicar, o botão seja ocultado imediatamente
        const backBtn = backToOverviewButtonContainer.querySelector('button');
        if (backBtn) {
            backBtn.addEventListener('click', function () {
                backToOverviewButtonContainer.style.display = 'none';
            });
        }
    }


    // Função para exibir toast notification
    function showToast(message, type = 'success') {
        toastText.textContent = message;
        toastNotification.className = 'toast-message show ' + type;
        setTimeout(() => {
            toastNotification.className = 'toast-message';
        }, 3000);
    }

    // Função para exibir o modal de confirmação
    function showConfirmationModal(title, message, onConfirmCallback) {
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        confirmationModal.style.display = 'flex'; // Usar flex para centralizar

        // Limpa listeners antigos para evitar duplicação
        modalConfirmBtn.onclick = null;
        modalCancelBtn.onclick = null;

        modalConfirmBtn.onclick = () => {
            onConfirmCallback();
            hideConfirmationModal();
        };
        modalCancelBtn.onclick = () => {
            hideConfirmationModal();
        };
    }

    function hideConfirmationModal() {
        confirmationModal.style.display = 'none';
    }

    closeModalBtn.addEventListener('click', hideConfirmationModal);
    window.addEventListener('click', (event) => {
        if (event.target == confirmationModal) {
            hideConfirmationModal();
        }
    });


    // Adiciona referência à grid de outras configurações
    const otherSettingsGrid = document.getElementById('other-settings-grid');

    // Função para mostrar uma seção específica
    window.showSection = function (sectionId) {
        detailSections.forEach(section => {
            section.style.display = 'none';
        });
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.style.display = 'block';
            // Exibe o botão "Voltar à Visão Geral" apenas na seção de perfil
            if (sectionId === 'perfil' && backToOverviewButtonContainer) {
                backToOverviewButtonContainer.style.display = 'flex';
                loadUserProfileData(); // Atualiza os campos ao abrir o perfil
            } else if (backToOverviewButtonContainer) {
                backToOverviewButtonContainer.style.display = 'none';
            }
        }
        if (configGrid) configGrid.style.display = 'none';
        if (quickSettingsSection) quickSettingsSection.style.display = 'none';
        if (otherSettingsGrid) otherSettingsGrid.style.display = 'none';
        breadcrumb.style.display = 'block';
        currentSectionSpan.textContent = targetSection ? targetSection.querySelector('.section-title')?.textContent || '' : '';
    };

    // Função para esconder uma seção e mostrar a grid de cards e sugestões
    window.hideSection = function (sectionId) {
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.style.display = 'none';
        }
        if (configGrid) {
            configGrid.style.display = 'grid';
        }
        if (quickSettingsSection) {
            quickSettingsSection.style.display = 'block';
        }
        if (otherSettingsGrid) {
            otherSettingsGrid.style.display = 'block';
        }
        breadcrumb.style.display = 'none';
        currentSectionSpan.textContent = '';
        // Esconde o botão "Voltar à Visão Geral" ao retornar para a visão geral
        if (backToOverviewButtonContainer) {
            backToOverviewButtonContainer.style.display = 'none';
        }
    };

    // Event Listeners para os botões "Acessar" nos cards
    document.querySelectorAll('.config-card .btn-primary').forEach(button => {
        button.addEventListener('click', function () {
            const sectionId = this.dataset.section;
            window.showSection(sectionId);
        });
    });

    // Event Listener para o link "Configurações" no Breadcrumb
    breadcrumbMainLink.addEventListener('click', function (event) {
        event.preventDefault();
        // Esconde todas as seções de detalhes
        detailSections.forEach(section => {
            section.style.display = 'none';
        });
        // Mostra a grid de cards e a seção de sugestões
        configGrid.style.display = 'grid';
        quickSettingsSection.style.display = 'block';
        // Esconde o breadcrumb
        breadcrumb.style.display = 'none';
        currentSectionSpan.textContent = '';
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Volta para o topo da página

        // NOVO: Esconde o botão "Voltar à Visão Geral" ao clicar no breadcrumb principal
        if (backToOverviewButtonContainer) {
            backToOverviewButtonContainer.style.display = 'none';
        }
    });

    // --- Campo de Pesquisa de Configurações ---
    const configSearchInput = document.getElementById('config-search');
    configSearchInput.addEventListener('keyup', function () {
        const searchTerm = this.value.toLowerCase();
        document.querySelectorAll('.config-card').forEach(card => {
            const cardName = card.dataset.cardName.toLowerCase();
            const cardDescription = card.querySelector('.card-description').textContent.toLowerCase();
            if (cardName.includes(searchTerm) || cardDescription.includes(searchTerm)) {
                card.style.display = 'flex'; // Mostra o card se corresponder
            } else {
                card.style.display = 'none'; // Esconde o card se não corresponder
            }
        });
    });


    // --- Interatividade da Seção "Perfil do Usuário" (com abas) ---
    const formPerfilInfo = document.getElementById('form-perfil-info');
    const editPerfilInfoBtn = document.getElementById('edit-perfil-info');
    const savePerfilInfoBtn = document.getElementById('save-perfil-info');
    const deleteAccountBtn = document.getElementById('delete-account-btn'); // Novo

    const nomeInput = document.getElementById('nome');
    const emailInput = document.getElementById('email');
    const matriculaInput = document.getElementById('matricula'); // Corrigido para matricula
    const cargoInput = document.getElementById('cargo'); // Adicionado para o campo cargo
    const emailError = document.getElementById('email-error');
    const telefoneError = document.getElementById('telefone-error'); // Mantido, mas o ID do input é 'matricula' no HTML

    const formPerfilCredenciais = document.getElementById('form-perfil-credenciais');
    const perfilSenhaAtualInput = document.getElementById('perfil-senha-atual');
    const perfilNovaSenhaInput = document.getElementById('perfil-nova-senha');
    const perfilConfirmarSenhaInput = document.getElementById('perfil-confirmar-senha');
    const perfilAutenticacaoDoisFatoresToggle = document.getElementById('perfil-autenticacao-dois-fatores');

    const perfilSenhaAtualError = document.getElementById('perfil-senha-atual-error');
    const perfilNovaSenhaError = document.getElementById('perfil-nova-senha-error');
    const perfilConfirmarSenhaError = document.getElementById('perfil-confirmar-senha-error');

    // Novo elemento para exibir o nome do usuário na seção de perfil
    const profileDisplayName = document.getElementById('profile-display-name');

    // Elementos para upload de foto de perfil
    const profilePictureUploadInput = document.getElementById('profile-picture-upload');
    const uploadPictureBtn = document.getElementById('upload-picture-btn');
    const uploadStatusMessage = document.getElementById('upload-status-message');
    const profilePictureIcon = document.getElementById('profile-icon'); // O ícone Font Awesome
    const profilePictureImg = document.getElementById('profile-img'); // Se você usar uma tag <img>


    // Lógica para o botão "Editar" / "Salvar" do Perfil (Informações Pessoais)
    // Se você não tem um botão "Editar" visível, esta lógica pode ser removida ou adaptada
    if (editPerfilInfoBtn) { // Verifica se o botão existe antes de adicionar o listener
        editPerfilInfoBtn.addEventListener('click', function () {
            emailInput.readOnly = false;
            matriculaInput.readOnly = false; // Usando matriculaInput
            cargoInput.readOnly = false; // Habilitando edição do cargo
            editPerfilInfoBtn.style.display = 'none';
            savePerfilInfoBtn.style.display = 'inline-block';
            emailInput.focus();
        });
    }

    formPerfilInfo.addEventListener('submit', function (event) {
        event.preventDefault();
        let isValid = true;
        emailError.textContent = '';
        telefoneError.textContent = ''; // Usado para matricula-error no HTML

        if (!emailInput.value.includes('@') || !emailInput.value.includes('.')) {
            emailError.textContent = 'E-mail inválido.';
            isValid = false;
        }

        // Validação da matrícula (adaptado de telefone)
        const matriculaRegex = /^\(?\d{2}\)?[\s-]?\d{4,5}-?\d{4}$/; // Exemplo, ajuste conforme o formato real da matrícula
        if (!matriculaRegex.test(matriculaInput.value) && matriculaInput.value !== '') {
            telefoneError.textContent = 'Matrícula inválida (ex: (XX) XXXXX-XXXX).';
            isValid = false;
        }

        if (isValid) {
            console.log('Dados do perfil salvos:', {
                nome: nomeInput.value,
                email: emailInput.value,
                cargo: cargoInput.value, // Salvando o cargo
                matricula: matriculaInput.value // Salvando a matrícula
            });
            emailInput.readOnly = true;
            matriculaInput.readOnly = true;
            cargoInput.readOnly = true; // Tornando cargo readonly novamente
            if (editPerfilInfoBtn) { // Verifica se o botão existe
                editPerfilInfoBtn.style.display = 'inline-block';
            }
            savePerfilInfoBtn.style.display = 'none';
            showToast('Informações pessoais atualizadas com sucesso!', 'success');
        } else {
            showToast('Por favor, corrija os erros no formulário.', 'error');
        }
    });

    // Lógica para o formulário de Credenciais
    formPerfilCredenciais.addEventListener('submit', function (event) {
        event.preventDefault();

        let isValid = true;
        perfilSenhaAtualError.textContent = '';
        perfilNovaSenhaError.textContent = '';
        perfilConfirmarSenhaError.textContent = '';

        // Simulação: em um ambiente real, você validaria a senha atual com o backend.
        if (perfilSenhaAtualInput.value === '') {
            perfilSenhaAtualError.textContent = 'A senha atual é obrigatória.';
            isValid = false;
        }

        // Validação de força da nova senha (exemplo simplificado)
        if (perfilNovaSenhaInput.value.length < 8 || !/[A-Z]/.test(perfilNovaSenhaInput.value) || !/[a-z]/.test(perfilNovaSenhaInput.value) || !/\d/.test(perfilNovaSenhaInput.value) || !/[!@#$%^&*()]/.test(perfilNovaSenhaInput.value)) {
            perfilNovaSenhaError.textContent = 'A senha deve ter 8+ caracteres, com maiúscula, minúscula, número e símbolo.';
            isValid = false;
        }

        if (perfilNovaSenhaInput.value !== perfilConfirmarSenhaInput.value) {
            perfilConfirmarSenhaError.textContent = 'As senhas não coincidem.';
            isValid = false;
        }

        if (isValid) {
            console.log('Credenciais atualizadas:', {
                autenticacaoDoisFatores: perfilAutenticacaoDoisFatoresToggle.checked,
                novaSenha: perfilNovaSenhaInput.value
            });
            showToast('Credenciais atualizadas com sucesso!', 'success');
            perfilSenhaAtualInput.value = '';
            perfilNovaSenhaInput.value = '';
            perfilConfirmarSenhaInput.value = '';
        } else {
            showToast('Por favor, corrija os erros no formulário.', 'error');
        }
    });

    // Botão "Excluir Conta"
    if (deleteAccountBtn) { // Verifica se o botão existe
        deleteAccountBtn.addEventListener('click', function () {
            showConfirmationModal('Excluir Conta', 'Esta ação é irreversível e excluirá todos os seus dados. Deseja continuar?', () => {
                // Lógica para exclusão da conta aqui
                console.log('Conta excluída!');
                showToast('Sua conta foi excluída com sucesso.', 'info');
                // Redirecionar para página de login ou confirmação
            });
        });
    }


    // Lógica das Abas
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', function () {
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.style.display = 'none');

            this.classList.add('active');
            const targetTab = this.dataset.tab;
            document.getElementById(targetTab).style.display = 'block';
        });
    });
    // Ativa a primeira aba por padrão ao carregar a seção de perfil
    const perfilSection = document.getElementById('perfil');
    if (perfilSection) {
        // Observa quando a seção de perfil se torna visível para ativar a primeira aba
        const observer = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    if (perfilSection.style.display === 'block') {
                        // Ativa a primeira aba e seu conteúdo
                        const firstTabButton = perfilSection.querySelector('.tab-button');
                        const firstTabContent = perfilSection.querySelector('.tab-content');
                        if (firstTabButton && firstTabContent) {
                            firstTabButton.classList.add('active');
                            firstTabContent.style.display = 'block';
                        }
                        observer.disconnect(); // Desconecta o observer após ativar
                    }
                }
            }
        });
        observer.observe(perfilSection, { attributes: true });
    }

    // --- Interatividade da Seção "Notificações" ---
    const emailNotifToggle = document.getElementById('email-notif');
    const frequenciaNotifGroup = document.getElementById('frequencia-notif-group');
    const formNotificacoes = document.getElementById('form-notificacoes');
    const testNotificationBtn = document.getElementById('test-notification-btn'); // Novo

    function toggleFrequenciaNotif() {
        if (emailNotifToggle.checked) {
            frequenciaNotifGroup.style.display = 'block';
        } else {
            frequenciaNotifGroup.style.display = 'none';
        }
    }
    emailNotifToggle.addEventListener('change', toggleFrequenciaNotif);
    toggleFrequenciaNotif();

    formNotificacoes.addEventListener('submit', function (event) {
        event.preventDefault();
        const selectedNotifTypes = Array.from(document.querySelectorAll('input[name="notif-type"]:checked')).map(cb => cb.value);

        console.log('Configurações de Notificações salvas:', {
            emailNotif: emailNotifToggle.checked,
            appNotif: document.getElementById('app-notif').checked,
            frequenciaNotif: document.getElementById('frequencia-notif').value,
            tiposNotificacao: selectedNotifTypes
        });
        showToast('Configurações de notificações salvas!', 'success');
    });

    testNotificationBtn.addEventListener('click', function () {
        showToast('Uma notificação de teste foi enviada!', 'info');
        // Em um cenário real, você faria uma chamada ao backend para enviar uma notificação de teste.
    });


    // --- Interatividade da Seção "Segurança e Privacidade" ---
    const formSeguranca = document.getElementById('form-seguranca');
    const senhaAtualInput = document.getElementById('senha-atual');
    const novaSenhaInput = document.getElementById('nova-senha');
    const confirmarSenhaInput = document.getElementById('confirmar-senha');
    const autenticacaoDoisFatoresToggle = document.getElementById('autenticacao-dois-fatores');
    const twoFaConfigGroup = document.getElementById('2fa-config-group');

    const senhaAtualError = document.getElementById('senha-atual-error');
    const novaSenhaError = document.getElementById('nova-senha-error');
    const confirmarSenhaError = document.getElementById('confirmar-senha-error');

    function toggle2FAConfig() {
        if (autenticacaoDoisFatoresToggle.checked) {
            twoFaConfigGroup.style.display = 'block';
        } else {
            twoFaConfigGroup.style.display = 'none';
        }
    }
    autenticacaoDoisFatoresToggle.addEventListener('change', toggle2FAConfig);
    toggle2FAConfig();

    formSeguranca.addEventListener('submit', function (event) {
        event.preventDefault();

        let isValid = true;
        senhaAtualError.textContent = '';
        novaSenhaError.textContent = '';
        confirmarSenhaError.textContent = '';

        if (senhaAtualInput.value === '') {
            senhaAtualError.textContent = 'A senha atual é obrigatória.';
            isValid = false;
        }

        if (novaSenhaInput.value.length < 8 || !/[A-Z]/.test(novaSenhaInput.value) || !/[a-z]/.test(novaSenhaInput.value) || !/\d/.test(novaSenhaInput.value) || !/[!@#$%^&*()]/.test(novaSenhaInput.value)) {
            novaSenhaError.textContent = 'A senha deve ter no mínimo 8 caracteres, com maiúscula, minúscula, número e símbolo.';
            isValid = false;
        }

        if (novaSenhaInput.value !== confirmarSenhaInput.value) {
            confirmarSenhaError.textContent = 'As senhas não coincidem.';
            isValid = false;
        }

        if (isValid) {
            console.log('Configurações de Segurança salvas:', {
                autenticacaoDoisFatores: autenticacaoDoisFatoresToggle.checked,
                senhaAtual: senhaAtualInput.value,
                novaSenha: novaSenhaInput.value,
                twoFAMethod: document.getElementById('2fa-method').value
            });
            showToast('Configurações de segurança salvas!', 'success');
            senhaAtualInput.value = '';
            novaSenhaInput.value = '';
            confirmarSenhaInput.value = '';
        } else {
            showToast('Por favor, corrija os erros no formulário.', 'error');
        }
    });

    // --- Interatividade da Seção "Preferências Gerais" ---
    const formPreferencias = document.getElementById('form-preferencias');
    const resetPreferencesBtn = document.getElementById('reset-preferences-btn'); // Novo

    formPreferencias.addEventListener('submit', function (event) {
        event.preventDefault();
        console.log('Preferências Gerais salvas:', {
            idioma: document.getElementById('idioma').value,
            tema: document.getElementById('tema').value,
            // enableAnimations: document.getElementById('enable-animations').checked // Removido, pois não há input com esse ID no HTML
        });
        showToast('Preferências salvas com sucesso!', 'success');
    });

    resetPreferencesBtn.addEventListener('click', function () {
        showConfirmationModal('Redefinir Preferências', 'Isso restaurará todas as suas preferências para os valores padrão do sistema. Deseja continuar?', () => {
            // Lógica para redefinir as preferências para os valores padrão
            document.getElementById('idioma').value = 'pt-BR';
            document.getElementById('tema').value = 'claro';
            // if (document.getElementById('enable-animations')) { // Verifica se existe antes de tentar
            //     document.getElementById('enable-animations').checked = true;
            // }
            console.log('Preferências redefinidas para o padrão.');
            showToast('Preferências redefinidas para o padrão.', 'info');
        });
    });


    // --- Interatividade da Seção "Gerenciamento de Macros" (Admin) ---
    const formGerenciamentoMacros = document.getElementById('form-gerenciamento-macros');
    const enableMacroReviewToggle = document.getElementById('enable-macro-review');

    formGerenciamentoMacros.addEventListener('submit', function (event) {
        event.preventDefault();
        console.log('Configurações de Gerenciamento de Macros salvas:', {
            defaultCategory: document.getElementById('macro-default-category').value,
            enableReview: enableMacroReviewToggle.checked,
            maxSize: document.getElementById('max-macro-size').value,
            allowedTypes: document.getElementById('allowed-macro-types').value
        });
        showToast('Configurações de gerenciamento de macros salvas!', 'success');
    });

    // --- Futuras Seções Detalhadas (Exemplos) ---
    const formDadosBackup = document.getElementById('form-dados-backup');
    if (formDadosBackup) { // Verifica se o formulário existe (seção visível)
        formDadosBackup.addEventListener('submit', function (event) {
            event.preventDefault();
            console.log('Configurações de Dados e Backup salvas:', {
                frequency: document.getElementById('backup-frequency').value,
                location: document.getElementById('backup-location').value
            });
            showToast('Configurações de dados e backup salvas!', 'success');
        });
        // Event listener para o botão de backup imediato (se houver)
        formDadosBackup.querySelector('.btn-info').addEventListener('click', function () {
            showToast('Backup iniciado. Você será notificado ao concluir.', 'info');
            // Aqui seria a lógica para iniciar o backup via backend
        });
    }

    // --- Simulação de Admin (para testar o card admin-only) ---
    // Em produção, a verificação de admin deve ser feita no backend e o elemento gerado/removido do DOM
    const isAdmin = true; // Altere para false para simular usuário comum
    const adminCard = document.querySelector('.admin-only');
    if (isAdmin && adminCard) {
        adminCard.style.display = 'flex';
    }

    const formVincularNeta = document.getElementById('form-vincular-neta');
    const netaStatus = document.getElementById('neta-status');
    const formVincularWFM = document.getElementById('form-vincular-wfm');
    const wfmStatus = document.getElementById('wfm-status');
    const formvectora = document.getElementById('form-vincular-vectora');


    // Função para exibir uma seção específica e atualizar o breadcrumb
    // Esta função já deve existir no seu JS, apenas certifique-se que 'integracoes-sistema' é um ID válido
    function showSection(sectionId, sectionName) {
        detailSections.forEach(section => {
            section.style.display = 'none';
        });
        configGrid.style.display = 'none';
        quickSettingsSection.style.display = 'none'; // Esconde as configurações rápidas
        breadcrumb.style.display = 'block'; // Mostra o breadcrumb
        currentSectionSpan.textContent = sectionName; // Atualiza o nome da seção no breadcrumb

        document.getElementById(sectionId).style.display = 'block';
    }

    // Função para retornar à tela principal de configurações
    // Esta função já deve existir
    window.hideSection = function (sectionId) {
        const targetSection = document.getElementById(sectionId);

        if (targetSection) {
            targetSection.style.display = 'none';
        }
        if (configGrid) {
            configGrid.style.display = 'grid';
        }
        if (quickSettingsSection) {
            quickSettingsSection.style.display = 'block';
        }
        if (otherSettingsGrid) {
            otherSettingsGrid.style.display = 'block'; // Corrigido para 'block' para garantir exibição correta
        }
        breadcrumb.style.display = 'none';
        currentSectionSpan.textContent = '';
    };


    // Event listener para o clique no link/card de "Integrações do Sistema"
    // Certifique-se que você tenha um elemento com data-section="integracoes-sistema"
    document.querySelectorAll('[data-section]').forEach(item => {
        item.addEventListener('click', function () {
            const sectionId = this.dataset.section;
            const sectionName = this.textContent; // Ou um atributo data-name se o textContent não for adequado
            if (sectionId === 'integracoes-sistema') {
                showSection(sectionId, sectionName);
            }
            // ... (seu código existente para outras seções) ...
        });
    });


    // Lógica para o formulário Vincular Neta
    if (formVincularNeta) {
        formVincularNeta.addEventListener('submit', async function (event) {
            event.preventDefault();
            const login = document.getElementById('neta-login').value;
            const senha = document.getElementById('neta-senha').value;
            const nome = document.getElementById('neta-nome');
            const perfil = document.getElementById('neta-perfil');
            const botaoVincular = document.getElementById('bntvincneta');
            const botaoRedefinir = document.getElementById('bntneta');
            const spinnerVinculo = document.getElementById('spinervincnt');
            const loginInput = document.getElementById('neta-login');
            const senhaInput = document.getElementById('neta-senha');
            const mensagemErroDiv = document.getElementById('mensagem-de-erro');
            // Pega o user_id já salvo na sessionStorage
            const usuarioId = sessionStorage.getItem('user_id');
            if (!usuarioId) {
                alert('ID do usuário não encontrado. Faça login novamente.');
                return;
            }
            // Esconde mensagem de erro antes de tentar
            if (mensagemErroDiv) {
                mensagemErroDiv.style.display = 'none';
                mensagemErroDiv.textContent = '';
            }
            // Mostra apenas título, botão e spinner
            if (loginInput) loginInput.parentElement.style.display = 'none';
            if (senhaInput) senhaInput.parentElement.style.display = 'none';
            if (botaoRedefinir) botaoRedefinir.style.display = 'none';
            if (botaoVincular) botaoVincular.style.display = 'inline-block';
            if (spinnerVinculo) spinnerVinculo.style.display = 'inline-block';
            // Chama o backend para vincular
            let resultadoVinculo = null;
            try {
                resultadoVinculo = await eel.vincular_neta(usuarioId, login, senha)();
            } catch (e) {
                if (mensagemErroDiv) {
                    mensagemErroDiv.textContent = 'Erro de comunicação com o backend.';
                    mensagemErroDiv.style.display = 'block';
                }
                if (spinnerVinculo) spinnerVinculo.style.display = 'none';
                if (loginInput) loginInput.parentElement.style.display = 'block';
                if (senhaInput) senhaInput.parentElement.style.display = 'block';
                if (botaoVincular) botaoVincular.style.display = 'inline-block';
                if (botaoRedefinir) botaoRedefinir.style.display = 'none';
                return;
            }
            // Se o backend retornar erro, mostra na div
            if (!resultadoVinculo || resultadoVinculo.status !== 'success') {
                if (mensagemErroDiv) {
                    mensagemErroDiv.textContent = resultadoVinculo && resultadoVinculo.message ? resultadoVinculo.message : 'Erro ao vincular Neta. Verifique login e senha.';
                    mensagemErroDiv.style.display = 'block';
                }
                if (spinnerVinculo) spinnerVinculo.style.display = 'none';
                if (loginInput) loginInput.parentElement.style.display = 'block';
                if (loginInput) loginInput.value = '';
                if (senhaInput) senhaInput.parentElement.style.display = 'block';
                if (senhaInput) senhaInput.value = '';
                if (botaoVincular) botaoVincular.style.display = 'inline-block';
                if (botaoRedefinir) botaoRedefinir.style.display = 'none';
                return;
            }
            // Simula processamento de 7 segundos (mantém sua lógica)
            setTimeout(async () => {
                if (spinnerVinculo) spinnerVinculo.style.display = 'none';
                if (botaoVincular) botaoVincular.style.display = 'none';
                if (botaoRedefinir) botaoRedefinir.style.display = 'inline-block';
                // Após o vínculo, busca e preenche os campos atualizados do backend
                if (typeof preencherCamposNeta === 'function') {
                    await preencherCamposNeta();
                }
                // Garante visibilidade dos campos
                if (nome) {
                    nome.parentElement.style.display = 'block';
                    nome.style.display = 'block';
                }
                if (perfil) {
                    perfil.parentElement.style.display = 'block';
                    perfil.style.display = 'block';
                }
                netaStatus.textContent = 'Neta vinculada com sucesso!';
                netaStatus.classList.add('success');
                showToast('Neta vinculada com sucesso!', 'success');
            }, 7000);
        });
    }

    // Lógica para o formulário Vincular WFM
    if (formvectora) {
        formvectora.addEventListener('submit', async function (event) {
            event.preventDefault();
            const login = document.getElementById('vc-login').value;
            const senha = document.getElementById('vc-senha').value;
            const costumer = document.getElementById('vc-cliente').value;
            const nome = document.getElementById('vc-nome');
            const perfil = document.getElementById('vc-perfil');
            const botaoVincular = document.getElementById('bntvincvc');
            const botaoRedefinir = document.getElementById('bntvinc2vc');
            const spinnerVinculo = document.getElementById('spinervivc');
            const costumerInput = document.getElementById('vc-cliente');
            const loginInput = document.getElementById('vc-login');
            const senhaInput = document.getElementById('vc-senha');
            const mensagemErroDiv = document.getElementById('mensagem-de-erro');
            const usuarioId = sessionStorage.getItem('user_id');
            if (!usuarioId) {
                alert('ID do usuário não encontrado. Faça login novamente.');
                return;
            }
            if (mensagemErroDiv) {
                mensagemErroDiv.style.display = 'none';
                mensagemErroDiv.textContent = '';
            }
            if (loginInput) loginInput.parentElement.style.display = 'none';
            if (senhaInput) senhaInput.parentElement.style.display = 'none';
            if (botaoRedefinir) botaoRedefinir.style.display = 'none';
            if (costumerInput) costumerInput.parentElement.style.display = 'none';
            if (botaoVincular) botaoVincular.style.display = 'inline-block';
            if (spinnerVinculo) spinnerVinculo.style.display = 'inline-block';
            let resultadoVinculo = null;
            try {
                resultadoVinculo = await eel.vincular_vectora(usuarioId, costumer, login, senha)();
            } catch (e) {
                if (mensagemErroDiv) {
                    mensagemErroDiv.textContent = 'Erro de comunicação com o backend.';
                    mensagemErroDiv.style.display = 'block';
                }
                if (spinnerVinculo) spinnerVinculo.style.display = 'none';
                if (loginInput) loginInput.parentElement.style.display = 'block';
                if (senhaInput) senhaInput.parentElement.style.display = 'block';
                if (costumerInput) costumerInput.parentElement.style.display = 'block';
                if (botaoVincular) botaoVincular.style.display = 'inline-block';
                if (botaoRedefinir) botaoRedefinir.style.display = 'none';
                return;
            }
            if (!resultadoVinculo || resultadoVinculo.status !== 'success') {
                if (mensagemErroDiv) {
                    mensagemErroDiv.textContent = resultadoVinculo && resultadoVinculo.message ? resultadoVinculo.message : 'Erro ao vincular Vectora. Verifique login e senha.';
                    mensagemErroDiv.style.display = 'block';
                }
                if (spinnerVinculo) spinnerVinculo.style.display = 'none';
                if (loginInput) loginInput.parentElement.style.display = 'block';
                if (loginInput) loginInput.value = '';
                if (costumerInput) costumerInput.parentElement.style.display = 'block';
                if (costumerInput) costumerInput.value = '';
                if (senhaInput) senhaInput.parentElement.style.display = 'block';
                if (senhaInput) senhaInput.value = '';
                if (botaoVincular) botaoVincular.style.display = 'inline-block';
                if (botaoRedefinir) botaoRedefinir.style.display = 'none';
                return;
            }
            // Atualiza imediatamente após o vínculo
            if (spinnerVinculo) spinnerVinculo.style.display = 'none';
            if (botaoVincular) botaoVincular.style.display = 'none';
            if (botaoRedefinir) botaoRedefinir.style.display = 'inline-block';
            if (typeof preencherCamposVectora === 'function') {
                await preencherCamposVectora();
            }
            if (nome) {
                nome.parentElement.style.display = 'block';
                nome.style.display = 'block';
            }
            if (perfil) {
                perfil.parentElement.style.display = 'block';
                perfil.style.display = 'block';
            }
            wfmStatus.textContent = 'Vectora vinculado com sucesso!';
            wfmStatus.classList.add('success');
            showToast('Vectora vinculado com sucesso!', 'success');
        });
    }

    if (formVincularWFM) {
        formVincularWFM.addEventListener('submit', async function (event) {
            event.preventDefault();
            const login = document.getElementById('wfm-login').value;
            const senha = document.getElementById('wfm-senha').value;
            const nome = document.getElementById('wfm-nome');
            const perfil = document.getElementById('wfm-perfil');
            const botaoVincular = document.getElementById('bntvinc');
            const botaoRedefinir = document.getElementById('bntvinc2');
            const spinnerVinculo = document.getElementById('spinervinc');
            const loginInput = document.getElementById('wfm-login');
            const senhaInput = document.getElementById('wfm-senha');
            const mensagemErroDiv = document.getElementById('mensagem-de-erro');
            const usuarioId = sessionStorage.getItem('user_id');
            if (!usuarioId) {
                alert('ID do usuário não encontrado. Faça login novamente.');
                return;
            }
            if (mensagemErroDiv) {
                mensagemErroDiv.style.display = 'none';
                mensagemErroDiv.textContent = '';
            }
            if (loginInput) loginInput.parentElement.style.display = 'none';
            if (senhaInput) senhaInput.parentElement.style.display = 'none';
            if (botaoRedefinir) botaoRedefinir.style.display = 'none';
            if (botaoVincular) botaoVincular.style.display = 'inline-block';
            if (spinnerVinculo) spinnerVinculo.style.display = 'inline-block';

            let resultadoVinculo = null;
            try {
                resultadoVinculo = await eel.vincular_wfm(usuarioId, login, senha)();
            } catch (e) {
                if (mensagemErroDiv) {
                    mensagemErroDiv.textContent = 'Erro de comunicação com o backend.';
                    mensagemErroDiv.style.display = 'block';
                }
                if (spinnerVinculo) spinnerVinculo.style.display = 'none';
                if (loginInput) loginInput.parentElement.style.display = 'block';
                if (senhaInput) senhaInput.parentElement.style.display = 'block';
                if (botaoVincular) botaoVincular.style.display = 'inline-block';
                if (botaoRedefinir) botaoRedefinir.style.display = 'none';
                return;
            }
            if (!resultadoVinculo || resultadoVinculo.status !== 'success') {
                if (mensagemErroDiv) {
                    mensagemErroDiv.textContent = resultadoVinculo && resultadoVinculo.message ? resultadoVinculo.message : 'Erro ao vincular WFM. Verifique login e senha.';
                    mensagemErroDiv.style.display = 'block';
                }
                if (spinnerVinculo) spinnerVinculo.style.display = 'none';
                if (loginInput) loginInput.parentElement.style.display = 'block';
                if (loginInput) loginInput.value = '';
                if (senhaInput) senhaInput.parentElement.style.display = 'block';
                if (senhaInput) senhaInput.value = '';
                if (botaoVincular) botaoVincular.style.display = 'inline-block';
                if (botaoRedefinir) botaoRedefinir.style.display = 'none';
                return;
            }
            // Simula processamento de 7 segundos (igual ao Neta)
            setTimeout(async () => {
                if (spinnerVinculo) spinnerVinculo.style.display = 'none';
                if (botaoVincular) botaoVincular.style.display = 'none';
                if (botaoRedefinir) botaoRedefinir.style.display = 'inline-block';
                // Após o vínculo, busca e preenche os campos atualizados do backend
                if (typeof preencherCamposWFM === 'function') {
                    await preencherCamposWFM();
                }
                if (nome) {
                    nome.parentElement.style.display = 'block';
                    nome.style.display = 'block';
                }
                if (perfil) {
                    perfil.parentElement.style.display = 'block';
                    perfil.style.display = 'block';
                }
                if (wfmStatus) {
                    wfmStatus.textContent = 'WFM vinculado com sucesso!';
                    wfmStatus.classList.add('success');
                    wfmStatus.style.display = 'block';
                }
                showToast('WFM vinculado com sucesso!', 'success');
            }, 7000);
        });
    }


    // Função para preencher os campos de nome/perfil WFM ao entrar na página de configurações
    async function preencherCamposWFM() {
        const usuarioId = sessionStorage.getItem('user_id');
        if (!usuarioId) return;
        try {
            const res = await eel.get_wfm_vinculo_by_user_id(usuarioId)();
            const nomeInput = document.getElementById('wfm-nome');
            const perfilInput = document.getElementById('wfm-perfil');
            const loginInput = document.getElementById('wfm-login');
            const senhaInput = document.getElementById('wfm-senha');
            const botaoVincular = document.getElementById('bntvinc');
            const botaoRedefinir = document.getElementById('bntvinc2');
            if (res && res.status === 'success' && res.wfm_nome && res.wfm_perfil) {
                // Preenche e mostra nome/perfil
                if (nomeInput) {
                    nomeInput.value = res.wfm_nome || '';
                    if (nomeInput.parentElement) nomeInput.parentElement.style.display = 'block';
                }
                if (perfilInput) {
                    perfilInput.value = res.wfm_perfil || '';
                    if (perfilInput.parentElement) perfilInput.parentElement.style.display = 'block';
                }
                // Esconde login/senha e botão vincular, mostra redefinir
                if (loginInput) loginInput.parentElement.style.display = 'none';
                if (senhaInput) senhaInput.parentElement.style.display = 'none';
                if (botaoVincular) botaoVincular.style.display = 'none';
                if (botaoRedefinir) botaoRedefinir.style.display = 'inline-block';
            } else {
                // Se não houver vínculo, mostra login/senha e botão vincular, esconde redefinir
                if (loginInput) loginInput.parentElement.style.display = 'block';
                if (senhaInput) senhaInput.parentElement.style.display = 'block';
                if (botaoVincular) botaoVincular.style.display = 'inline-block';
                if (botaoRedefinir) botaoRedefinir.style.display = 'none';
                // Esconde nome/perfil
                if (nomeInput) nomeInput.parentElement.style.display = 'none';
                if (perfilInput) perfilInput.parentElement.style.display = 'none';
            }
        } catch (e) {
            // opcional: mostrar erro
        }
    }

    preencherCamposWFM();

    async function preencherCamposVectora() {
        const usuarioId = sessionStorage.getItem('user_id');
        if (!usuarioId) return;
        try {
            const res = await eel.get_vectora_vinculo_by_user_id(usuarioId)();
            const nomeInput = document.getElementById('vc-nome');
            const perfilInput = document.getElementById('vc-perfil');
            const loginInput = document.getElementById('vc-login');
            const senhaInput = document.getElementById('vc-senha');
            const costumerInput = document.getElementById('vc-cliente');
            const botaoVincular = document.getElementById('bntvincvc');
            const botaoRedefinir = document.getElementById('bntvinc2vc');
            if (res && res.status === 'success' && res.vectora_nome && res.vectora_perfil) {
                // Preenche e mostra apenas nome/perfil
                if (nomeInput) {
                    nomeInput.value = res.vectora_nome || '';
                    if (nomeInput.parentElement) nomeInput.parentElement.style.display = 'block';
                    nomeInput.style.display = 'block';
                }
                if (perfilInput) {
                    perfilInput.value = res.vectora_perfil || '';
                    if (perfilInput.parentElement) perfilInput.parentElement.style.display = 'block';
                    perfilInput.style.display = 'block';
                }
                // Esconde login, senha e cliente
                if (loginInput) loginInput.parentElement.style.display = 'none';
                if (senhaInput) senhaInput.parentElement.style.display = 'none';
                if (costumerInput) costumerInput.parentElement.style.display = 'none';
                // Esconde botão vincular, mostra redefinir
                if (botaoVincular) botaoVincular.style.display = 'none';
                if (botaoRedefinir) botaoRedefinir.style.display = 'inline-block';
            } else {
                // Se não houver vínculo, mostra login/senha/cliente e botão vincular, esconde redefinir
                if (loginInput) loginInput.parentElement.style.display = 'block';
                if (senhaInput) senhaInput.parentElement.style.display = 'block';
                if (costumerInput) costumerInput.parentElement.style.display = 'block';
                if (botaoVincular) botaoVincular.style.display = 'inline-block';
                if (botaoRedefinir) botaoRedefinir.style.display = 'none';
                // Esconde nome/perfil
                if (nomeInput) nomeInput.parentElement.style.display = 'none';
                if (perfilInput) perfilInput.parentElement.style.display = 'none';
            }
        } catch (e) {
            // opcional: mostrar erro
            console.error('Erro ao preencher campos Vectora:', e);
        }
    }

    const botaoRedefinirvectora = document.getElementById('bntvinc2vc');
    if (botaoRedefinirvectora) {
        botaoRedefinirvectora.addEventListener('click', function (event) {
            event.preventDefault();
            const loginInput = document.getElementById('vc-login');
            const senhaInput = document.getElementById('vc-senha');
            const costumerInput = document.getElementById('vc-cliente');
            const botaoVincular = document.getElementById('bntvincvc');
            const spinnerVinculo = document.getElementById('spinervivc');
            const nome = document.getElementById('vc-nome');
            const perfil = document.getElementById('vc-perfil');
            // Mostra login, senha e cliente novamente
            if (loginInput) {
                loginInput.parentElement.style.display = 'block';
                loginInput.value = '';
            }
            if (senhaInput) {
                senhaInput.parentElement.style.display = 'block';
                senhaInput.value = '';
            }
            if (costumerInput) {
                costumerInput.parentElement.style.display = 'block';
                costumerInput.value = '';
            }
            // Esconde nome e perfil
            if (nome) nome.parentElement.style.display = 'none';
            if (perfil) perfil.parentElement.style.display = 'none';
            // Esconde redefinir, mostra vincular, esconde spinner
            if (botaoRedefinirvectora) botaoRedefinirvectora.style.display = 'none';
            if (botaoVincular) botaoVincular.style.display = 'inline-block';
            if (spinnerVinculo) spinnerVinculo.style.display = 'none';
            // Limpa status se houver
            if (wfmStatus) {
                wfmStatus.textContent = '';
                wfmStatus.classList.remove('success', 'error');
            }
        });
    }


    preencherCamposVectora();

    // Função para preencher os campos de nome/perfil Neta ao entrar na página de configurações
    async function preencherCamposNeta() {
        const usuarioId = sessionStorage.getItem('user_id');
        if (!usuarioId) return;
        try {
            const res = await eel.get_neta_vinculo_by_user_id(usuarioId)();
            const nomeInput = document.getElementById('neta-nome');
            const perfilInput = document.getElementById('neta-perfil');
            const loginInput = document.getElementById('neta-login');
            const senhaInput = document.getElementById('neta-senha');
            const botaoVincular = document.getElementById('bntvincneta');
            const botaoRedefinir = document.getElementById('bntneta');
            if (res && res.status === 'success' && res.neta_nome && res.neta_perfil) {
                // Preenche e mostra nome/perfil
                if (nomeInput) {
                    nomeInput.value = res.neta_nome || '';
                    if (nomeInput.parentElement) nomeInput.parentElement.style.display = 'block';
                }
                if (perfilInput) {
                    perfilInput.value = res.neta_perfil || '';
                    if (perfilInput.parentElement) perfilInput.parentElement.style.display = 'block';
                }
                // Esconde login/senha e botão vincular, mostra redefinir
                if (loginInput) loginInput.parentElement.style.display = 'none';
                if (senhaInput) senhaInput.parentElement.style.display = 'none';
                if (botaoVincular) botaoVincular.style.display = 'none';
                if (botaoRedefinir) botaoRedefinir.style.display = 'inline-block';
            } else {
                // Se não houver vínculo, mostra login/senha e botão vincular, esconde redefinir
                if (loginInput) loginInput.parentElement.style.display = 'block';
                if (senhaInput) senhaInput.parentElement.style.display = 'block';
                if (botaoVincular) botaoVincular.style.display = 'inline-block';
                if (botaoRedefinir) botaoRedefinir.style.display = 'none';
                // Esconde nome/perfil
                if (nomeInput) nomeInput.parentElement.style.display = 'none';
                if (perfilInput) perfilInput.parentElement.style.display = 'none';
            }
        } catch (e) {
            // opcional: mostrar erro
        }
    }

    // Lógica para o botão Redefinir Neta
    const botaoRedefinirNeta = document.getElementById('bntneta');
    if (botaoRedefinirNeta) {
        botaoRedefinirNeta.addEventListener('click', function (event) {
            event.preventDefault();
            const loginInput = document.getElementById('neta-login');
            const senhaInput = document.getElementById('neta-senha');
            const botaoVincular = document.getElementById('bntvincneta');
            const spinnerVinculo = document.getElementById('spinervincnt');
            const nome = document.getElementById('neta-nome');
            const perfil = document.getElementById('neta-perfil');
            // Mostra login e senha novamente
            if (loginInput) {
                loginInput.parentElement.style.display = 'block';
                loginInput.value = '';
            }
            if (senhaInput) {
                senhaInput.parentElement.style.display = 'block';
                senhaInput.value = '';
            }
            // Esconde nome e perfil
            if (nome) nome.parentElement.style.display = 'none';
            if (perfil) perfil.parentElement.style.display = 'none';
            // Esconde redefinir, mostra vincular, esconde spinner
            botaoRedefinirNeta.style.display = 'none';
            if (botaoVincular) botaoVincular.style.display = 'inline-block';
            if (spinnerVinculo) spinnerVinculo.style.display = 'none';
            // Limpa status
            if (netaStatus) {
                netaStatus.textContent = '';
                netaStatus.classList.remove('success', 'error');
            }
        });
    }

    preencherCamposNeta();



    // --- Lógica de Upload de Foto de Perfil ---
    // Adiciona listener para o clique no botão "Carregar Foto"
    if (uploadPictureBtn) {
        uploadPictureBtn.addEventListener('click', () => {
            profilePictureUploadInput.click(); // Simula o clique no input de arquivo oculto
        });
    }

    // Adiciona listener para quando um arquivo é selecionado no input
    if (profilePictureUploadInput) {
        profilePictureUploadInput.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (!file) {
                uploadStatusMessage.textContent = 'Nenhuma imagem selecionada.';
                uploadStatusMessage.className = 'upload-status-message error';
                uploadStatusMessage.style.display = 'block';
                return;
            }

            // Validação básica do tipo de arquivo
            if (!file.type.startsWith('image/')) {
                uploadStatusMessage.textContent = 'Por favor, selecione um arquivo de imagem (JPEG, PNG, GIF, etc.).';
                uploadStatusMessage.className = 'upload-status-message error';
                uploadStatusMessage.style.display = 'block';
                return;
            }

            // Validação básica do tamanho do arquivo (ex: máximo de 5MB)
            const maxSize = 5 * 1024 * 1024; // 5 MB
            if (file.size > maxSize) {
                uploadStatusMessage.textContent = 'A imagem é muito grande. Tamanho máximo: 5MB.';
                uploadStatusMessage.className = 'upload-status-message error';
                uploadStatusMessage.style.display = 'block';
                return;
            }

            uploadStatusMessage.textContent = 'Carregando imagem...';
            uploadStatusMessage.className = 'upload-status-message'; // Remove classes de sucesso/erro
            uploadStatusMessage.style.display = 'block';

            const reader = new FileReader();
            reader.readAsDataURL(file); // Lê o arquivo como uma URL de dados (Base64)

            reader.onload = async () => {
                const base64Image = reader.result; // String Base64 da imagem
                const fileExtension = file.name.split('.').pop(); // Obtém a extensão do arquivo
                const userId = sessionStorage.getItem('user_id'); // Obtém o ID do usuário logado

                if (!userId) {
                    uploadStatusMessage.textContent = 'Erro: ID do usuário não encontrado. Faça login novamente.';
                    uploadStatusMessage.className = 'upload-status-message error';
                    return;
                }

                try {
                    // Chama a função Eel para enviar a imagem para o backend
                    const response = await eel.upload_profile_picture(userId, base64Image, fileExtension)();

                    if (response.status === 'success') {
                        uploadStatusMessage.textContent = response.message;
                        uploadStatusMessage.className = 'upload-status-message success';
                        // Atualiza a imagem de perfil no frontend
                        if (profilePictureImg) { // Se estiver usando <img>
                            profilePictureImg.src = response.url;
                            profilePictureImg.style.display = 'block'; // Garante que a imagem esteja visível
                            if (profilePictureIcon) profilePictureIcon.style.display = 'none'; // Esconde o ícone
                        } else { // Fallback para background-image na div
                            const profilePictureDiv = document.querySelector('.profile-picture');
                            if (profilePictureDiv) {
                                profilePictureDiv.style.backgroundImage = `url(${response.url})`;
                                profilePictureDiv.style.backgroundSize = 'cover';
                                profilePictureDiv.style.backgroundPosition = 'center';
                                profilePictureDiv.style.backgroundRepeat = 'no-repeat';
                                if (profilePictureIcon) profilePictureIcon.style.display = 'none';
                            }
                        }
                        showToast('Foto de perfil atualizada!', 'success');
                    } else {
                        uploadStatusMessage.textContent = response.message;
                        uploadStatusMessage.className = 'upload-status-message error';
                        showToast('Erro ao atualizar foto de perfil.', 'error');
                    }
                } catch (error) {
                    console.error('Erro na chamada Eel para upload_profile_picture:', error);
                    uploadStatusMessage.textContent = 'Erro de comunicação com o servidor ao carregar a foto.';
                    uploadStatusMessage.className = 'upload-status-message error';
                    showToast('Erro de rede.', 'error');
                }
            };

            reader.onerror = () => {
                uploadStatusMessage.textContent = 'Erro ao ler o arquivo de imagem.';
                uploadStatusMessage.className = 'upload-status-message error';
            };
        });
    }

    // Função para carregar a foto de perfil do usuário ao carregar a página
    async function loadProfilePicture() {
        const userId = sessionStorage.getItem('user_id');
        if (!userId) {
            // Se não houver userId, garante que o ícone padrão esteja visível
            if (profilePictureImg) profilePictureImg.style.display = 'none';
            if (profilePictureIcon) profilePictureIcon.style.display = 'block';
            document.querySelector('.profile-picture').style.backgroundImage = 'none';
            return;
        }

        try {
            // Chama a função Eel para buscar a URL da foto de perfil do banco de dados
            const res = await eel.get_profile_picture_url_from_db(userId)();

            if (res && res.status === 'success' && res.url) {
                // Se houver uma URL de foto de perfil
                if (profilePictureImg) { // Se a tag <img> existe no HTML
                    profilePictureImg.src = res.url;
                    profilePictureImg.style.display = 'block'; // Mostra a imagem
                    if (profilePictureIcon) profilePictureIcon.style.display = 'none'; // Esconde o ícone
                } else {
                    // Fallback: se por algum motivo a <img> não estiver presente,
                    // tenta usar o background-image na div pai e esconde o ícone.
                    const profilePictureDiv = document.querySelector('.profile-picture');
                    if (profilePictureDiv) {
                        profilePictureDiv.style.backgroundImage = `url(${res.url})`;
                        profilePictureDiv.style.backgroundSize = 'cover';
                        profilePictureDiv.style.backgroundPosition = 'center';
                        profilePictureDiv.style.backgroundRepeat = 'no-repeat';
                        if (profilePictureIcon) profilePictureIcon.style.display = 'none';
                    }
                }
            } else {
                // Se não houver URL ou status não for sucesso, garante que o ícone esteja visível e a imagem escondida
                if (profilePictureImg) profilePictureImg.style.display = 'none';
                if (profilePictureIcon) profilePictureIcon.style.display = 'block'; // Mostra o ícone padrão
                document.querySelector('.profile-picture').style.backgroundImage = 'none'; // Remove qualquer background-image
            }
        } catch (e) {
            console.error('Erro ao carregar foto de perfil:', e);
            // Em caso de erro, garante que o ícone padrão esteja visível
            if (profilePictureImg) profilePictureImg.style.display = 'none';
            if (profilePictureIcon) profilePictureIcon.style.display = 'block';
            document.querySelector('.profile-picture').style.backgroundImage = 'none';
        }
    }

    // Função para carregar os dados completos do perfil do usuário
    async function loadUserProfileData() {
        const userId = sessionStorage.getItem('user_id');
        if (!userId) return;
        try {
            const response = await eel.get_user_profile_data(userId)();
            if (response.status === 'success' && response.data) {
                const data = response.data;
                // Preenche os campos do formulário de perfil
                if (document.getElementById('nome')) document.getElementById('nome').value = data.nome || '';
                if (document.getElementById('email')) document.getElementById('email').value = data.email || '';
                if (document.getElementById('cargo')) document.getElementById('cargo').value = data.cargo || '';
                if (document.getElementById('matricula')) document.getElementById('matricula').value = data.matricula || '';
                if (document.getElementById('vinculoneta')) document.getElementById('vinculoneta').value = data.neta_perfil || '';
                if (document.getElementById('vinculowfm')) document.getElementById('vinculowfm').value = data.wfm_perfil || '';
                // Atualiza o nome exibido no topo do perfil
                if (document.getElementById('profile-display-name')) document.getElementById('profile-display-name').textContent = data.nome || '';
                // Atualiza a foto de perfil se existir
                if (data.foto_perfil_url && document.getElementById('profile-img')) {
                    document.getElementById('profile-img').src = data.foto_perfil_url;
                    document.getElementById('profile-img').style.display = 'block';
                    if (document.getElementById('profile-icon')) document.getElementById('profile-icon').style.display = 'none';
                } else {
                    if (document.getElementById('profile-img')) document.getElementById('profile-img').style.display = 'none';
                    if (document.getElementById('profile-icon')) document.getElementById('profile-icon').style.display = 'block';
                }
            }
        } catch (e) {
            // opcional: mostrar erro
            console.error('Erro ao carregar dados do perfil:', e);
        }
    }

    // Chama a função ao abrir o perfil
    window.showSection = function (sectionId) {
        detailSections.forEach(section => {
            section.style.display = 'none';
        });
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.style.display = 'block';
            if (sectionId === 'perfil' && backToOverviewButtonContainer) {
                backToOverviewButtonContainer.style.display = 'flex';
                loadUserProfileData(); // Atualiza os campos ao abrir o perfil
            } else if (backToOverviewButtonContainer) {
                backToOverviewButtonContainer.style.display = 'none';
            }
        }
        if (configGrid) configGrid.style.display = 'none';
        if (quickSettingsSection) quickSettingsSection.style.display = 'none';
        if (otherSettingsGrid) otherSettingsGrid.style.display = 'none';
        breadcrumb.style.display = 'block';
        currentSectionSpan.textContent = targetSection ? targetSection.querySelector('.section-title')?.textContent || '' : '';
    };

    // --- Código existente não mostrado para brevidade ---

});


// As funções abaixo foram movidas para fora do DOMContentLoaded para serem globais (acessíveis pelo HTML)
// Se já existirem em outro arquivo JS que é carregado antes, você pode remover as duplicatas.

function iniciarTransicaoPagina() {
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

document.addEventListener('DOMContentLoaded', (event) => {
    console.log('DOMContentLoaded disparado. Chamando iniciarTransicaoPagina.');
    iniciarTransicaoPagina();
    console.log('DOMContentLoaded finalizado.');
});

window.deslogar = function () {
    console.log("[macrosite.js] Chamada a deslogar.");
    sessionStorage.removeItem('nomeUsuario'); // Limpa o nome de usuário da sessão
    sessionStorage.removeItem('user_id'); // NOVO: Limpa também o user_id
    console.log("[macrosite.js] sessionStorage 'nomeUsuario' limpo. Redirecionando para login.html");
    window.location.href = './login.html'; // Redireciona para a página de login
};

window.onload = async function () {
    console.log("[macros.js] window.onload UNIFICADO iniciado.");

    const nomeUsuarioElement = document.getElementById('nome-usuario');
    const profileDisplayName = document.getElementById('profile-display-name');

    let identificadorUsuario = null;

    const identificadorUsuarioDaURL = obterParametroDaURL('identificador');
    const userIdFromUrl = obterParametroDaURL('user_id');
    const firstLoginComplete = obterParametroDaURL('first_login_complete');

    console.log("[macros.js] Valor de identificadorUsuarioDaURL:", identificadorUsuarioDaURL);
    console.log("[macros.js] Valor de userIdFromUrl:", userIdFromUrl);
    console.log("[macros.js] Valor de firstLoginComplete:", firstLoginComplete);
    console.log("[macros.js] Elemento nomeUsuarioElement:", nomeUsuarioElement);

    if (identificadorUsuarioDaURL) {
        identificadorUsuario = identificadorUsuarioDaURL;
        sessionStorage.setItem('nomeUsuario', identificadorUsuario);
        console.log("[macros.js] Nome do usuário obtido da URL (identificador) e armazenado em sessionStorage.");
    } else if (userIdFromUrl && firstLoginComplete === 'true') {
        console.log("[macros.js] Redirecionado do primeiro login. Obtendo nome do usuário por ID...");
        try {
            const resultadoNome = await eel.get_username_by_id(userIdFromUrl)();
            console.log("[macros.js] Resultado get_username_by_id:", resultadoNome);

            if (resultadoNome && resultadoNome.status === 'success') {
                identificadorUsuario = resultadoNome.username;
                sessionStorage.setItem('nomeUsuario', identificadorUsuario);
                sessionStorage.setItem('user_id', userIdFromUrl); // NOVO: Salva o user_id na sessionStorage
                console.log("[macros.js] Nome do usuário obtido por ID e armazenado em sessionStorage.");
            } else {
                console.error("[macros.js] Falha ao obter nome do usuário por ID:", resultadoNome);
            }
        } catch (error) {
            console.error("[macros.js] Erro na chamada Eel para get_username_by_id:", error);
        }
    } else {
        identificadorUsuario = sessionStorage.getItem('nomeUsuario');
        const storedUserId = sessionStorage.getItem('user_id');
        if (identificadorUsuario) {
            console.log("[macros.js] Nome do usuário obtido do sessionStorage (fallback).");
        }
        if (storedUserId) {
            console.log("[macros.js] User ID obtido do sessionStorage (fallback).");
        } else {
            console.log("[macros.js] Nome do usuário ou User ID não encontrado em URL ou sessionStorage. Usuário pode não estar logado.");
        }
    }

    if (identificadorUsuario && nomeUsuarioElement) {
        nomeUsuarioElement.textContent = identificadorUsuario;
        if (profileDisplayName) {
            profileDisplayName.textContent = identificadorUsuario; // Atualiza o novo display de nome de perfil
        }
        console.log("[macros.js] Nome do usuário exibido:", identificadorUsuario);
    } else if (nomeUsuarioElement) {
        nomeUsuarioElement.textContent = "Usuário Padrão";
        if (profileDisplayName) {
            profileDisplayName.textContent = "Usuário Padrão"; // Atualiza o novo display de nome de perfil
        }
        console.log("[macros.js] Nome do usuário não atualizado. Identificador nulo ou elemento não encontrado. Exibindo padrão.");
    }

    if (typeof iniciarTransicaoPagina === 'function') {
        iniciarTransicaoPagina();
        console.log("[macros.js] iniciarTransicaoPagina chamada.");
    } else {
        console.error("[macros.js] Função iniciarTransicaoPagina não definida.");
    }

    if (typeof atualizarHorarioAtual === 'function') {
        atualizarHorarioAtual();
        console.log("[macros.js] atualizarHorarioAtual chamada.");
    } else {
        console.error("[macros.js] Função atualizarHorarioAtual não definida.");
    }

    if (typeof atualizarHorarioAtual === 'function') {
        setInterval(atualizarHorarioAtual, 1000);
        console.log("[macros.js] setInterval para atualizarHorarioAtual configurado.");
    }

    // --- Lógica do timer logado ---
    let sessionStartTime = sessionStorage.getItem('sessionStartTime');
    console.log(`Timer: Tentando obter sessionStartTime do sessionStorage. Valor: ${sessionStartTime}`);

    if (sessionStartTime) {
        sessionStartTime = parseInt(sessionStartTime, 10);
        if (!isNaN(sessionStartTime)) {
            console.log("Timer: sessionStartTime válido obtido do sessionStorage.");
            if (typeof updateLoggedInTime === 'function') {
                updateLoggedInTime(sessionStartTime);
                setInterval(() => {
                    updateLoggedInTime(sessionStartTime);
                }, 1000);
                console.log("Timer: Timer iniciado usando sessionStorage.");
            } else {
                console.error("Timer: Função updateLoggedInTime não definida neste escopo.");
                const loggedInTimeSpan = document.getElementById('logged-in-time');
                if (loggedInTimeSpan) {
                    loggedInTimeSpan.innerText = "Erro JS (timer)";
                }
            }
        } else {
            console.error("Timer: Valor inválido para sessionStartTime no sessionStorage. Limpando...");
            const loggedInTimeSpan = document.getElementById('logged-in-time');
            if (loggedInTimeSpan) {
                loggedInTimeSpan.innerText = "Erro no timer (storage)";
            }
            sessionStorage.removeItem('sessionStartTime');
        }
    } else {
        const urlParams = new URLSearchParams(window.location.search);
        const loginTimeParam = urlParams.get('login_time');
        console.log(`Timer: sessionStartTime não encontrado no sessionStorage. Tentando obter da URL. Valor: ${loginTimeParam}`);

        if (loginTimeParam) {
            sessionStartTime = parseInt(loginTimeParam, 10);
            if (!isNaN(sessionStartTime)) {
                console.log("Timer: sessionStartTime válido obtido da URL.");
                sessionStorage.setItem('sessionStartTime', sessionStartTime);
                console.log("Timer: sessionStartTime salvo em sessionStorage a partir da URL.");
                if (typeof updateLoggedInTime === 'function') {
                    updateLoggedInTime(sessionStartTime);
                    setInterval(() => {
                        updateLoggedInTime(sessionStartTime);
                    }, 1000);
                    console.log("Timer: Timer iniciado usando URL.");
                } else {
                    console.error("Timer: Função updateLoggedInTime não definida neste escopo (após obter da URL).");
                    const loggedInTimeSpan = document.getElementById('logged-in-time');
                    if (loggedInTimeSpan) {
                        loggedInTimeSpan.innerText = "Erro JS (timer URL)";
                    }
                }
            } else {
                console.error("Timer: Parâmetro 'login_time' inválido na URL.");
                const loggedInTimeSpan = document.getElementById('logged-in-time');
                if (loggedInTimeSpan) {
                    loggedInTimeSpan.innerText = "Erro no timer (URL)";
                }
            }
        } else {
            console.warn("Timer: Parâmetro 'login_time' não encontrado em URL nem sessionStorage. O timer não iniciará.");
            const loggedInTimeSpan = document.getElementById('logged-in-time');
            if (loggedInTimeSpan) {
                loggedInTimeSpan.innerText = "Não iniciado";
            }
        }
    }
    // --- Fim da lógica do timer logado ---

    console.log("[macros.js] window.onload UNIFICADO finalizado.");
};

function formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    // Usa padStart para adicionar um zero à esquerda se o número for menor que 10
    const paddedHours = String(hours).padStart(2, '0');
    const paddedMinutes = String(minutes).padStart(2, '0');
    const paddedSeconds = String(seconds).padStart(2, '0');

    return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
}

// Função para atualizar o span com o tempo logado
function updateLoggedInTime(sessionStartTime) {
    const loggedInTimeSpan = document.getElementById('logged-in-time');
    if (!loggedInTimeSpan) {
        console.error("Elemento com ID 'logged-in-time' não encontrado.");
        return; // Sai da função se o elemento não existir
    }

    // Calcula o tempo decorrido em milissegundos
    const now = Date.now();
    const elapsedMilliseconds = now - sessionStartTime;

    // Calcula o tempo decorrido em segundos (arredondado para baixo)
    const elapsedSeconds = Math.floor(elapsedMilliseconds / 1000);

    // Formata o tempo e atualiza o span
    loggedInTimeSpan.innerText = formatTime(elapsedSeconds);
}

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

// Carrega a foto de perfil ao iniciar
async function loadProfilePicture() {
    try {
        const userId = sessionStorage.getItem('user_id');
        if (!userId) {
            console.warn("user_id não encontrado no sessionStorage.");
            return;
        }
        const res = await eel.get_user_profile_data(userId)();
        const profileImg = document.getElementById('profile-img2');
        const profileIcon = document.getElementById('profile-icon2');
        if (res && res.status === 'success' && res.data && res.data.foto_perfil_url) {
            if (profileImg) {
                profileImg.src = res.data.foto_perfil_url;
                profileImg.style.display = 'block';
            }
            if (profileIcon) {
                profileIcon.style.display = 'none';
            }
        } else {
            if (profileImg) profileImg.style.display = 'none';
            if (profileIcon) profileIcon.style.display = 'block';
        }
    } catch (e) {
        console.error('Erro ao carregar foto de perfil:', e);
    }
}
window.addEventListener('DOMContentLoaded', loadProfilePicture);
