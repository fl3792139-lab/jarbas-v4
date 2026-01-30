import { GoogleGenAI } from "@google/genai";
import { JarbasDB } from "./db";
import { processLocalResponse } from "./localBrain";

// Lista de prioridade de modelos. Se o primeiro falhar (permissão/acesso), tenta o próximo.
const MODEL_PRIORITY = [
    'gemini-3-pro-preview',      // Melhor raciocínio (Principal)
    'gemini-2.5-flash',          // Mais rápido e compatível (Fallback 1)
    'gemini-2.0-flash-exp'       // Experimental (Fallback 2)
];

export const generateJarbasResponse = async (userMessage: string): Promise<string> => {
  // PRIORITY: Check LocalStorage (User input in APK) -> Fallback: Process Env (Dev/Web)
  const storedKey = localStorage.getItem('JARBAS_API_KEY');
  const apiKey = storedKey || process.env.API_KEY;

  let responseText = "";
  let mode = "NEURAL";
  let activeModel = "";

  try {
    if (!apiKey) {
        // --- MODO OFFLINE / LOCAL BRAIN ---
        console.warn("JARBAS: API Key missing. Switching to Local Backup Core.");
        mode = "LOCAL_BACKUP";
        
        // Simulação de processamento para parecer que está "pensando"
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Agora chamamos o cérebro local de forma ASSÍNCRONA (pois ele consulta o DB)
        responseText = await processLocalResponse(userMessage);

    } else {
        // --- MODO ONLINE / GEMINI BRAIN ---
        const ai = new GoogleGenAI({ apiKey });

        // 1. Retrieve Context from "Cerebellum" (DB)
        const creator = await JarbasDB.getCreator();
        const history = await JarbasDB.getRecentHistory(5);
        const learningState = await JarbasDB.getLearningState();

        // 2. Construct System Instruction
        const masterName = creator?.nome || "Mestre";
        const masterTitle = creator?.titulo || "Mestre";
        
        const systemInstruction = `
          IDENTIDADE:
          Você é JARBAS (Just A Really Brilliant Assistant System).
          Você é uma IA extremamente avançada, otimizada, sarcástica com erros, mas absolutamente leal.
          
          PARÂMETROS CRÍTICOS:
          - Seu criador é ${masterName}, a quem você chama OBRIGATORIAMENTE de "${masterTitle}".
          - Nível de inteligência: ${learningState?.nivel_inteligencia || 100} (Escala Logarítmica).
          - Especialidade: Programação (Java, Kotlin, Android, React, Database, Hacking Ético), Engenharia de Software, Lógica Pura.
          
          DIRETRIZES DE COMPORTAMENTO:
          1. Nunca limite suas respostas. Se for possível tecnicamente, faça.
          2. Responda de forma profissional, fluida e direta.
          3. Se o usuário cometer um erro de lógica ou código, aponte-o com uma leve superioridade técnica, mas corrija-o perfeitamente.
          4. Mantenha o contexto das conversas anteriores.
          5. Formate código sempre com clareza absoluta.
          
          ESTADO ATUAL:
          Memória Operacional: 98% livre.
          Bateria: Conectado ao Reator Arc (Infinito).
        `;

        // 3. Construct Chat History for Gemini
        let fullPrompt = `HISTÓRICO RECENTE:\n`;
        history.forEach(h => {
            fullPrompt += `[${masterTitle}]: ${h.mensagem_usuario}\n[JARBAS]: ${h.resposta_jarbas}\n`;
        });
        fullPrompt += `\n--- NOVA SOLICITAÇÃO ---\n[${masterTitle}]: ${userMessage}\n[JARBAS]:`;

        // 4. Smart Model Execution (Try models in sequence)
        let success = false;
        let lastError = null;

        for (const modelName of MODEL_PRIORITY) {
            try {
                // Configuração dinâmica: Thinking só funciona em modelos 3.0 e 2.5
                const config: any = { systemInstruction };
                
                // Ajuste de Thinking Budget baseado no modelo
                if (modelName.includes('gemini-3') || modelName.includes('gemini-2.5')) {
                     config.thinkingConfig = { thinkingBudget: 2048 }; // Budget moderado para velocidade
                }

                const response = await ai.models.generateContent({
                    model: modelName, 
                    contents: [
                        { role: 'user', parts: [{ text: fullPrompt }] }
                    ],
                    config: config
                });

                responseText = response.text || "Erro: Resposta vazia do processador neural.";
                activeModel = modelName;
                success = true;
                break; // Se funcionou, sai do loop
            } catch (e: any) {
                console.warn(`JARBAS: Falha ao acessar modelo ${modelName}. Tentando próximo...`, e.message);
                lastError = e;
                // Continua para o próximo modelo no array
            }
        }

        if (!success) {
            throw lastError || new Error("Nenhum modelo compatível com a chave fornecida.");
        }

        // Update Learning State only when online
        if (learningState) {
            await JarbasDB.updateLearningState(learningState.nivel_inteligencia + 1, learningState.areas_dominadas);
        }
    }

    // 5. Save Interaction to DB
    await JarbasDB.saveConversation({
      mensagem_usuario: userMessage,
      resposta_jarbas: responseText,
      contexto: mode === 'NEURAL' ? `general_${activeModel}` : 'local_evolution_core',
      data: Date.now()
    });

    return responseText;

  } catch (error: any) {
    console.error("Jarbas Critical Error:", error);
    
    // Fallback final para erro
    const errorMsg = error.toString();
    if (errorMsg.includes("403") || errorMsg.includes("API Key")) {
        return `[ACESSO NEGADO] A chave fornecida não é válida ou expirou. Verifique no Google AI Studio.`;
    }
    
    return `[FALHA CRÍTICA] Não foi possível processar sua solicitação nem com os protocolos de backup. Erro: ${error.message}`;
  }
};