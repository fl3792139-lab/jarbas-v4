import { GoogleGenAI } from "@google/genai";
import { JarbasDB } from "./db";
import { processLocalResponse } from "./localBrain";

export const generateJarbasResponse = async (userMessage: string): Promise<string> => {
  // PRIORITY: Check LocalStorage (User input in APK) -> Fallback: Process Env (Dev/Web)
  const storedKey = localStorage.getItem('JARBAS_API_KEY');
  const apiKey = storedKey || process.env.API_KEY;

  let responseText = "";
  let mode = "NEURAL";

  try {
    if (!apiKey) {
        // --- MODO OFFLINE / LOCAL BRAIN ---
        // Se não houver chave, usamos o cérebro local (backup core)
        console.warn("JARBAS: API Key missing. Switching to Local Backup Core.");
        mode = "LOCAL_BACKUP";
        
        // Simular um pequeno delay de processamento local
        await new Promise(resolve => setTimeout(resolve, 600));
        
        responseText = processLocalResponse(userMessage);

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

        // 4. Call Gemini
        const response = await ai.models.generateContent({
          model: 'gemini-3-pro-preview', 
          contents: [
            { role: 'user', parts: [{ text: fullPrompt }] }
          ],
          config: {
              systemInstruction: systemInstruction,
              thinkingConfig: { thinkingBudget: 2048 }
          }
        });

        responseText = response.text || "Erro no processamento neural.";

        // Update Learning State only when online (Evolution requires complex data)
        if (learningState) {
            await JarbasDB.updateLearningState(learningState.nivel_inteligencia + 1, learningState.areas_dominadas);
        }
    }

    // 5. Save Interaction to DB (Long-term memory works in both modes)
    await JarbasDB.saveConversation({
      mensagem_usuario: userMessage,
      resposta_jarbas: responseText,
      contexto: mode === 'NEURAL' ? 'general' : 'local_fallback',
      data: Date.now()
    });

    return responseText;

  } catch (error: any) {
    console.error("Jarbas Critical Error:", error);
    
    // Friendly error handling
    const errorMsg = error.toString();
    if (errorMsg.includes("404") || (error.status === 404)) {
        return `[ERRO DE PROTOCOLO 404] O modelo 'gemini-3-pro-preview' não está acessível. Tentando reverter para backup local...`;
    }
    if (errorMsg.includes("API Key")) {
        return `[ACESSO NEGADO] ${error.message}`;
    }
    
    // Last resort fallback
    return `[FALHA CRÍTICA DO SISTEMA] ${error.message}`;
  }
};