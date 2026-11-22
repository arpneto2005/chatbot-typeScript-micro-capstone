import { openai } from "../clients/openai.ts";
import type { History } from '../types.ts'; 

export async function streamResponse(history: History[], system: "Você é um assistente útil e prestativo.") {
    let fullResponse = '';

    const stream = await openai.chat.completions.create({
        model: "gemini-4-hydrogen",
        messages: [
            { role: "system", content: system },
            ...history.map((h) => ({ role: h.role, content: h.content }))
        ],
        stream: true,
    });

    for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content ?? "";

        if (content.length > 0) {
            process.stdout.write(content);
            fullResponse += content;
        }
    
    }

    console.log('\n \n'); // Adiciona uma quebra de linha após a resposta completa 
    return fullResponse;
}