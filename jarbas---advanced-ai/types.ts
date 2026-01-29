// Enum for message roles
export enum Role {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system'
}

// DB Entity: programming_knowledge
export interface ProgrammingKnowledge {
  id?: number;
  linguagem: string;
  topico: string;
  descricao_detalhada: string;
  exemplos_codigo: string;
  nivel_especialista: number; // 1-100
}

// DB Entity: creator
export interface Creator {
  id?: number;
  nome: string;
  titulo: string; // "Mestre"
  estilo_de_fala: string;
}

// DB Entity: conversation_history
export interface ConversationHistory {
  id?: number;
  mensagem_usuario: string;
  resposta_jarbas: string;
  contexto: string;
  data: number; // Timestamp
}

// DB Entity: learning_state
export interface LearningState {
  id?: number;
  nivel_inteligencia: number;
  areas_dominadas: string[]; // JSON stringified array
  ultima_atualizacao: number;
}

export interface ChatMessage {
  id: string;
  role: Role;
  text: string;
  timestamp: number;
}

export type JarbasStatus = 'IDLE' | 'THINKING' | 'INITIALIZING' | 'SPEAKING' | 'ERROR';