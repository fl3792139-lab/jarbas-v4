import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, Power, Settings, RefreshCw, Trash2, WifiOff, Wifi, Volume2, VolumeX } from 'lucide-react';
import { JarbasDB } from './services/db';
import { generateJarbasResponse } from './services/jarbasBrain';
import { ChatMessage, Role, JarbasStatus } from './types';
import { TerminalOutput } from './components/TerminalOutput';
import { SettingsModal } from './components/SettingsModal';
import { TTS } from './services/tts';

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<JarbasStatus>('INITIALIZING');
  const [isBooting, setIsBooting] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null); // Store key for TTS
  
  // Estado inicial é FALSE para voz, até o usuário confirmar
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false); 
  // Estado para saber se estamos esperando a resposta da configuração
  const [isConfiguringVoice, setIsConfiguringVoice] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Check key function
  const checkKey = () => {
     const key = localStorage.getItem('JARBAS_API_KEY') || process.env.API_KEY || null;
     setHasApiKey(!!key);
     setApiKey(key);
     return !!key;
  };

  // --- SECURITY PROTOCOLS ---
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F12') e.preventDefault();
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) e.preventDefault();
      if (e.ctrlKey && e.key === 'u') e.preventDefault();
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    console.log(
      "%c⚠️ PROTOCOLO DE SEGURANÇA ATIVO ⚠️",
      "color: red; font-size: 24px; font-weight: bold; background-color: black; padding: 10px;"
    );

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Initialization Sequence
  useEffect(() => {
    const bootSequence = async () => {
      await JarbasDB.init();
      TTS.init();
      checkKey();
      
      setTimeout(() => {
        setIsBooting(false);
        setStatus('IDLE');
        
        // Mensagem de Boas-vindas + Pergunta de Configuração
        const introText = 'Sistemas online. Conexão Neural estabelecida.';
        const configText = 'Mestre, deseja ativar a comunicação por **Voz**? (Responda Sim ou Não)';

        addMessage({
          id: 'init-1',
          role: Role.MODEL,
          text: introText,
          timestamp: Date.now()
        });

        setTimeout(() => {
             addMessage({
                id: 'init-2',
                role: Role.MODEL,
                text: configText,
                timestamp: Date.now() + 100
            });
            // NOTA: Não usamos TTS.speak aqui. O Jarbas fica mudo esperando a ordem.
        }, 500);

      }, 2500);
    };
    bootSequence();
  }, []);

  // Monitor Settings Close to refresh key status
  useEffect(() => {
      if (!isSettingsOpen) {
          checkKey();
      }
  }, [isSettingsOpen]);

  // Auto-scroll logic
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: 'smooth'
      });
    }
  }, [messages, status]);

  const addMessage = (msg: ChatMessage) => {
    setMessages(prev => [...prev, msg]);
  };

  const handleClearHistory = async () => {
    if (window.confirm('Mestre, deseja realmente formatar a memória episódica? Isso apagará todo o histórico de conversas.')) {
      await JarbasDB.clearHistory();
      setMessages([]);
      TTS.stop();
      
      // Reinicia o processo de pergunta
      setIsConfiguringVoice(true);
      setIsVoiceEnabled(false);

      addMessage({
        id: Date.now().toString(),
        role: Role.SYSTEM,
        text: '>> MEMÓRIA FORMATADA.',
        timestamp: Date.now()
      });
      addMessage({
        id: (Date.now() + 1).toString(),
        role: Role.MODEL,
        text: 'Mestre, deseja ativar a comunicação por Voz agora? (Sim/Não)',
        timestamp: Date.now()
      });
    }
  };

  const handleToggleVoice = () => {
    const newState = !isVoiceEnabled;
    setIsVoiceEnabled(newState);
    if (!newState) {
      TTS.stop();
    } else {
      TTS.speak("Interface de voz ativada.", apiKey);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || status === 'THINKING') return;

    TTS.stop();
    const userText = input;
    const lowerInput = userText.toLowerCase();
    
    setInput('');

    // Adiciona mensagem do usuário
    addMessage({
      id: Date.now().toString(),
      role: Role.USER,
      text: userText,
      timestamp: Date.now()
    });

    // --- FASE 1: CONFIGURAÇÃO INICIAL (INTERCEPTAÇÃO) ---
    if (isConfiguringVoice) {
        let voiceDecision = false;
        let responseConf = "";

        // Lógica para entender "Sim" (Voz) ou "Não" (Texto)
        if (lowerInput.includes('sim') || lowerInput.includes('s') || lowerInput.includes('voz') || lowerInput.includes('fale') || lowerInput.includes('quero')) {
            voiceDecision = true;
            responseConf = "Entendido, Mestre. **Protocolos de áudio ativados**. Aguardando ordens.";
        } else {
            voiceDecision = false;
            responseConf = "Entendido. Manterei o **modo silencioso** (apenas texto). Aguardando ordens.";
        }

        setIsVoiceEnabled(voiceDecision);
        setIsConfiguringVoice(false); // Sai do modo de configuração

        addMessage({
            id: (Date.now() + 1).toString(),
            role: Role.MODEL,
            text: responseConf,
            timestamp: Date.now()
        });

        // Se ativou voz, fala a confirmação
        if (voiceDecision) {
            TTS.speak(responseConf, apiKey);
        }
        return; // Retorna aqui para não chamar a IA nesta rodada
    }

    // --- FASE 2: COMANDOS DE CONTROLE DE VOZ (DURANTE O USO) ---
    let shouldSpeak = isVoiceEnabled; 

    if (lowerInput.includes('não fale') || lowerInput.includes('nao fale') || lowerInput.includes('só escreva') || lowerInput.includes('so escreva') || lowerInput.includes('silêncio')) {
        shouldSpeak = false;
        setIsVoiceEnabled(false);
    }
    else if (lowerInput.includes('fale e escreva') || lowerInput.includes('volte a falar') || lowerInput.includes('ative a voz')) {
        shouldSpeak = true;
        setIsVoiceEnabled(true);
    }

    setStatus('THINKING');

    try {
      // Chama o Cérebro (Brain)
      const responseText = await generateJarbasResponse(userText);
      
      addMessage({
        id: (Date.now() + 1).toString(),
        role: Role.MODEL,
        text: responseText,
        timestamp: Date.now()
      });

      if (shouldSpeak) {
        TTS.speak(responseText, apiKey);
      }
      
      setStatus('IDLE');
    } catch (e: any) {
      setStatus('ERROR');
      const errorText = `Falha Crítica: ${e.message || 'Erro desconhecido'}.`;
      addMessage({
        id: Date.now().toString(),
        role: Role.SYSTEM,
        text: errorText,
        timestamp: Date.now()
      });
      if (shouldSpeak) TTS.speak("Falha crítica detectada.", apiKey);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isBooting) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-jarbas-dark text-jarbas-primary font-orbitron relative overflow-hidden select-none">
        <div className="absolute inset-0 bg-[url('https://picsum.photos/1920/1080')] opacity-5 bg-cover"></div>
        <div className="z-10 text-4xl mb-4 font-bold tracking-widest animate-pulse">J.A.R.B.A.S.</div>
        <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden border border-jarbas-secondary">
          <div className="h-full bg-jarbas-primary animate-[scan_2s_ease-in-out_infinite] w-full origin-left"></div>
        </div>
        <div className="mt-4 text-xs font-mono text-jarbas-secondary">INITIALIZING LOCAL CORES...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen supports-[height:100dvh]:h-[100dvh] bg-jarbas-dark text-slate-200 font-sans overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#050a10] to-black select-none">
      
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Header HUD */}
      <header className="flex items-center justify-between p-4 border-b border-jarbas-secondary/20 bg-black/40 backdrop-blur-sm shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center border shadow-[0_0_15px_rgba(6,182,212,0.4)] ${hasApiKey ? 'bg-jarbas-secondary/10 border-jarbas-primary' : 'bg-yellow-900/20 border-yellow-500'}`}>
             <div className={`w-3 h-3 rounded-full ${status === 'THINKING' ? 'animate-ping' : ''} ${hasApiKey ? 'bg-jarbas-primary' : 'bg-yellow-500'}`}></div>
          </div>
          <div>
            <h1 className="text-2xl font-orbitron font-bold text-jarbas-primary tracking-wider">JARBAS</h1>
            <div className="flex items-center gap-2">
                <p className="text-[10px] text-jarbas-secondary font-mono tracking-widest uppercase">System v2.5.0</p>
                <span className={`text-[9px] px-1 rounded font-bold ${hasApiKey ? 'bg-jarbas-primary text-black' : 'bg-yellow-500 text-black'}`}>
                    {hasApiKey ? 'ONLINE' : 'LOCAL MODE'}
                </span>
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <div 
            className={`flex items-center justify-center cursor-pointer transition-colors ${isVoiceEnabled ? 'text-jarbas-primary animate-pulse' : 'text-slate-600'}`}
            title={isVoiceEnabled ? "Desativar Voz" : "Ativar Voz"}
            onClick={handleToggleVoice}
          >
             {isVoiceEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </div>
          
          <div className="w-px h-6 bg-jarbas-secondary/20 mx-1"></div>
          
          <Trash2 
            className="text-jarbas-secondary hover:text-jarbas-alert cursor-pointer transition-colors" 
            size={20} 
            onClick={handleClearHistory}
            title="Limpar Memória (Histórico)"
          />
          <Settings 
            className={`text-jarbas-secondary hover:text-white cursor-pointer transition-colors ${!hasApiKey ? 'animate-pulse text-yellow-400' : ''}`}
            size={20} 
            onClick={() => setIsSettingsOpen(true)}
            title="Configuração Neural (API Key)"
          />
          <Power className="text-jarbas-alert hover:text-red-400 cursor-pointer transition-colors" size={20} />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col max-w-5xl mx-auto w-full p-4 md:p-6 overflow-hidden relative">
        
        {/* Chat Area - Optimized for Mobile Scrolling */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto mb-4 space-y-6 pr-2 scroll-container select-text" 
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex ${msg.role === Role.USER ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[85%] md:max-w-[65%] p-3 rounded-lg border backdrop-blur-md ${
                  msg.role === Role.USER 
                    ? 'bg-jarbas-secondary/10 border-jarbas-secondary/30 text-right rounded-tr-none' 
                    : msg.role === Role.SYSTEM
                      ? 'bg-red-900/20 border-red-500/50 text-red-400'
                      : hasApiKey 
                        ? 'bg-slate-900/80 border-jarbas-primary/30 rounded-tl-none shadow-[0_0_15px_rgba(0,0,0,0.5)]'
                        : 'bg-yellow-900/10 border-yellow-500/30 rounded-tl-none' 
                }`}
              >
                <div className="flex items-center gap-2 mb-2 border-b border-white/5 pb-1">
                    <span className={`text-xs font-orbitron ${
                        msg.role === Role.USER ? 'ml-auto text-jarbas-secondary' 
                        : msg.role === Role.SYSTEM ? 'text-red-500' 
                        : hasApiKey ? 'text-jarbas-primary' : 'text-yellow-500'
                    }`}>
                        {msg.role === Role.USER ? 'MESTRE' : msg.role === Role.SYSTEM ? 'SISTEMA' : 'JARBAS (LOCAL)'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                </div>
                <div className={`${
                    msg.role === Role.USER ? 'text-slate-200' 
                    : msg.role === Role.SYSTEM ? 'text-red-300 font-mono' 
                    : 'text-cyan-50'
                }`}>
                  {msg.role === Role.MODEL ? (
                    <TerminalOutput content={msg.text} />
                  ) : (
                    msg.text
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {status === 'THINKING' && (
            <div className="flex justify-start animate-pulse">
               <div className={`border p-3 rounded-lg rounded-tl-none flex items-center gap-2 ${hasApiKey ? 'bg-jarbas-primary/10 border-jarbas-primary/30' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
                 <RefreshCw className={`w-4 h-4 animate-spin ${hasApiKey ? 'text-jarbas-primary' : 'text-yellow-500'}`} />
                 <span className={`text-xs font-mono ${hasApiKey ? 'text-jarbas-primary' : 'text-yellow-500'}`}>
                    {hasApiKey ? 'PROCESSANDO LÓGICA...' : 'ACESSANDO MEMÓRIA LOCAL...'}
                 </span>
               </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="relative group shrink-0">
            <div className={`absolute -inset-0.5 bg-gradient-to-r rounded-lg blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200 ${hasApiKey ? 'from-jarbas-primary to-jarbas-secondary' : 'from-yellow-600 to-yellow-800'}`}></div>
            <div className="relative flex items-center bg-black border border-jarbas-secondary/40 rounded-lg p-2 shadow-2xl">
                <button className="p-2 text-jarbas-secondary hover:text-jarbas-primary transition-colors">
                    <Mic size={20} />
                </button>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={hasApiKey ? "Digite seu comando, Mestre..." : "Modo Local (Comandos básicos apenas)..."}
                    className="flex-1 bg-transparent border-none outline-none text-jarbas-primary placeholder-jarbas-secondary/40 font-mono px-4"
                    autoFocus
                    disabled={status === 'THINKING'}
                />
                <button 
                    onClick={handleSend}
                    disabled={!input.trim() || status === 'THINKING'}
                    className={`p-2 rounded-md transition-all duration-300 ${
                        input.trim() 
                        ? hasApiKey 
                            ? 'bg-jarbas-primary text-black hover:bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.6)]' 
                            : 'bg-yellow-600 text-black hover:bg-yellow-500'
                        : 'text-gray-600 cursor-not-allowed'
                    }`}
                >
                    <Send size={20} />
                </button>
            </div>
        </div>
      </main>
    </div>
  );
};

export default App;