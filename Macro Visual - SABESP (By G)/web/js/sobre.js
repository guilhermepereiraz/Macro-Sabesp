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