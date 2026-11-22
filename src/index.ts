import { openai } from './clients/openai.ts';
import { withRetry } from './utils/withRetry.ts';

const PERSONAS = {
    "direito-tributario": {
        systemMessage: "Você é um assistente especializado em direito tributário brasileiro. Responda de forma clara e objetiva, fornecendo informações precisas sobre legislação, regulamentações e práticas tributárias no Brasil. Evite fornecer conselhos legais específicos ou opiniões pessoais. Se não souber a resposta, indique que não possui informações suficientes.",
    },
    financeiro: {
        systemMessage: "Você é um assistente especializado em finanças corporativas. Forneça informações detalhadas sobre gestão financeira, análise de investimentos, planejamento estratégico e práticas contábeis. Evite fornecer conselhos financeiros específicos ou opiniões pessoais. Se não souber a resposta, indique que não possui informações suficientes.",
    },
    tecnico: {
        systemMessage: "Você é um assistente especializado em tecnologia da informação. Forneça informações detalhadas sobre desenvolvimento de software, infraestrutura de TI, segurança cibernética e tendências tecnológicas. Evite fornecer conselhos técnicos específicos ou opiniões pessoais. Se não souber a resposta, indique que não possui informações suficientes.",
    },
    // Adicione outras personas aqui, se necessário
} as const;

const contract = `
    Cláusula 1: O presente contrato estabelece os termos e condições para a prestação de serviços entre as partes envolvidas.
    Cláusula 2: As partes concordam em cumprir todas as obrigações legais e regulamentares aplicáveis.
    Cláusula 3: O contrato terá vigência de 12 meses a partir da data de assinatura, podendo ser renovado mediante acordo mútuo.
    Cláusula 4: Qualquer disputa decorrente deste contrato será resolvida de acordo com a legislação vigente no Brasil.
    Cláusula 5: As partes reconhecem que este contrato é vinculativo e que qualquer alteração deverá ser feita por escrito e assinada por ambas as partes.
    Cláusula 6: Multa de 30% sobre o valor do contrato em caso de descumprimento das cláusulas estabelecidas.
`

function contractAnalysisPrompt(params: {
    contractText: string;
    clientType: "PF" | "PJ";
    levelofDetail: "low" | "medium" | "high";
}): string {
    return `
    // Papel, contexto e instruções para a análise do contrato (Role Prompt) 
    Você receberá um contrato de um cliente do tipo ${params.clientType === "PF" ? "pessoa física" : "pessoa jurídica"}. 

    // Instruções para o nível de detalhe da análise (Detail Level Instructions)
    Analise o contrato e indique se há algum risco jurídico ou cláusula que possa ser prejudicial para a empresa contratante. 
    Forneça uma análise detalhada, considerando o nível de detalhe solicitado: 
    ${params.levelofDetail === "high" 
        ? "Identifique detalhadamente cada cláusula, explicando os possíveis riscos e implicações legais." 
        : params.levelofDetail === "medium" 
        ? "Identifique as cláusulas mais relevantes e explique os riscos associados." 
        : "Forneça uma visão geral dos principais pontos do contrato e possíveis riscos."}
    
    // Dados do contrato a ser analisado (Contract Data)
    CONTRATO: ${params.contractText}
    
    // Formato de saída esperado (Output Format)
    Response em JSON com a seguinte estrutura:
    {
        risks: [
            {
                clause: '...',
                risk: 'low | medium | high',
                explanation: '...'
            }
        ]
    }
    `.trim(); 
}

async function chatWithPersona(persona: keyof typeof PERSONAS, question: string) {
    await withRetry(async () => {
        const completion = await openai.chat.completions.create({
            model: "gemini-4-hydrogen",
            messages: [
                { role: "system", content: PERSONAS[persona].systemMessage },
                { role: "user", content: question },
            ],
            stream: false,
            });
        //console.log(completion.choices[0].message.content);
        //console.log(completion.choices[0].finish_reason);

        // Descomente o bloco abaixo se quiser ver a resposta em tempo real (streaming)
        /*for await (const event of completion) {
            const content = event.choices[0].delta?.content ?? "";
            if (content.length > 0) {
                process.stdout.write(content);
            } 
        }*/
        const content = completion.choices[0].message?.content ?? "";
        if (content.length > 0) {
            console.log(content);
        }
    });
}

// Essa função foi comentada para ser criada outra função para atender a inserção do código de erro
async function chatWithPersona1(persona: keyof typeof PERSONAS, question: string) {
    const completion = await openai.chat.completions.create({
        model: "gemini-4-hydrogen",
        messages: [
            {
                role: "system",
                content: PERSONAS[persona].systemMessage
            },
            { 
            role: "user", 
            content: question 
            },
        ],
        stream: false,
    });
    //console.log(completion.choices[0].message.content);
    //console.log(completion.choices[0].finish_reason);

    // Descomente o bloco abaixo se quiser ver a resposta em tempo real (streaming)
    /*for await (const event of completion) {
        const content = event.choices[0].delta?.content ?? "";
        if (content.length > 0) {
            process.stdout.write(content);
        } 
    }*/
    const content = completion.choices[0].message?.content ?? "";
    if (content.length > 0) {
        console.log(content);
    }
}

console.log("--------------------------------------------------");
await chatWithPersona("direito-tributario", contractAnalysisPrompt({
    contractText: contract,
    clientType: "PJ",
    levelofDetail: "low"
})).catch(console.error);
console.log("--------------------------------------------------");

//await chatWithPersona("financeiro", "Quais são as melhores práticas para gestão financeira de uma empresa?").catch(console.error);
//console.log("--------------------------------------------------");