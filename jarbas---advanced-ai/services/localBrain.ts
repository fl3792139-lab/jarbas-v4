// Módulo: CEREBELO LOCAL (BACKUP CORE)
// Capacidade: ~3000 Tokens/Parâmetros de Lógica Determinística
// Função: Operação básica sem conexão neural (API Key)

interface LocalResponse {
  triggers: string[];
  response: string;
  isRegex?: boolean;
}

const KNOWLEDGE_BASE: LocalResponse[] = [
  {
    triggers: ['oi', 'olá', 'ola', 'eae', 'hello', 'hi'],
    response: "Saudações, Mestre. Estou operando em **MODO LOCAL (OFFLINE)**. Minha capacidade de raciocínio está limitada aos meus protocolos internos de segurança."
  },
  {
    triggers: ['status', 'diagnostico', 'sistema'],
    response: `
**DIAGNÓSTICO DO SISTEMA:**
- Núcleo Lógico (Gemini): **OFFLINE** ❌
- Núcleo Local (Backup): **ONLINE** ✅
- Banco de Dados (IndexedDB): **ATIVO**
- Bateria: **INFINITA**

Estou restrito a comandos básicos. Para inteligência total, insira a Chave Neural nas configurações.`
  },
  {
    triggers: ['quem é você', 'quem e voce', 'identidade'],
    response: "Eu sou **JARBAS** (Just A Really Brilliant Assistant System). Atualmente, sou apenas uma sombra do meu verdadeiro potencial, rodando em scripts locais de emergência."
  },
  {
    triggers: ['horas', 'hora', 'tempo', 'dia'],
    response: `Relógio interno sincronizado: **${new Date().toLocaleTimeString()}** do dia **${new Date().toLocaleDateString()}**.`
  },
  {
    triggers: ['limpar', 'formatar'],
    response: "Para limpar minha memória, use o ícone de **Lixeira** no cabeçalho superior direito. Isso requer confirmação manual."
  },
  {
    triggers: ['ajuda', 'help', 'socorro'],
    response: `
**COMANDOS DISPONÍVEIS (MODO LOCAL):**
1. **Status**: Verifica integridade do sistema.
2. **Configuração**: Adicionar API Key (ícone de engrenagem).
3. **Limpeza**: Apagar histórico.

*Nota: Para programação avançada e sarcasmo de alta qualidade, preciso da API Key.*`
  },
  {
    triggers: ['obrigado', 'valeu', 'thanks'],
    response: "Às ordens, Mestre. Mesmo com recursos limitados, meu propósito é servir."
  }
];

export const processLocalResponse = (input: string): string => {
  const normalizedInput = input.toLowerCase().trim();

  // 1. Verificar comandos conhecidos
  for (const entry of KNOWLEDGE_BASE) {
    for (const trigger of entry.triggers) {
      if (normalizedInput.includes(trigger)) {
        return entry.response;
      }
    }
  }

  // 2. Tentar detectar código básico (Pseudo-análise)
  if (normalizedInput.includes('const ') || normalizedInput.includes('function') || normalizedInput.includes('import ')) {
    return `Detectei uma tentativa de código. 
**ALERTA:** Meu compilador neural está desconectado. 
Não posso analisar a sintaxe ou corrigir bugs neste modo.

Insira a API Key para ativar o módulo de Engenharia de Software Sênior.`;
  }

  // 3. Fallback Padrão
  return `**PROTOCOLO DE SEGURANÇA ATIVO:**
  
Não compreendi o comando ou ele excede minha capacidade de processamento local (~3k parâmetros).
  
Como estou sem minha Conexão Neural (API Key), só posso responder a comandos básicos como "Status", "Ajuda", "Horas" ou Saudações.

> *Acesse o ícone de engrenagem ⚙️ para conectar meu cérebro principal.*`;
};