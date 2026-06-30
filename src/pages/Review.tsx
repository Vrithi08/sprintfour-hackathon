import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTrustStore } from '../store/useTrustStore';
import { TrustSummary } from '../components/TrustSummary';
import { DocumentRenderer } from '../components/DocumentRenderer';
import { AuditLog } from '../components/AuditLog';
import { Inspector } from '../components/Inspector';
import { 
  ArrowLeft, 
  Info, 
  Sun, 
  Moon, 
  Split, 
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import type { DocumentAnalysis } from '../types';

export const Review: React.FC = () => {
  const { docId } = useParams<{ docId: string }>();
  const navigate = useNavigate();
  const { 
    currentDoc, 
    setCurrentDoc, 
    worriedMode, 
    setWorriedMode, 
    darkMode, 
    setDarkMode,
    resetDocOverrides,
    selectedSpanId,
    setSelectedSpanId
  } = useTrustStore();

  const [loading, setLoading] = useState(!currentDoc);
  const [error, setError] = useState<string | null>(null);

  // Load document on mount/reload if currentDoc is null but docId exists
  useEffect(() => {
    if (!currentDoc && docId) {
      const fetchDoc = async () => {
        try {
          const response = await fetch(`/api/samples/${docId}`);
          if (!response.ok) {
            throw new Error('Document not found');
          }
          const data: DocumentAnalysis = await response.json();
          setCurrentDoc(data);
        } catch (err: any) {
          setError(err.message || 'Failed to load document.');
        } finally {
          setLoading(false);
        }
      };
      fetchDoc();
    } else {
      setLoading(false);
    }
  }, [docId, currentDoc, setCurrentDoc]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-mono text-slate-400">Loading document audit logs...</p>
      </div>
    );
  }

  if (error || !currentDoc) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-500 animate-bounce" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Document Loading Failed</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
          We could not load the specified document. It may have been deleted or the backend is offline.
        </p>
        <Link to="/" className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-sm font-semibold transition-colors">
          Return to Hub
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Top Navbar */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        {/* Left: Back & Title */}
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate('/')}
            className="p-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            title="Back to Document Picker"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-base md:text-lg font-bold text-slate-800 dark:text-white m-0 p-0 text-left line-clamp-1">
              {currentDoc.title}
            </h1>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono text-left">
              Audit Session ID: {currentDoc.id}-{new Date(currentDoc.analyzedAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Right: Controls & Toggles */}
        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Explain like I'm worried toggle */}
          <button
            onClick={() => {
              setWorriedMode(!worriedMode);
              showToast(`"Explain like I'm worried" mode ${!worriedMode ? 'enabled' : 'disabled'}`);
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 border rounded-xl text-xs font-semibold shadow-sm transition-all duration-300 ${
              worriedMode 
                ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900 ring-1 ring-rose-400' 
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700'
            }`}
            title="Explain in a warmer, reassuring tone focusing on safety and threat risks."
          >
            <Info className={`w-3.5 h-3.5 ${worriedMode ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">Explain like I'm worried</span>
            <span className="sm:hidden">Worried Mode</span>
          </button>

          {/* Reset Overrides */}
          <button
            onClick={() => {
              resetDocOverrides();
              showToast('Audit overrides and history reset.');
            }}
            className="p-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl transition-colors"
            title="Reset All Flag Overrides and Chat History"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Compare Before/After Diff */}
          <button
            onClick={() => navigate(`/review/${docId}/diff`)}
            className="flex items-center space-x-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
            title="View Side-by-Side Diff & Export Document"
          >
            <Split className="w-3.5 h-3.5" />
            <span>Compare / Export</span>
          </button>

          {/* Dark Mode */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl transition-colors"
            title="Toggle Dark Mode"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Review Dashboard Workspace */}
      <main className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-50/50 dark:bg-slate-950/20 max-w-7xl mx-auto w-full">
        {/* Trust Summary Stats and Slider */}
        <TrustSummary />

        {/* Workspace Body: Document on Left, AuditLog/Inspector on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Document Renderer Column */}
          <div className="lg:col-span-2 flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
                Interactive Document Viewer
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Click any highlighted span below to inspect detection logic
              </span>
            </div>
            <DocumentRenderer />
          </div>

          {/* Right Sidebar Column: conditional rendering of Audit Log or Inspector details */}
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
                {selectedSpanId ? 'PII Decision Inspector' : 'Audit Log Sidebar'}
              </span>
              {selectedSpanId && (
                <button
                  onClick={() => setSelectedSpanId(null)}
                  className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-semibold font-mono"
                >
                  &larr; Back to Audit Log
                </button>
              )}
            </div>

            {selectedSpanId ? (
              <Inspector />
            ) : (
              <AuditLog />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

// Helper utility to programmatically show toasts from general actions
const showToast = (message: string) => {
  useTrustStore.getState().showToast(message);
};
