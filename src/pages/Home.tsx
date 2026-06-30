import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrustStore } from '../store/useTrustStore';
import { ShieldAlert, Sparkles, FileText, ArrowRight } from 'lucide-react';
import type { DocumentAnalysis } from '../types';

interface SampleMetadata {
  id: string;
  title: string;
  spanCount: number;
  safetyScore: number;
  snippet: string;
}

export const Home: React.FC = () => {
  const [samples, setSamples] = useState<SampleMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { setCurrentDoc } = useTrustStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSamples = async () => {
      try {
        const response = await fetch('/api/samples');
        if (!response.ok) {
          throw new Error('Failed to fetch sample documents');
        }
        const data = await response.json();
        setSamples(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch samples.');
      } finally {
        setLoading(false);
      }
    };

    fetchSamples();
  }, []);

  const handleSelectDoc = async (id: string) => {
    try {
      const response = await fetch(`/api/samples/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch full document details');
      }
      const data: DocumentAnalysis = await response.json();
      setCurrentDoc(data);
      navigate(`/review/${id}`);
    } catch (err) {
      console.error(err);
      alert('Error loading document detail.');
    }
  };

  const getSafetyBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900';
    if (score >= 50) return 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-900';
    return 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border-red-200 dark:border-red-900';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 flex-1 flex flex-col justify-center">
      {/* Hero Header */}
      <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-teal-50 dark:bg-teal-950/30 border border-teal-200/50 dark:border-teal-900 rounded-full">
          <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span className="text-xs font-bold text-teal-800 dark:text-teal-300 font-mono uppercase tracking-wider">
            PII Redaction Explainability Dashboard
          </span>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans leading-tight">
          See every redaction.<br />
          <span className="bg-gradient-to-r from-teal-600 to-indigo-600 dark:from-teal-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Question every decision.
          </span>
        </h1>
        
        <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 leading-relaxed">
          Automated redaction is no longer a black box. Conseal Trust Viewer turns automated PII scrubbing into an interactive, explainable, and auditable process.
        </p>
      </div>

      {/* Main Content (Samples Grid) */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-lg font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
            Audit Workspace Documents
          </h2>
          <span className="text-xs text-slate-400 font-medium">Select a file to inspect</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 h-56 animate-pulse space-y-4">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-5/6"></div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-4/5"></div>
                </div>
                <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/3 mt-6"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 p-6 rounded-2xl text-center space-y-3">
            <ShieldAlert className="w-10 h-10 text-red-500 mx-auto" />
            <h3 className="text-sm font-bold text-red-800 dark:text-red-300">Could Not Connect to Local Server</h3>
            <p className="text-xs text-red-600 dark:text-red-400 max-w-md mx-auto">
              Please ensure the express backend is running on port 5000 and you have run standard installation.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {samples.map((doc) => (
              <div
                key={doc.id}
                onClick={() => handleSelectDoc(doc.id)}
                className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-teal-500 dark:hover:border-teal-500 transition-all duration-300 cursor-pointer flex flex-col justify-between hover:-translate-y-1 relative overflow-hidden"
              >
                {/* Background glow decoration on hover */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full filter blur-xl group-hover:bg-teal-500/10 transition-colors" />

                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 group-hover:bg-teal-50 dark:group-hover:bg-teal-950/30 rounded-xl transition-colors">
                      <FileText className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400" />
                    </div>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${getSafetyBadgeColor(doc.safetyScore)}`}>
                      Safety Score: {doc.safetyScore}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-800 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors line-clamp-1">
                      {doc.title}
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-1">
                      {doc.spanCount} Identified PII Spans
                    </p>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-mono line-clamp-3 bg-slate-50/50 dark:bg-slate-850 p-2.5 rounded-lg border border-slate-100/50 dark:border-slate-800">
                    {doc.snippet}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-6 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                  <span>Start Audit Review</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Feature Highlight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 text-left">
        <div className="space-y-2 p-4 border border-slate-100 dark:border-slate-800 rounded-2xl">
          <div className="text-teal-600 dark:text-teal-400 font-bold font-mono text-xs uppercase tracking-wider flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
            <span>1. Adjust & Preview</span>
          </div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Dynamic Threshold Engine</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Drag the slider to see redactions dynamically engage or disengage based on AI classification certainty.
          </p>
        </div>
        <div className="space-y-2 p-4 border border-slate-100 dark:border-slate-800 rounded-2xl">
          <div className="text-teal-600 dark:text-teal-400 font-bold font-mono text-xs uppercase tracking-wider flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
            <span>2. Question Decisions</span>
          </div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Live "Ask Why" follow-ups</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Directly interrogate the model. Ask follow-up questions to understand why a token was kept or hidden.
          </p>
        </div>
        <div className="space-y-2 p-4 border border-slate-100 dark:border-slate-800 rounded-2xl">
          <div className="text-teal-600 dark:text-teal-400 font-bold font-mono text-xs uppercase tracking-wider flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
            <span>3. Audit Proofs</span>
          </div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Local Sandbox Decryption</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Safely reveal text underneath redactions using a secure local-only decryption toggle for verification.
          </p>
        </div>
      </div>
    </div>
  );
};
