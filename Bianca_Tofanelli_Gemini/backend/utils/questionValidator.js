// utils/questionValidator.js
export function validateQuestionDetails(type, details) {
  if (type === 'MULTIPLE_CHOICE') {
    if (!details.options || !Array.isArray(details.options) || details.options.length < 4) {
      throw new Error('Questões de múltipla escolha precisam de pelo menos 4 alternativas.');
    }
    if (details.correctOptionIndex === undefined || details.correctOptionIndex < 0 || details.correctOptionIndex >= details.options.length) {
      throw new Error('A indicação da alternativa correta é inválida.');
    }
  }

  if (type === 'TRUE_FALSE') {
    if (typeof details.correctAnswer !== 'boolean') {
      throw new Error('Questões de Verdadeiro/Falso precisam indicar a resposta correta (true/false).');
    }
  }

  if (type === 'ESSAY') {
    // Palavras-chave opcionais, mas se existirem, devem ser um array de strings
    if (details.keywords && !Array.isArray(details.keywords)) {
      throw new Error('As palavras-chave esperadas devem ser uma lista de textos.');
    }
  }
}