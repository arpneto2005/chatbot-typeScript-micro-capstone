import OpenAI from "openai";

export async function withRetry<T>(
    fn: () => Promise<T>, 
    retries: number = 3, 
    delayInSeconds: number = 1
): Promise<T> {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            const isRetryable = error instanceof OpenAI.RateLimitError || 
            error instanceof OpenAI.APIConnectionError ||
            error instanceof OpenAI.APIConnectionTimeoutError ||
            error instanceof OpenAI.APIError && 
            // 429 é o código de status para "Too Many Requests" (Limite de Taxa Excedido)
            // 500 é o código de status para "Internal Server Error" (Erro Interno do Servidor)
            (error.status == 500 || error.status == 429);
            
            if (!isRetryable || attempt === retries) {
                throw error;
            }

            const exponentialDelay = Math.pow(2, attempt) * (delayInSeconds * 1000); // Exponential backoff
            console.warn(`Attempt ${attempt} failed. Retrying in ${exponentialDelay}ms...`);
            await new Promise(res => setTimeout(res, exponentialDelay));
        }
    }   
    throw new Error("Function failed after maximum retries");
}