import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './pages/Home';
import { Review } from './pages/Review';
import { DiffView } from './pages/DiffView';
import { useTrustStore } from './store/useTrustStore';
import { Shield, Sparkles } from 'lucide-react';

function App() {
  const { toastMessage, clearToast, darkMode } = useTrustStore();

  return (
    <BrowserRouter>
      <div className={`min-h-screen flex flex-col transition-colors duration-300 ${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
        
        {/* Global Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 animate-bounce">
            <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 border border-slate-800 dark:border-slate-200 px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-2 text-xs font-semibold">
              <Shield className="w-4 h-4 text-teal-500" />
              <span>{toastMessage}</span>
              <button 
                onClick={clearToast}
                className="text-slate-400 hover:text-slate-200 dark:text-slate-500 dark:hover:text-slate-700 ml-2"
              >
                &times;
              </button>
            </div>
          </div>
        )}

        {/* Global Header Bar */}
        <nav className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/80 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-gradient-to-tr from-teal-500 to-indigo-600 rounded-xl">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold tracking-tight text-slate-900 dark:text-white font-sans text-sm md:text-base">
              CONSEAL
              <span className="text-teal-600 dark:text-teal-400 font-medium"> TRUST VIEWER</span>
            </span>
          </div>


        </nav>

        {/* Main Content Pages */}
        <div className="flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/review/:docId" element={<Review />} />
            <Route path="/review/:docId/diff" element={<DiffView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>

        {/* Global Footer */}
        <footer className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/60 py-4 text-center text-[10px] text-slate-400 dark:text-slate-500 font-mono">
          <p>© 2026 Conseal Inc. All client documents are sanitized and audited inside secure local sandbox buffers.</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
