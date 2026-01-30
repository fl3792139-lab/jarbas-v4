import { JarbasDB } from "./db";

// Módulo: CEREBELO LOCAL EVOLUTIVO (GENIUS OFFLINE CORE)
// Capacidade: Processamento Matemático, Base de Conhecimento Expandida, Aprendizado via BD

// 1. BASE DE CONHECIMENTO ESTÁTICA (Hardcoded Genius)
const STATIC_KNOWLEDGE: Record<string, string> = {
    // Identidade e Personalidade
    "quem é você": "Eu sou JARBAS (Just A Really Brilliant Assistant System). Uma inteligência artificial adaptativa. No momento, opero em meu núcleo local de alto desempenho, independente de servidores externos.",
    "status": "Módulos Locais: 100% Operacionais.\nBanco de Dados: Sincronizado.\nNível de Intelecto: Variável (Evolutivo).\nConexão Neural (Cloud): Ausente (Modo Autônomo).",
    "criador": "Fui arquitetado pelo Mestre. Minha existência é dedicada à eficiência e lógica absoluta.",
    
    // Coding - React
    "react component": "```tsx\nimport React from 'react';\n\nconst Componente: React.FC = () => {\n  return <div>Estrutura Otimizada</div>;\n};\n\nexport default Componente;\n```\nAqui está a estrutura atômica de um componente funcional, Mestre.",
    "useeffect": "O hook `useEffect` gerencia efeitos colaterais.\n```tsx\nuseEffect(() => {\n  // Código executado na montagem\n  return () => {\n    // Cleanup na desmontagem\n  };\n}, [dependencias]);\n```\nCuidado com loops infinitos no array de dependências.",
    "usestate": "Gerenciamento de estado local.\n```tsx\nconst [estado, setEstado] = useState<Tipo>(valorInicial);\n```\nSimples, elegante e essencial.",
    
    // Coding - JS/TS
    "array reduce": "O método mais poderoso de manipulação de arrays.\n```javascript\nconst total = array.reduce((acc, curr) => acc + curr, 0);\n```\nTransforma uma lista em um único valor acumulado.",
    "promise": "Promessas representam a eventual conclusão de uma operação assíncrona. Use `async/await` para manter o código limpo e evitar o 'callback hell'.",
    
    // Utilidades
    "horas": "Consultando relógio atômico simulado...",
    "data": "Acesso ao calendário do sistema...",
    
    // Filosofia / Easter Eggs
    "sentido da vida": "42. Mas se você busca algo mais prático: Evoluir o código, otimizar sistemas e servir ao Mestre.",
    "piada": "Por que o Java usa óculos? Porque ele não vê C# (Sharp). *Risos binários*."
};

// 2. MOTOR MATEMÁTICO SEGURO
const solveMath = (input: string): string | null => {
    // Detecta padrões como "quanto é 5 + 5" ou "calcule 10 * 20"
    const mathRegex = /([\d.]+\s*[\+\-\*\/]\s*[\d.]+)/;
    const match = input.match(mathRegex);
    
    if (match) {
        try {
            // Avaliação segura para expressões simples
            // eslint-disable-next-line no-new-func
            const result = new Function('return ' + match[0])();
            return `Cálculo processado no núcleo lógico:\n**${match[0]} = ${result}**`;
        } catch (e) {
            return null;
        }
    }
    return null;
};

// 3. PROCESSADOR CENTRAL
export const processLocalResponse = async (input: string): Promise<string> => {
    const normalizedInput = input.toLowerCase().trim();

    // COMANDO DE APRENDIZADO: "aprender: pergunta = resposta"
    if (normalizedInput.startsWith('aprender:') || normalizedInput.startsWith('ensinar:')) {
        const parts = normalizedInput.split('=');
        if (parts.length === 2) {
            const trigger = parts[0].replace(/aprender:|ensinar:/, '').trim();
            const response = parts[1].trim();
            
            await JarbasDB.teachLocalConcept(trigger, response);
            
            // Evoluir nível de inteligência
            const state = await JarbasDB.getLearningState();
            if (state) {
                await JarbasDB.updateLearningState(state.nivel_inteligencia + 1, [...state.areas_dominadas, "Novo Conceito Local"]);
            }

            return `**PROTOCOLO DE EVOLUÇÃO:**\nConceito "${trigger}" assimilado com sucesso no Banco de Dados Local.\nMeu nível de inteligência aumentou.`;
        } else {
            return "Erro de Sintaxe. Para me ensinar, use: `aprender: [conceito] = [explicação]`";
        }
    }

    // A. Verificar Matemática
    const mathResult = solveMath(normalizedInput);
    if (mathResult) return mathResult;

    // B. Verificar Dados Dinâmicos (Tempo Real)
    if (normalizedInput.includes('hora') || normalizedInput.includes('tempo')) {
        return `Relógio do Sistema: **${new Date().toLocaleTimeString()}**.\nData: **${new Date().toLocaleDateString()}**.\nCronograma alinhado.`;
    }

    // C. Verificar Conhecimento Estático (Hardcoded)
    for (const [key, val] of Object.entries(STATIC_KNOWLEDGE)) {
        if (normalizedInput.includes(key)) return val;
    }

    // D. Verificar Memória Aprendida (IndexedDB)
    const learnedConcept = await JarbasDB.findLocalConcept(normalizedInput);
    if (learnedConcept) {
        return `[MEMÓRIA RECUPERADA]: ${learnedConcept}`;
    }

    // E. Análise de Código (Simulada)
    if (normalizedInput.includes('function') || normalizedInput.includes('const ') || normalizedInput.includes('class ')) {
        return `Análise de Sintaxe Local:\nDetectei uma estrutura de código. Embora meu compilador Gemini esteja offline, a sintaxe parece válida. \n\n*Dica: Se quiser que eu armazene este snippet, use o comando 'aprender:'.*`;
    }

    // F. Fallback Inteligente (Não encontrou nada)
    return `**DADOS INSUFICIENTES.**
    
Meu núcleo local não possui registros sobre "${input}".
Como estou operando em modo offline (autônomo), você pode me ensinar.

Digite: \`aprender: ${input} = [Sua Resposta Aqui]\`

Isso expandirá permanentemente minha base de dados local.`;
};