import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, Power, Settings, RefreshCw, Trash2, WifiOff, Wifi } from 'lucide-react';
import { JarbasDB } from './services/db';
import { generateJarbasResponse } from './services/jarbasBrain';
import { ChatMessage, Role, JarbasStatus } from './types';
import { TerminalOutput } from './components/TerminalOutput';
import { StatsPanel } from './components/StatsPanel';
import { SettingsModal } from './components/SettingsModal';

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<JarbasStatus>('INITIALIZING');
  const [isBooting, setIsBooting] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Check key function
  const checkKey = () => {
     const key = localStorage.getItem('JARBAS_API_KEY') || process.env.API_KEY;
     setHasApiKey(!!key);
     return !!key;
  };

  // Initialization Sequence
  useEffect(() => {
    const bootSequence = async () => {
      await JarbasDB.init();
      const keyExists = checkKey();
      
      setTimeout(() => {
        setIsBooting(false);
        setStatus('IDLE');
        
        const initialText = keyExists 
            ? 'Sistemas online. Conexão Neural estabelecida. Aguardando ordens, Mestre.' 
            : 'Sistemas online. **AVISO:** Chave Neural não detectada. Ativando **Núcleo Local de Backup** (Capacidade Limitada).';

        addMessage({
          id: 'init',
          role: Role.MODEL,
          text: initialText,
          timestamp: Date.now()
        });

      }, 2500); // Fake boot delay
    };
    bootSequence();
  }, []);

  // Monitor Settings Close to refresh key status
  useEffect(() => {
      if (!isSettingsOpen) {
          checkKey();
      }
  }, [isSettingsOpen]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const addMessage = (msg: ChatMessage) => {
    setMessages(prev => [...prev, msg]);
  };

  const handleClearHistory = async () => {
    if (window.confirm('Mestre, deseja realmente formatar a memória episódica? Isso apagará todo o histórico de conversas.')) {
      await JarbasDB.clearHistory();
      setMessages([]);
      addMessage({
        id: Date.now().toString(),
        role: Role.SYSTEM,
        text: '>> MEMÓRIA FORMATADA. BANCOS DE DADOS REINICIADOS.',
        timestamp: Date.now()
      });
      addMessage({
        id: (Date.now() + 1).toString(),
        role: Role.MODEL,
        text: 'Pronto para novos dados, Mestre.',
        timestamp: Date.now()
      });
    }
  };

  const handleSend = async () => {
    if (!input.trim() || status === 'THINKING') return;

    const userText = input;
    setInput('');
    setStatus('THINKING');

    // Add User Message
    addMessage({
      id: Date.now().toString(),
      role: Role.USER,
      text: userText,
      timestamp: Date.now()
    });

    try {
      // Get AI Response (Jarbas Brain handles Online vs Offline automatically)
      const responseText = await generateJarbasResponse(userText);
      
      // Add Jarbas Message
      addMessage({
        id: (Date.now() + 1).toString(),
        role: Role.MODEL,
        text: responseText,
        timestamp: Date.now()
      });
      
      setStatus('IDLE');
    } catch (e: any) {
      setStatus('ERROR');
      addMessage({
        id: Date.now().toString(),
        role: Role.SYSTEM,
        text: `Falha Crítica: ${e.message || 'Erro desconhecido'}.`,
        timestamp: Date.now()
      });
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
      <div className="flex flex-col items-center justify-center h-screen bg-jarbas-dark text-jarbas-primary font-orbitron relative overflow-hidden">
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
    <div className="flex flex-col h-screen bg-jarbas-dark text-slate-200 font-sans overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#050a10] to-black">
      
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Header HUD */}
      <header className="flex items-center justify-between p-4 border-b border-jarbas-secondary/20 bg-black/40 backdrop-blur-sm">
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
          <div className="flex items-center justify-center" title={hasApiKey ? "Conexão Neural Ativa" : "Operando Offline"}>
             {hasApiKey ? <Wifi size={16} className="text-jarbas-accent" /> : <WifiOff size={16} className="text-yellow-500" />}
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
      <main className="flex-1 flex flex-col max-w-5xl mx-auto w-full p-4 md:p-6 overflow-hidden">
        
        {/* Dashboard Stats */}
        <StatsPanel />

        {/* Chat Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto mb-4 space-y-6 pr-2 scroll-smooth"
        >
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex ${msg.role === Role.USER ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[85%] md:max-w-[75%] p-4 rounded-lg border backdrop-blur-md ${
                  msg.role === Role.USER 
                    ? 'bg-jarbas-secondary/10 border-jarbas-secondary/30 text-right rounded-tr-none' 
                    : msg.role === Role.SYSTEM
                      ? 'bg-red-900/20 border-red-500/50 text-red-400'
                      : hasApiKey 
                        ? 'bg-slate-900/80 border-jarbas-primary/30 rounded-tl-none shadow-[0_0_15px_rgba(0,0,0,0.5)]'
                        : 'bg-yellow-900/10 border-yellow-500/30 rounded-tl-none' // Estilo diferente para modo local
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
        <div className="relative group">
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