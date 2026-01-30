import { GoogleGenAI } from "@google/genai";

// Serviço Híbrido de Síntese de Voz
// Prioridade 1: Voz Neural do Gemini (Google GenAI) - Extremamente Realista
// Prioridade 2: Voz do Navegador (SpeechSynthesis) - Backup Offline

let audioContext: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;
let synthesisVoice: SpeechSynthesisVoice | null = null;

// Helper para decodificar Base64
const decodeAudioData = async (base64String: string, ctx: AudioContext): Promise<AudioBuffer> => {
  const binaryString = atob(base64String);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return await ctx.decodeAudioData(bytes.buffer);
};

export const TTS = {
  init: () => {
    // Inicializa AudioContext para voz neural
    if (!audioContext && (window.AudioContext || (window as any).webkitAudioContext)) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    // Inicializa Vozes Locais (Backup)
    if ('speechSynthesis' in window) {
      const loadLocalVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        // Tenta pegar a voz da "Google Português do Brasil" ou "Microsoft" que são melhores
        synthesisVoice = voices.find(v => 
          v.lang === 'pt-BR' && (v.name.includes('Google') || v.name.includes('Microsoft Francisca') || v.name.includes('Luciana'))
        ) || voices.find(v => v.lang === 'pt-BR') || null;
      };
      loadLocalVoice();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadLocalVoice;
      }
    }
  },

  speak: async (text: string, apiKey?: string | null) => {
    // 1. Limpeza de Texto (Remove blocos de código para não ler símbolos chatos)
    let cleanText = text.replace(/```[\s\S]*?```/g, " ...Código visual disponível... ");
    cleanText = cleanText.replace(/\*\*/g, "").replace(/#/g, "").replace(/`/g, "");

    // Interrompe qualquer áudio anterior
    TTS.stop();

    // 2. Tenta usar Voz Neural (Se tiver API Key)
    if (apiKey) {
      try {
        if (!audioContext) TTS.init();
        if (audioContext?.state === 'suspended') await audioContext.resume();

        const ai = new GoogleGenAI({ apiKey });
        
        // Solicita áudio ao modelo Gemini
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-preview-tts',
          contents: {
            parts: [{ text: cleanText }]
          },
          config: {
            responseModalities: ['AUDIO'], 
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Kore' } // Kore = Voz Feminina Suave
              }
            }
          }
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

        if (base64Audio && audioContext) {
          const buffer = await decodeAudioData(base64Audio, audioContext);
          const source = audioContext.createBufferSource();
          source.buffer = buffer;
          source.connect(audioContext.destination);
          source.start(0);
          currentSource = source;
          return; // Sucesso, sai da função
        }
      } catch (error) {
        console.warn("Jarbas Neural Voice Failed, switching to local backup:", error);
        // Se falhar (erro de rede, quota, etc), cai para o fallback abaixo
      }
    }

    // 3. Fallback: Voz Local (Robótica mas funcional)
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(cleanText);
      if (synthesisVoice) utterance.voice = synthesisVoice;
      
      utterance.lang = 'pt-BR';
      // Ajustes para tentar deixar menos robótico
      utterance.rate = 1.1; 
      utterance.pitch = 1.0; 

      window.speechSynthesis.speak(utterance);
    }
  },

  stop: () => {
    // Para áudio Neural
    if (currentSource) {
      try { currentSource.stop(); } catch (e) {}
      currentSource = null;
    }
    // Para áudio Local
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
};