import React, { useEffect, useState } from 'react';
import { JarbasDB } from '../services/db';
import { LearningState, Creator } from '../types';
import { Cpu, HardDrive, Zap, ShieldCheck } from 'lucide-react';

export const StatsPanel: React.FC = () => {
    const [state, setState] = useState<LearningState | undefined>();
    const [creator, setCreator] = useState<Creator | undefined>();
    const [dbSize, setDbSize] = useState<number>(0);

    useEffect(() => {
        const loadStats = async () => {
            const s = await JarbasDB.getLearningState();
            const c = await JarbasDB.getCreator();
            const h = await JarbasDB.getRecentHistory(100);
            setState(s);
            setCreator(c);
            setDbSize(h.length);
        };
        
        loadStats();
        const interval = setInterval(loadStats, 5000); // Update every 5s
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="grid grid-cols-2 gap-3">
            <div className="bg-black/40 border border-jarbas-secondary/30 p-3 rounded-sm flex items-center space-x-3 shadow-sm">
                <Cpu className="text-jarbas-primary w-5 h-5 animate-pulse-fast" />
                <div className="overflow-hidden">
                    <div className="text-[10px] text-slate-400 font-orbitron truncate">NÍVEL INTELECTO</div>
                    <div className="text-lg font-bold text-jarbas-primary font-mono">{state?.nivel_inteligencia || 1}</div>
                </div>
            </div>

            <div className="bg-black/40 border border-jarbas-secondary/30 p-3 rounded-sm flex items-center space-x-3 shadow-sm">
                <HardDrive className="text-jarbas-accent w-5 h-5" />
                <div className="overflow-hidden">
                    <div className="text-[10px] text-slate-400 font-orbitron truncate">MEMÓRIA (NÓS)</div>
                    <div className="text-lg font-bold text-jarbas-accent font-mono">{dbSize}</div>
                </div>
            </div>

            <div className="bg-black/40 border border-jarbas-secondary/30 p-3 rounded-sm flex items-center space-x-3 shadow-sm">
                <ShieldCheck className="text-jarbas-secondary w-5 h-5" />
                <div className="overflow-hidden">
                    <div className="text-[10px] text-slate-400 font-orbitron truncate">PROTOCOLO</div>
                    <div className="text-sm font-bold text-jarbas-secondary font-mono truncate">{creator?.titulo || 'USER'}</div>
                </div>
            </div>

            <div className="bg-black/40 border border-jarbas-secondary/30 p-3 rounded-sm flex items-center space-x-3 shadow-sm">
                <Zap className="text-yellow-400 w-5 h-5" />
                <div className="overflow-hidden">
                    <div className="text-[10px] text-slate-400 font-orbitron truncate">STATUS SISTEMA</div>
                    <div className="text-xs font-bold text-yellow-400 font-mono">ONLINE</div>
                </div>
            </div>
        </div>
    );
};