import { create } from 'zustand';
import type { DocumentAnalysis } from '../types';

export interface QAMessage {
  question: string;
  answer: string;
  timestamp: string;
  isFallback?: boolean;
}

interface TrustState {
  currentDoc: DocumentAnalysis | null;
  threshold: number;
  worriedMode: boolean;
  darkMode: boolean;
  selectedSpanId: string | null;
  flaggedWrongSpans: Record<string, boolean>; // spanId -> true (if user manually toggled redact status)
  userRevealedSpans: Record<string, boolean>; // spanId -> true (if user explicitly revealed)
  askWhyHistory: Record<string, QAMessage[]>; // spanId -> Q&A messages
  toastMessage: string | null;
  
  setCurrentDoc: (doc: DocumentAnalysis | null) => void;
  setThreshold: (val: number) => void;
  setWorriedMode: (val: boolean) => void;
  setDarkMode: (val: boolean) => void;
  setSelectedSpanId: (id: string | null) => void;
  toggleFlaggedWrong: (spanId: string) => void;
  toggleRevealed: (spanId: string) => void;
  addAskWhyQA: (spanId: string, question: string, answer: string, isFallback?: boolean) => void;
  resetDocOverrides: () => void;
  showToast: (msg: string) => void;
  clearToast: () => void;
}

export const useTrustStore = create<TrustState>((set) => {
  // Load preferences from localStorage if available
  const initialWorriedMode = localStorage.getItem('worriedMode') === 'true';
  const initialDarkMode = localStorage.getItem('darkMode') === 'true';
  
  // Set dark mode class on body initially
  if (initialDarkMode) {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }

  let toastTimeout: any = null;

  return {
    currentDoc: null,
    threshold: 0.5, // Default 50% threshold
    worriedMode: initialWorriedMode,
    darkMode: initialDarkMode,
    selectedSpanId: null,
    flaggedWrongSpans: {},
    userRevealedSpans: {},
    askWhyHistory: {},
    toastMessage: null,

    setCurrentDoc: (doc) => set({ 
      currentDoc: doc, 
      selectedSpanId: null, 
      flaggedWrongSpans: {}, 
      userRevealedSpans: {}, 
      askWhyHistory: {},
      toastMessage: null
    }),

    setThreshold: (val) => set({ threshold: val }),

    setWorriedMode: (val) => {
      localStorage.setItem('worriedMode', String(val));
      set({ worriedMode: val });
    },

    setDarkMode: (val) => {
      localStorage.setItem('darkMode', String(val));
      if (val) {
        document.body.classList.add('dark');
      } else {
        document.body.classList.remove('dark');
      }
      set({ darkMode: val });
    },

    setSelectedSpanId: (id) => set({ selectedSpanId: id }),

    toggleFlaggedWrong: (spanId) => set((state) => ({
      flaggedWrongSpans: {
        ...state.flaggedWrongSpans,
        [spanId]: !state.flaggedWrongSpans[spanId]
      }
    })),

    toggleRevealed: (spanId) => set((state) => ({
      userRevealedSpans: {
        ...state.userRevealedSpans,
        [spanId]: !state.userRevealedSpans[spanId]
      }
    })),

    addAskWhyQA: (spanId, question, answer, isFallback = false) => set((state) => {
      const currentHistory = state.askWhyHistory[spanId] || [];
      const newQA: QAMessage = {
        question,
        answer,
        timestamp: new Date().toLocaleTimeString(),
        isFallback
      };
      return {
        askWhyHistory: {
          ...state.askWhyHistory,
          [spanId]: [...currentHistory, newQA]
        }
      };
    }),

    resetDocOverrides: () => set({
      flaggedWrongSpans: {},
      userRevealedSpans: {},
      askWhyHistory: {}
    }),

    showToast: (msg) => {
      set({ toastMessage: msg });
      if (toastTimeout) clearTimeout(toastTimeout);
      toastTimeout = setTimeout(() => {
        set({ toastMessage: null });
      }, 3000);
    },

    clearToast: () => {
      if (toastTimeout) clearTimeout(toastTimeout);
      set({ toastMessage: null });
    }
  };
});
