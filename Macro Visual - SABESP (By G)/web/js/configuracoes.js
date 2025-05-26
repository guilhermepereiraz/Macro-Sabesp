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


    // Inicialmente esconde todas as seções de detalhes e o breadcrumb
    detailSections.forEach(section => {
        section.style.display = 'none';
    });
    breadcrumb.style.display = 'none';

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
            if (configGrid) {
                configGrid.style.display = 'none';
            }
            if (quickSettingsSection) {
                quickSettingsSection.style.display = 'none';
            }
            if (otherSettingsGrid) {
                otherSettingsGrid.style.display = 'none';
            }

            // Atualiza o Breadcrumb
            breadcrumb.style.display = 'flex';
            // Encontra o nome do card que corresponde à seção
            const cardName = document.querySelector(`.config-card[data-section="${sectionId}"]`)
                ? document.querySelector(`.config-card[data-section="${sectionId}"]`).dataset.cardName
                : targetSection.querySelector('.section-title').textContent; // Fallback se não tiver data-card-name
            currentSectionSpan.textContent = cardName;
            breadcrumbMainLink.style.display = 'inline'; // Garante que "Configurações" esteja visível
            breadcrumb.querySelector('.breadcrumb-separator').style.display = 'inline';

            targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
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
            quickSettingsSection.style.display = 'block'; // Mostra novamente a seção de sugestões
        }
        if (otherSettingsGrid) {
            otherSettingsGrid.style.display = 'block'; // Corrigido para 'block' para garantir exibição correta
            const tiloerro = document.getElementById('tito').style.display = 'none'; // Corrigido para 'block' para garantir exibição correta
        }
        // Esconde o breadcrumb ou volta para o estado inicial
        breadcrumb.style.display = 'none';
        currentSectionSpan.textContent = '';
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
    const telefoneInput = document.getElementById('telefone');
    const emailError = document.getElementById('email-error');
    const telefoneError = document.getElementById('telefone-error');

    const formPerfilCredenciais = document.getElementById('form-perfil-credenciais');
    const perfilSenhaAtualInput = document.getElementById('perfil-senha-atual');
    const perfilNovaSenhaInput = document.getElementById('perfil-nova-senha');
    const perfilConfirmarSenhaInput = document.getElementById('perfil-confirmar-senha');
    const perfilAutenticacaoDoisFatoresToggle = document.getElementById('perfil-autenticacao-dois-fatores');

    const perfilSenhaAtualError = document.getElementById('perfil-senha-atual-error');
    const perfilNovaSenhaError = document.getElementById('perfil-nova-senha-error');
    const perfilConfirmarSenhaError = document.getElementById('perfil-confirmar-senha-error');


    // Lógica para o botão "Editar" / "Salvar" do Perfil (Informações Pessoais)
    editPerfilInfoBtn.addEventListener('click', function () {
        emailInput.readOnly = false;
        telefoneInput.readOnly = false;
        editPerfilInfoBtn.style.display = 'none';
        savePerfilInfoBtn.style.display = 'inline-block';
        emailInput.focus();
    });

    formPerfilInfo.addEventListener('submit', function (event) {
        event.preventDefault();
        let isValid = true;
        emailError.textContent = '';
        telefoneError.textContent = '';

        if (!emailInput.value.includes('@') || !emailInput.value.includes('.')) {
            emailError.textContent = 'E-mail inválido.';
            isValid = false;
        }

        const telefoneRegex = /^\(?\d{2}\)?[\s-]?\d{4,5}-?\d{4}$/;
        if (!telefoneRegex.test(telefoneInput.value) && telefoneInput.value !== '') { // Permite telefone vazio
            telefoneError.textContent = 'Telefone inválido (ex: (XX) XXXXX-XXXX).';
            isValid = false;
        }

        if (isValid) {
            console.log('Dados do perfil salvos:', {
                nome: nomeInput.value,
                email: emailInput.value,
                telefone: telefoneInput.value
            });
            emailInput.readOnly = true;
            telefoneInput.readOnly = true;
            editPerfilInfoBtn.style.display = 'inline-block';
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
    deleteAccountBtn.addEventListener('click', function () {
        showConfirmationModal('Excluir Conta', 'Esta ação é irreversível e excluirá todos os seus dados. Deseja continuar?', () => {
            // Lógica para exclusão da conta aqui
            console.log('Conta excluída!');
            showToast('Sua conta foi excluída com sucesso.', 'info');
            // Redirecionar para página de login ou confirmação
        });
    });


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
            enableAnimations: document.getElementById('enable-animations').checked
        });
        showToast('Preferências salvas com sucesso!', 'success');
    });

    resetPreferencesBtn.addEventListener('click', function () {
        showConfirmationModal('Redefinir Preferências', 'Isso restaurará todas as suas preferências para os valores padrão do sistema. Deseja continuar?', () => {
            // Lógica para redefinir as preferências para os valores padrão
            document.getElementById('idioma').value = 'pt-BR';
            document.getElementById('tema').value = 'claro';
            document.getElementById('enable-animations').checked = true;
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
        formVincularNeta.addEventListener('submit', function (event) {
            event.preventDefault(); // Impede o envio padrão do formulário

            const login = document.getElementById('neta-login').value;
            const senha = document.getElementById('neta-senha').value;

            // Simulação de chamada API ou lógica de vinculação
            console.log('Tentando vincular Neta com:', { login, senha });

            // Exibir mensagem de status
            netaStatus.style.display = 'block';
            netaStatus.classList.remove('success', 'error');

            if (login && senha) {
                // Aqui você faria a chamada real para o backend
                // Por exemplo: fetch('/api/vincular-neta', { method: 'POST', body: JSON.stringify({ login, senha }) })
                // .then(response => response.json())
                // .then(data => {
                //     if (data.success) {
                //         netaStatus.textContent = 'Neta vinculada com sucesso!';
                //         netaStatus.classList.add('success');
                //         showToast('Neta vinculada com sucesso!', 'success');
                //     } else {
                //         netaStatus.textContent = 'Erro ao vincular Neta: ' + (data.message || 'Credenciais inválidas.');
                //         netaStatus.classList.add('error');
                //         showToast('Erro ao vincular Neta.', 'error');
                //     }
                // })
                // .catch(error => {
                //     netaStatus.textContent = 'Erro de conexão ao vincular Neta.';
                //     netaStatus.classList.add('error');
                //     showToast('Erro de rede ao vincular Neta.', 'error');
                // });

                // Simulação de sucesso após um pequeno atraso
                setTimeout(() => {
                    netaStatus.textContent = 'Neta vinculada com sucesso!';
                    netaStatus.classList.add('success');
                    showToast('Neta vinculada com sucesso!', 'success');
                    // Opcional: Limpar campos após sucesso
                    // document.getElementById('neta-login').value = '';
                    // document.getElementById('neta-senha').value = '';
                }, 1000);

            } else {
                netaStatus.textContent = 'Por favor, preencha login e senha para Neta.';
                netaStatus.classList.add('error');
                showToast('Preencha os campos para Neta.', 'error');
            }
        });
    }

    // Lógica para o formulário Vincular WFM
    if (formVincularWFM) {
        formVincularWFM.addEventListener('submit', function (event) {
            event.preventDefault(); // Impede o envio padrão do formulário

            const login = document.getElementById('wfm-login').value;
            const senha = document.getElementById('wfm-senha').value;

            // Simulação de chamada API ou lógica de vinculação
            console.log('Tentando vincular WFM com:', { login, senha });

            // Exibir mensagem de status
            wfmStatus.style.display = 'block';
            wfmStatus.classList.remove('success', 'error');

            if (login && senha) {
                // Aqui você faria a chamada real para o backend
                // fetch('/api/vincular-wfm', { method: 'POST', body: JSON.stringify({ login, senha }) })
                // .then(response => response.json())
                // .then(data => {
                //     if (data.success) {
                //         wfmStatus.textContent = 'WFM vinculado com sucesso!';
                //         wfmStatus.classList.add('success');
                //         showToast('WFM vinculado com sucesso!', 'success');
                //     } else {
                //         wfmStatus.textContent = 'Erro ao vincular WFM: ' + (data.message || 'Credenciais inválidas.');
                //         wfmStatus.classList.add('error');
                //         showToast('Erro ao vincular WFM.', 'error');
                //     }
                // })
                // .catch(error => {
                //     wfmStatus.textContent = 'Erro de conexão ao vincular WFM.';
                //     wfmStatus.classList.add('error');
                //     showToast('Erro de rede ao vincular WFM.', 'error');
                // });

                // Simulação de sucesso após um pequeno atraso
                setTimeout(() => {
                    wfmStatus.textContent = 'WFM vinculado com sucesso!';
                    wfmStatus.classList.add('success');
                    showToast('WFM vinculado com sucesso!', 'success');
                    // Opcional: Limpar campos após sucesso
                    // document.getElementById('wfm-login').value = '';
                    // document.getElementById('wfm-senha').value = '';
                }, 1000);

            } else {
                wfmStatus.textContent = 'Por favor, preencha login e senha para WFM.';
                wfmStatus.classList.add('error');
                showToast('Preencha os campos para WFM.', 'error');
            }
        });
    }

});

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

document.addEventListener('DOMContentLoaded', (event) => {
    console.log('DOMContentLoaded disparado. Chamando iniciarTransicaoPagina.');
    // Chama a função que inicia a transição da página
    iniciarTransicaoPagina();

    // Se você tiver outras inicializações que precisam do DOM pronto
    // mas NÃO precisam esperar pela transição ou pelo setTimeout dentro de iniciarTransicaoPagina,
    // você pode colocá-las aqui fora do setTimeout da transição.

    console.log('DOMContentLoaded finalizado.');
});

function iniciarTransicaoPagina() {
    console.log("[macros.js] Chamada a iniciarTransicaoPagina.");
    const bodyElement = document.body;
    if (bodyElement) {
        bodyElement.style.display = 'block';
        setTimeout(() => {
            bodyElement.classList.add('is-visible');
            console.log("[macros.js] Transição de entrada iniciada para o body.");
            // Inicializa o carrossel aqui, após o display ser ajustado e um pequeno atraso
            calculateCarouselMetrics(); // <-- Nota: Esta função precisa estar definida e acessível
            updateCarouselDisplay(); // <-- Nota: Esta função precisa estar definida e acessível
        }, 5); // Atraso após display:block antes de adicionar a classe e inicializar carrossel
    } else {
        console.error("[macros.js] Elemento body não encontrado.");
    }
}

window.deslogar = function () {
    console.log("[macrosite.js] Chamada a deslogar.");
    sessionStorage.removeItem('nomeUsuario'); // Limpa o nome de usuário da sessão
    console.log("[macrosite.js] sessionStorage 'nomeUsuario' limpo. Redirecionando para login.html");
    window.location.href = './login.html'; // Redireciona para a página de login
};

window.onload = async function () {
    console.log("[macros.js] window.onload UNIFICADO iniciado.");

    const nomeUsuarioElement = document.getElementById('nome-usuario');
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
                console.log("[macros.js] Nome do usuário obtido por ID e armazenado em sessionStorage.");
            } else {
                console.error("[macros.js] Falha ao obter nome do usuário por ID:", resultadoNome);
            }
        } catch (error) {
            console.error("[macros.js] Erro na chamada Eel para get_username_by_id:", error);
        }
    } else {
        identificadorUsuario = sessionStorage.getItem('nomeUsuario');
        if (identificadorUsuario) {
            console.log("[macros.js] Nome do usuário obtido do sessionStorage (fallback).");
        } else {
            console.log("[macros.js] Nome do usuário não encontrado em URL ou sessionStorage. Usuário pode não estar logado.");
        }
    }

    if (identificadorUsuario && nomeUsuarioElement) {
        nomeUsuarioElement.textContent = identificadorUsuario;
        console.log("[macros.js] Nome do usuário exibido:", identificadorUsuario);
    } else if (nomeUsuarioElement) {
        nomeUsuarioElement.textContent = "Usuário Padrão";
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


