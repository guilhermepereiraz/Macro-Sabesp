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