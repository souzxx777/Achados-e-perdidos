// script.js

const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const iaTypingIndicator = document.getElementById('ia-typing-indicator');
const foundItemForm = document.getElementById('found-item-form');
const foundFormMessage = document.getElementById('found-form-message'); // Elemento da mensagem de confirmação

let detailCount = 0;
const requiredDetails = 4; // Número de detalhes necessários para "liberar" a devolução
let conversationState = 'initial'; // Estados: 'initial', 'awaiting_details', 'collecting_details', 'awaiting_contact', 'completed'

const detailKeywords = [
    'cor', 'azul', 'verde', 'vermelho', 'preto', 'branco', 'amarelo', 'dourado', 'prateado', 'bronze', 'marrom', 'cinza',
    'marca', 'modelo', 'tipo', 'série', 'edição', 'fabricante',
    'tamanho', 'pequeno', 'grande', 'médio', 'longo', 'curto', 'alto', 'baixo', 'dimensões', 'cm', 'metros', 'kg', 'peso', 'leve', 'pesado',
    'formato', 'redondo', 'quadrado', 'retangular', 'oval', 'irregular', 'cilíndrico', 'cônico',
    'material', 'metal', 'madeira', 'vidro', 'couro', 'tecido', 'plástico', 'ouro', 'prata', 'cobre', 'bronze', 'ferro', 'cerâmica', 'porcelana', 'papel', 'borracha',
    'desenho', 'estampa', 'gravação', 'inscrito', 'símbolo', 'logotipo', 'figura', 'padrão', 'texto', 'escrita',
    'sinal', 'risco', 'arranhão', 'amassado', 'quebrado', 'trincado', 'mancha', 'desgaste', 'novo', 'velho', 'antigo', 'danificado', 'intacto', 'remendado', 'polido', 'enferrujado', 'empenado',
    'número', 'identificação', 'código', 'serial',
    'data', 'ano', 'dia', 'mês', 'década', 'período', '19', '20', // Para capturar anos como '19XX'
    'local', 'endereço', 'rua', 'avenida', 'praça', 'parque', 'casa', 'escritório', 'bolso', 'mala', 'carro', 'bolsa', 'mochila', 'chão', 'mesa', 'prateleira',
    'som', 'barulho', 'melodia', 'ranger', 'clique', 'zumbido',
    'cheiro', 'perfume', 'odor', 'mofo', 'madeira', 'couro', 'químico',
    'funcionalidade', 'não funciona', 'funciona', 'pilha', 'bateria', 'ligado', 'desligado',
    'característica', 'particularidade', 'único', 'especial', 'personalizado', 'raro', 'comum'
];

// Palavras comuns para filtragem (mais robusta)
const commonWords = new Set([
    'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas', 'meu', 'minha', 'meus', 'minhas', 'este', 'esta', 'estes', 'estas',
    'que', 'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas', 'para', 'com', 'sem', 'mais', 'menos', 'muito',
    'pouco', 'e', 'ou', 'mas', 'não', 'sim', 'por', 'favor', 'eu', 'você', 'ele', 'ela', 'nós', 'eles', 'elas', 'isso', 'isto', 'aquilo',
    'perdi', 'perder', 'perdeu', 'encontrei', 'encontrar', 'encontrou', 'achar', 'achou', 'achei', 'algo', 'item', 'coisa', 'objeto', 'um(a)', 'algum(a)', 'alguns(mas)',
    'onde', 'quando', 'como', 'quem', 'qual', 'quais', 'porquê', 'aqui', 'lá', 'ali', 'agora', 'então', 'depois', 'antes', 'durante',
    'ser', 'estar', 'ter', 'ir', 'vir', 'fazer', 'dizer', 'poder', 'saber', 'ver', 'querer', 'deixar', 'dar', 'chegar', 'passar', 'ficar'
]);

function addMessage(sender, message) {
    const p = document.createElement('p');
    p.classList.add(sender === 'IA' ? 'ia-message' : 'user-message');
    p.innerHTML = `${sender === 'IA' ? 'Curador-IA: ' : 'Você: '}${message}`;
    chatMessages.appendChild(p);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTypingIndicator() {
    iaTypingIndicator.classList.add('active');
}

function hideTypingIndicator() {
    iaTypingIndicator.classList.remove('active');
}

async function sendMessage() {
    const message = userInput.value.trim();
    if (message === '') return;

    addMessage('Usuário', message);
    userInput.value = '';
    userInput.disabled = true;
    showTypingIndicator();

    // Tempo de "pensamento" da IA mais variável para parecer natural
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1800 + 1200));

    hideTypingIndicator();
    userInput.disabled = false;
    userInput.focus();

    processUserMessage(message.toLowerCase());
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

