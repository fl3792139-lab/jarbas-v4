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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-jarbas-panel border border-jarbas-secondary/30 p-3 rounded-sm flex items-center space-x-3 shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                <Cpu className="text-jarbas-primary w-6 h-6 animate-pulse-fast" />
                <div>
                    <div className="text-xs text-slate-400 font-orbitron">INTELLECT LEVEL</div>
                    <div className="text-xl font-bold text-jarbas-primary font-mono">{state?.nivel_inteligencia || 1}</div>
                </div>
            </div>

            <div className="bg-jarbas-panel border border-jarbas-secondary/30 p-3 rounded-sm flex items-center space-x-3">
                <HardDrive className="text-jarbas-accent w-6 h-6" />
                <div>
                    <div className="text-xs text-slate-400 font-orbitron">MEMORY NODES</div>
                    <div className="text-xl font-bold text-jarbas-accent font-mono">{dbSize}</div>
                </div>
            </div>

            <div className="bg-jarbas-panel border border-jarbas-secondary/30 p-3 rounded-sm flex items-center space-x-3">
                <ShieldCheck className="text-jarbas-secondary w-6 h-6" />
                <div>
                    <div className="text-xs text-slate-400 font-orbitron">PROTOCOL</div>
                    <div className="text-lg font-bold text-jarbas-secondary font-mono truncate">{creator?.titulo || 'USER'}</div>
                </div>
            </div>

            <div className="bg-jarbas-panel border border-jarbas-secondary/30 p-3 rounded-sm flex items-center space-x-3">
                <Zap className="text-yellow-400 w-6 h-6" />
                <div>
                    <div className="text-xs text-slate-400 font-orbitron">SYSTEM STATUS</div>
                    <div className="text-sm font-bold text-yellow-400 font-mono">ONLINE</div>
                </div>
            </div>
        </div>
    );
};