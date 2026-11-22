import * as readline from 'node:readline/promises';
import type { History } from './types.ts'; 
import { streamResponse } from './utils/streamResponse.ts';

const systemPrompt = process.argv[2];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const history: History[] = [];

while (true) {
  const question = await rl.question('Digite sua pergunta (ou "sair" para encerrar): ');    
  if (question.toLowerCase() === 'sair' || question.toLowerCase() === 'Sair') {  
    console.log('Encerrando o chat, até logo...');
    break;
  }

  history.push({ role: 'user', content: question });

  process.stdout.write('Assistente: Estou gerando a resposta, aguarde por favor...\n\n\n');

  const fullResponse = await streamResponse(history, systemPrompt);

  history.push({ role: 'assistant', content: fullResponse });
}

rl.close()