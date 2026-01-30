import { ProgrammingKnowledge, Creator, ConversationHistory, LearningState } from '../types';

const DB_NAME = 'JARBAS_CEREBELLUM_V1';
const DB_VERSION = 2; // Incrementado para adicionar nova tabela

// Interface para Memória Local
export interface LocalMemoryEntry {
    id?: number;
    trigger: string;
    response: string;
    timestamp: number;
}

// Helper to open DB
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Tabela: programming_knowledge
      if (!db.objectStoreNames.contains('programming_knowledge')) {
        const store = db.createObjectStore('programming_knowledge', { keyPath: 'id', autoIncrement: true });
        store.createIndex('linguagem', 'linguagem', { unique: false });
      }

      // Tabela: creator
      if (!db.objectStoreNames.contains('creator')) {
        db.createObjectStore('creator', { keyPath: 'id', autoIncrement: true });
      }

      // Tabela: conversation_history
      if (!db.objectStoreNames.contains('conversation_history')) {
        const store = db.createObjectStore('conversation_history', { keyPath: 'id', autoIncrement: true });
        store.createIndex('data', 'data', { unique: false });
      }

      // Tabela: learning_state
      if (!db.objectStoreNames.contains('learning_state')) {
        db.createObjectStore('learning_state', { keyPath: 'id', autoIncrement: true });
      }

      // NOVO: Tabela local_memory (Aprendizado Offline)
      if (!db.objectStoreNames.contains('local_memory')) {
          const store = db.createObjectStore('local_memory', { keyPath: 'id', autoIncrement: true });
          store.createIndex('trigger', 'trigger', { unique: false });
      }
    };
  });
};

export const JarbasDB = {
  async init(): Promise<void> {
    const db = await openDB();
    
    // Seed Creator if empty
    const tx = db.transaction(['creator', 'learning_state'], 'readwrite');
    const creatorStore = tx.objectStore('creator');
    const learningStore = tx.objectStore('learning_state');

    const creatorCountReq = creatorStore.count();
    
    creatorCountReq.onsuccess = () => {
      if (creatorCountReq.result === 0) {
        creatorStore.add({
          nome: 'User', // Default
          titulo: 'Mestre',
          estilo_de_fala: 'Formal, direto'
        });
      }
    };

    const learningCountReq = learningStore.count();
    learningCountReq.onsuccess = () => {
        if (learningCountReq.result === 0) {
            learningStore.add({
                nivel_inteligencia: 1,
                areas_dominadas: ['Logic Core', 'Basic Math'],
                ultima_atualizacao: Date.now()
            });
        }
    }
  },

  async getCreator(): Promise<Creator | undefined> {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('creator', 'readonly');
      const store = tx.objectStore('creator');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result[0]);
    });
  },

  async saveConversation(entry: ConversationHistory): Promise<void> {
    const db = await openDB();
    const tx = db.transaction('conversation_history', 'readwrite');
    tx.objectStore('conversation_history').add(entry);
  },

  async getRecentHistory(limit: number = 5): Promise<ConversationHistory[]> {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('conversation_history', 'readonly');
      const store = tx.objectStore('conversation_history');
      const index = store.index('data');
      const req = index.openCursor(null, 'prev');
      const results: ConversationHistory[] = [];
      
      req.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor && results.length < limit) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results.reverse());
        }
      };
    });
  },

  async clearHistory(): Promise<void> {
    const db = await openDB();
    const tx = db.transaction('conversation_history', 'readwrite');
    tx.objectStore('conversation_history').clear();
  },

  async updateLearningState(level: number, areas: string[]): Promise<void> {
      const db = await openDB();
      const tx = db.transaction('learning_state', 'readwrite');
      const store = tx.objectStore('learning_state');
      // Assume only 1 state record exists
      const req = store.getAll();
      req.onsuccess = () => {
          const item = req.result[0];
          if (item) {
              item.nivel_inteligencia = level;
              item.areas_dominadas = areas;
              item.ultima_atualizacao = Date.now();
              store.put(item);
          }
      };
  },

  async getLearningState(): Promise<LearningState | undefined> {
      const db = await openDB();
      return new Promise((resolve) => {
          const tx = db.transaction('learning_state', 'readonly');
          const store = tx.objectStore('learning_state');
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result[0]);
      });
  },

  // --- MÉTODOS DE APRENDIZADO LOCAL ---

  async teachLocalConcept(trigger: string, response: string): Promise<void> {
      const db = await openDB();
      const tx = db.transaction('local_memory', 'readwrite');
      const store = tx.objectStore('local_memory');
      store.add({
          trigger: trigger.toLowerCase().trim(),
          response: response,
          timestamp: Date.now()
      });
  },

  async findLocalConcept(query: string): Promise<string | null> {
      const db = await openDB();
      return new Promise((resolve) => {
          const tx = db.transaction('local_memory', 'readonly');
          const store = tx.objectStore('local_memory');
          const req = store.getAll();
          
          req.onsuccess = () => {
              const entries: LocalMemoryEntry[] = req.result;
              // Busca simples por inclusão
              const found = entries.find(e => query.toLowerCase().includes(e.trigger));
              resolve(found ? found.response : null);
          };
      });
  }
};