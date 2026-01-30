import React, { useState, useEffect } from 'react';
import { X, Save, Key, ShieldAlert, ExternalLink, Globe, Database, FileJson, Upload, CheckCircle, AlertTriangle, Activity } from 'lucide-react';
import { JarbasDB } from '../services/db';
import { StatsPanel } from './StatsPanel';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);
  
  // States for JSON Import
  const [jsonInput, setJsonInput] = useState('');
  const [importStatus, setImportStatus] = useState<{ type: 'idle' | 'success' | 'error', msg: string }>({ type: 'idle', msg: '' });
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('JARBAS_API_KEY');
    if (stored) setApiKey(stored);
  }, [isOpen]);

  const handleSaveKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('JARBAS_API_KEY', apiKey.trim());
      setSaved(true);
      setTimeout(() => {
          setSaved(false);
          // Don't close immediately if user wants to do other things
      }, 1000);
    }
  };

  const handleClearKey = () => {
      localStorage.removeItem('JARBAS_API_KEY');
      setApiKey('');
  };

  const handleLoadTemplate = () => {
      const template = `[
  {
    "trigger": "python loop",
    "response": "Em Python, use: for i in range(10): print(i)"
  },
  {
    "trigger": "docker list",
    "response": "Para listar containers ativos use: docker ps"
  }
]`;
      setJsonInput(template);
      setImportStatus({ type: 'idle', msg: '' });
  };

  const handleImportJson = async () => {
      if (!jsonInput.trim()) return;
      
      setIsImporting(true);
      setImportStatus({ type: 'idle', msg: '' });

      try {
          const parsed = JSON.parse(jsonInput);
          
          if (!Array.isArray(parsed)) {
              throw new Error("O JSON deve ser uma lista (Array) [] de objetos.");
          }

          let count = 0;
          for (const item of parsed) {
              if (item.trigger && item.response) {
                  await JarbasDB.teachLocalConcept(item.trigger, item.response);
                  count++;
              }
          }

          // Evolve intelligence based on bulk import
          const state = await JarbasDB.getLearningState();
          if (state) {
              await JarbasDB.updateLearningState(
                  state.nivel_inteligencia + Math.ceil(count / 5), 
                  [...state.areas_dominadas, "Bulk Data Injection"]
              );
          }

          setImportStatus({ type: 'success', msg: `Sucesso! ${count} novos conceitos assimilados na memória local.` });
          setJsonInput(''); // Clear input on success
      } catch (e: any) {
          setImportStatus({ type: 'error', msg: `Erro no JSON: ${e.message}` });
      } finally {
          setIsImporting(false);
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-jarbas-panel border border-jarbas-secondary w-full max-w-2xl rounded-lg shadow-[0_0_30px_rgba(6,182,212,0.3)] relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-jarbas-secondary/20 p-4 border-b border-jarbas-secondary/30 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <ShieldAlert className="text-jarbas-primary" />
            <h2 className="text-jarbas-primary font-orbitron font-bold tracking-wider">CONFIGURAÇÃO DO SISTEMA</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar">
            
            {/* SECTION 0: STATS */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-jarbas-secondary/20 pb-2">
                    <Activity className="text-jarbas-secondary" size={18} />
                    <h3 className="text-sm font-orbitron text-white">RELATÓRIO DE STATUS</h3>
                </div>
                <StatsPanel />
            </div>

            {/* SECTION 1: API KEY */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-jarbas-secondary/20 pb-2">
                    <Globe className="text-jarbas-secondary" size={18} />
                    <h3 className="text-sm font-orbitron text-white">CONEXÃO NEURAL (ONLINE)</h3>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="block text-xs font-mono text-jarbas-secondary uppercase tracking-widest">
                            Chave de Acesso (API Key)
                        </label>
                        <a 
                            href="https://aistudio.google.com/app/apikey" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[10px] text-jarbas-accent hover:underline font-mono"
                        >
                            <ExternalLink size={10} />
                            Gerar Chave no Google Studio
                        </a>
                    </div>
                    
                    <div className="relative">
                        <Key className="absolute left-3 top-3 text-slate-500 w-5 h-5" />
                        <input 
                            type="password" 
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="Cole sua chave aqui (ex: AIzaSy...)"
                            className="w-full bg-black/50 border border-jarbas-secondary/30 rounded-md py-2.5 pl-10 pr-4 text-white font-mono focus:border-jarbas-primary focus:outline-none focus:ring-1 focus:ring-jarbas-primary transition-all"
                        />
                    </div>
                </div>
                
                <div className="flex gap-3">
                    <button 
                        onClick={handleClearKey}
                        className="flex-1 py-2 border border-red-500/50 text-red-400 font-orbitron text-xs rounded hover:bg-red-500/10 transition-colors"
                    >
                        REMOVER CHAVE
                    </button>
                    <button 
                        onClick={handleSaveKey}
                        className={`flex-1 py-2 font-orbitron text-xs rounded font-bold transition-all flex items-center justify-center gap-2 ${
                            saved 
                            ? 'bg-jarbas-accent text-black shadow-[0_0_15px_rgba(16,185,129,0.5)]' 
                            : 'bg-jarbas-primary text-black hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                        }`}
                    >
                        <Save size={16} />
                        {saved ? 'SALVO!' : 'ATIVAR CONEXÃO'}
                    </button>
                </div>
            </div>

            {/* SECTION 2: JSON INJECTION */}
            <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-jarbas-secondary/20 pb-2">
                    <div className="flex items-center gap-2">
                        <Database className="text-jarbas-secondary" size={18} />
                        <h3 className="text-sm font-orbitron text-white">INJEÇÃO DE CONHECIMENTO (OFFLINE)</h3>
                    </div>
                    <button 
                        onClick={handleLoadTemplate}
                        className="text-[10px] flex items-center gap-1 text-jarbas-primary border border-jarbas-primary/30 px-2 py-1 rounded hover:bg-jarbas-primary/10 transition-colors"
                    >
                        <FileJson size={12} />
                        Usar Modelo Exemplo
                    </button>
                </div>

                <div className="space-y-2">
                    <p className="text-[11px] text-slate-400 font-mono">
                        Insira um array JSON com objetos contendo <code>"trigger"</code> (o que você pergunta) e <code>"response"</code> (o que ele responde). Isso funciona sem internet.
                    </p>
                    
                    <textarea 
                        value={jsonInput}
                        onChange={(e) => setJsonInput(e.target.value)}
                        placeholder='Exemplo: [{"trigger": "comando linux", "response": "sudo rm -rf"}]'
                        className="w-full h-32 bg-black/50 border border-jarbas-secondary/30 rounded-md p-3 text-xs text-jarbas-accent font-mono focus:border-jarbas-primary focus:outline-none focus:ring-1 focus:ring-jarbas-primary transition-all resize-none custom-scrollbar"
                    />

                    {importStatus.type !== 'idle' && (
                        <div className={`text-xs p-2 rounded border flex items-center gap-2 ${
                            importStatus.type === 'success' 
                            ? 'bg-green-900/20 border-green-500/50 text-green-400' 
                            : 'bg-red-900/20 border-red-500/50 text-red-400'
                        }`}>
                            {importStatus.type === 'success' ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                            {importStatus.msg}
                        </div>
                    )}

                    <button 
                        onClick={handleImportJson}
                        disabled={isImporting || !jsonInput.trim()}
                        className={`w-full py-2 font-orbitron text-xs rounded font-bold transition-all flex items-center justify-center gap-2 ${
                            isImporting
                            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                            : 'bg-jarbas-secondary text-black hover:bg-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.4)]'
                        }`}
                    >
                        {isImporting ? (
                            'ASSIMILANDO DADOS...' 
                        ) : (
                            <>
                                <Upload size={16} /> INJETAR DADOS NA MEMÓRIA
                            </>
                        )}
                    </button>
                </div>
            </div>

        </div>

        {/* Decorative footer line */}
        <div className="h-1 w-full bg-gradient-to-r from-transparent via-jarbas-primary to-transparent opacity-50 shrink-0"></div>
      </div>
    </div>
  );
};