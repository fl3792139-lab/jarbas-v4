import React, { useState, useEffect } from 'react';
import { X, Save, Key, ShieldAlert } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('JARBAS_API_KEY');
    if (stored) setApiKey(stored);
  }, [isOpen]);

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem('JARBAS_API_KEY', apiKey.trim());
      setSaved(true);
      setTimeout(() => {
          setSaved(false);
          onClose();
      }, 1000);
    }
  };

  const handleClear = () => {
      localStorage.removeItem('JARBAS_API_KEY');
      setApiKey('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-jarbas-panel border border-jarbas-secondary w-full max-w-md rounded-lg shadow-[0_0_30px_rgba(6,182,212,0.3)] relative overflow-hidden">
        
        {/* Header */}
        <div className="bg-jarbas-secondary/20 p-4 border-b border-jarbas-secondary/30 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShieldAlert className="text-jarbas-primary" />
            <h2 className="text-jarbas-primary font-orbitron font-bold tracking-wider">CONFIGURAÇÃO NEURAL</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
            <div className="space-y-2">
                <label className="block text-xs font-mono text-jarbas-secondary uppercase tracking-widest">
                    Google Gemini API Key
                </label>
                <div className="relative">
                    <Key className="absolute left-3 top-3 text-slate-500 w-5 h-5" />
                    <input 
                        type="password" 
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Cole sua chave aqui..."
                        className="w-full bg-black/50 border border-jarbas-secondary/30 rounded-md py-2.5 pl-10 pr-4 text-white font-mono focus:border-jarbas-primary focus:outline-none focus:ring-1 focus:ring-jarbas-primary transition-all"
                    />
                </div>
                <p className="text-[10px] text-slate-500 font-mono mt-1">
                    * A chave será salva criptografada localmente no dispositivo. Nenhuma transmissão externa ocorre exceto para a API do Google.
                </p>
            </div>
            
            <div className="flex gap-3">
                <button 
                    onClick={handleClear}
                    className="flex-1 py-2 border border-red-500/50 text-red-400 font-orbitron text-xs rounded hover:bg-red-500/10 transition-colors"
                >
                    REMOVER CHAVE
                </button>
                <button 
                    onClick={handleSave}
                    className={`flex-1 py-2 font-orbitron text-xs rounded font-bold transition-all flex items-center justify-center gap-2 ${
                        saved 
                        ? 'bg-jarbas-accent text-black shadow-[0_0_15px_rgba(16,185,129,0.5)]' 
                        : 'bg-jarbas-primary text-black hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                    }`}
                >
                    <Save size={16} />
                    {saved ? 'SALVO!' : 'CONFIRMAR ACESSO'}
                </button>
            </div>
        </div>

        {/* Decorative footer line */}
        <div className="h-1 w-full bg-gradient-to-r from-transparent via-jarbas-primary to-transparent opacity-50"></div>
      </div>
    </div>
  );
};