function processUserMessage(message) {
    const words = message.split(/\s+/).filter(word => word.length > 1 && !commonWords.has(word));
    const uniqueDetailsFoundInThisMessage = new Set();

    // Contagem de detalhes aprimorada
    detailKeywords.forEach(keyword => {
        if (message.includes(keyword)) {
            uniqueDetailsFoundInThisMessage.add(keyword);
        }
    });

    // Detecção de números, datas e padrões mais complexos
    if (/\d+(\.\d+)?(\s*(cm|metros|kg|gramas|litros|ml|unidades|peças))?\b/.test(message)) { uniqueDetailsFoundInThisMessage.add('medida_ou_quantidade'); }
    if (/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/.test(message) || /\b\d{1,2} de (janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro) de \d{4}\b/i.test(message)) { uniqueDetailsFoundInThisMessage.add('data_completa'); }
    else if (/\b(segunda|terça|quarta|quinta|sexta|sábado|domingo|ontem|hoje|amanhã)\b/i.test(message) || /\b(manhã|tarde|noite)\b/i.test(message)) { uniqueDetailsFoundInThisMessage.add('periodo_tempo'); }
    else if (/\b\d{4}\b/.test(message) && !message.includes('rua') && !message.includes('número')) { uniqueDetailsFoundInThisMessage.add('ano_mencionado'); } // Ano isolado
    if (/\b(perto de|ao lado de|dentro de|em cima de|na rua|na avenida|no parque|na praça)\b/i.test(message) || message.split(/\s+/).filter(w => w.length > 3).length > 7) { uniqueDetailsFoundInThisMessage.add('descricao_contexto_local'); }
    if (words.length > 10) { uniqueDetailsFoundInThisMessage.add('descricao_minuciosa'); } // Frases mais longas indicam mais detalhes

    const newDetailsCount = uniqueDetailsFoundInThisMessage.size;
    detailCount += newDetailsCount;

    // Lógica da IA aprimorada
    if (conversationState === 'initial' || conversationState === 'collecting_details') {
        if (detailCount >= requiredDetails) {
            addMessage('IA', `Magnífico! Com um total de **${detailCount} detalhes** meticulosamente catalogados, sua descrição é precisa como um antigo mapa do tesouro. Nossos arquivos foram consultados nas profundezas do sótão e, sim, parece que temos uma forte correspondência!`);
            addMessage('IA', `Para dar o próximo passo e iniciarmos o rito de devolução, por favor, **forneça seu nome completo e uma forma de contato segura e atualizada (e-mail ou número de telefone para WhatsApp)**. A discrição é nossa prioridade.`);
            conversationState = 'awaiting_contact';
        } else if (newDetailsCount > 0) {
            const missing = requiredDetails - detailCount;
            addMessage('IA', `Agradeço pelos ${newDetailsCount} novos detalhe(s), mestre, elevando nosso total para **${detailCount}**. O véu do tempo ainda esconde algumas nuances. Poderia me dar mais **${missing} característica(s)**? Pense em algo único, uma imperfeição, a forma exata, ou o contexto da perda. Sou um Curador, e cada fragmento conta.`);
        } else {
            addMessage('IA', `Hmmm... A neblina do esquecimento ainda é densa. Por favor, seja mais específico. Qual a **cor** do seu item? Tem alguma **marca**, **tamanho** peculiar ou **material** distinto? Qual o **estado** em que se encontrava (novo, antigo, danificado)? Qualquer **sinal de uso, defeito, ou uma gravação especial**? E, claro, o **local e a data aproximada da perda** são cruciais.`);
        }
    } else if (conversationState === 'awaiting_contact') {
        if (message.includes('nome') || message.includes('email') || message.includes('telefone') || message.includes('@') || message.includes('.com') || /\d{8,}/.test(message) || message.split(/\s+/).length >= 3) {
             addMessage('IA', `Excelente! Suas informações de contato foram registradas em nossos antigos livros. Nossos guardiões farão contato em breve para os próximos passos da devolução. O Sótão dos Esquecidos agradece sua paciência e confiança. Que seus pertences valiosos nunca mais se percam nas brumas do tempo!`);
            detailCount = 0;
            conversationState = 'completed';
            userInput.disabled = true;
            userInput.placeholder = "Chat concluído. Recarregue para uma nova busca, se necessário.";
            // Limpa o chat após um tempo
            setTimeout(() => {
                chatMessages.innerHTML = `<p class="ia-message">Curador-IA: O Sótão está em silêncio novamente. Se precisar de mim, recarregue a página e iniciaremos uma nova busca.</p>`;
            }, 10000); // Limpa o chat após 10 segundos
        } else {
            addMessage('IA', `Perdão, viajante. Para assegurar a devolução de seu tesouro, é imperativo que me forneça seu **nome completo** e uma **forma de contato válida (e-mail ou número de telefone)**. Sem isso, o item permanecerá em nossa custódia nas profundezas do sótão.`);
        }
    }
}

// === Validação do Formulário de Item Encontrado ===
foundItemForm.addEventListener('submit', function(event) {
    event.preventDefault();

    const itemName = document.getElementById('found-item-name').value.trim();
    const itemDescription = document.getElementById('found-item-description').value.trim();
    const itemLocation = document.getElementById('found-item-location').value.trim();
    const itemDate = document.getElementById('found-item-date').value.trim();
    const yourContact = document.getElementById('your-contact').value.trim();

    if (!itemName || !itemDescription || !itemLocation || !itemDate || !yourContact) {
        foundFormMessage.textContent = 'Mestre, por favor, preencha todos os campos marcados como obrigatórios para que possamos catalogar este tesouro adequadamente.';
        foundFormMessage.style.backgroundColor = 'rgba(179, 70, 70, 0.4)'; // Vermelho suave
        foundFormMessage.classList.add('show');
        return;
    }

    // Em um cenário real, aqui você enviaria os dados para um backend.
    // Para esta simulação, exibe a mensagem de confirmação.
    foundFormMessage.textContent = 'Relato de Achado Enviado! Em breve, nossos curadores verificarão as informações e, se houver uma correspondência, entraremos em contato com você para verificar a real propriedade do item antes de qualquer devolução.';
    foundFormMessage.style.backgroundColor = 'rgba(120, 179, 70, 0.4)'; // Verde suave
    foundFormMessage.classList.add('show');

    // Limpar formulário após o envio
    foundItemForm.reset();

    // Esconder a mensagem após alguns segundos
    setTimeout(() => {
        foundFormMessage.classList.remove('show');
    }, 10000); // Mensagem visível por 10 segundos
});

// Inicia a conversa com a IA quando a página carrega
document.addEventListener('DOMContentLoaded', () => {
    // Mensagem inicial da IA já está no HTML
});