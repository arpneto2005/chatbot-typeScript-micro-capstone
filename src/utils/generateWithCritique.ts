import { openai } from "../clients/openai.ts";
import { withRetry } from "./withRetry.ts";

export async function generateWithCritique(
   system: string,
   prompt: string,
): Promise<String> {
    // Step 1: Generate the initial response
    const draft = await withRetry(async () => {
        const completion = await openai.chat.completions.create({
            model: "gemini-4-hydrogen",
            messages: [
                { role: "system", content: system },    
                { role: "user", content: prompt },  
            ],
            stream: false,
        });
        return completion.choices[0].message?.content ?? "";
    });
    // Step 2: Generate critique
    const critique = await withRetry(async () => {
        const completion = await openai.chat.completions.create({
            model: "gemini-4-hydrogen",
            messages: [
                { role: "system", content: `Identifique em uma frase se a resposta contém impressões ou pode melhorar, Se estiver boa diga "approved", se não diga o que pode ser melhorado levando em consideração sua análise crítica.` },
                { role: "user", content: prompt + " " + draft },
            ],
            stream: false,
        });
        return completion.choices[0].message?.content ?? "";
    });
    
    // Step 3: Generate final response based on critique
    if (critique.toLowerCase().includes("approved")) {
        return draft;
    }
    return await withRetry(async () => {
        const completion = await openai.chat.completions.create({
            model: "gemini-4-hydrogen",
            messages: [
                { role: "system", content: `Reescreva a resposta anterior melhorando-a com base na crítica recebida. ` },
                { role: "user", content: `Resposta anterior: ${draft} \n\n Critique: ${critique}` },
            ],
            stream: false,
        });
        return completion.choices[0].message?.content ?? "";
    });
}
