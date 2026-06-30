import React from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useTrustStore } from '../store/useTrustStore';
import { isSpanRedacted } from '../components/TrustSummary';
import { ArrowLeft, Copy, Download, Check, FileText } from 'lucide-react';

export const DiffView: React.FC = () => {
  const navigate = useNavigate();
  const { docId } = useParams<{ docId: string }>();
  const { currentDoc, threshold, flaggedWrongSpans, showToast } = useTrustStore();

  const [copied, setCopied] = React.useState(false);

  if (!currentDoc) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">No Document Loaded</h2>
        <Link to="/" className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold">
          Return to Hub
        </Link>
      </div>
    );
  }

  const { originalText, spans } = currentDoc;

  // Generate redacted version of text
  const redactedText = React.useMemo(() => {
    let result = '';
    let lastIndex = 0;

    spans.forEach((span) => {
      if (span.start > lastIndex) {
        result += originalText.substring(lastIndex, span.start);
      }

      const isRedacted = isSpanRedacted(span, threshold, flaggedWrongSpans);
      if (isRedacted) {
        result += `[${span.type}]`;
      } else {
        result += span.text;
      }
      
      lastIndex = span.end;
    });

    if (lastIndex < originalText.length) {
      result += originalText.substring(lastIndex);
    }

    return result;
  }, [originalText, spans, threshold, flaggedWrongSpans]);

  const handleCopy = () => {
    navigator.clipboard.writeText(redactedText);
    setCopied(true);
    showToast('Redacted text copied to clipboard.');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([redactedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `redacted_${currentDoc.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Redacted text downloaded.');
  };

  // Render left original side highlights
  const renderOriginalHighlighted = () => {
    const segments: React.ReactNode[] = [];
    let lastIndex = 0;

    spans.forEach((span) => {
      if (span.start > lastIndex) {
        segments.push(
          <span key={`text-${lastIndex}`} className="whitespace-pre-wrap leading-relaxed">
            {originalText.substring(lastIndex, span.start)}
          </span>
        );
      }

      const isRedacted = isSpanRedacted(span, threshold, flaggedWrongSpans);
      
      segments.push(
        <span 
          key={span.id} 
          className={`px-1 py-0.5 rounded text-xs font-mono font-bold font-semibold select-all mx-0.5 ${
            isRedacted 
              ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 border border-dashed border-rose-300 dark:border-rose-900' 
              : 'bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 border border-dotted border-amber-300 dark:border-amber-900'
          }`}
          title={`${span.type}: ${isRedacted ? 'Will be redacted' : 'Will be kept'}`}
        >
          {span.text}
        </span>
      );

      lastIndex = span.end;
    });

    if (lastIndex < originalText.length) {
      segments.push(
        <span key={`text-${lastIndex}`} className="whitespace-pre-wrap leading-relaxed">
          {originalText.substring(lastIndex)}
        </span>
      );
    }

    return segments;
  };

  // Render right redacted side highlights
  const renderRedactedHighlighted = () => {
    const segments: React.ReactNode[] = [];
    let lastIndex = 0;

    spans.forEach((span) => {
      if (span.start > lastIndex) {
        segments.push(
          <span key={`text-${lastIndex}`} className="whitespace-pre-wrap leading-relaxed">
            {originalText.substring(lastIndex, span.start)}
          </span>
        );
      }

      const isRedacted = isSpanRedacted(span, threshold, flaggedWrongSpans);
      
      if (isRedacted) {
        segments.push(
          <span 
            key={span.id} 
            className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 dark:bg-slate-800 dark:text-slate-500 text-xs font-mono font-bold tracking-wider select-none border border-slate-950 dark:border-slate-900 mx-0.5"
          >
            [{span.type}]
          </span>
        );
      } else {
        segments.push(
          <span 
            key={span.id} 
            className="px-1 py-0.5 rounded border border-dotted border-amber-300 dark:border-amber-900 text-slate-800 dark:text-slate-200 text-xs font-mono mx-0.5"
          >
            {span.text}
          </span>
        );
      }

      lastIndex = span.end;
    });

    if (lastIndex < originalText.length) {
      segments.push(
        <span key={`text-${lastIndex}`} className="whitespace-pre-wrap leading-relaxed">
          {originalText.substring(lastIndex)}
        </span>
      );
    }

    return segments;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/50 dark:bg-slate-950/20">
      {/* Top Navbar */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate(`/review/${docId}`)}
            className="p-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-base md:text-lg font-bold text-slate-800 dark:text-white m-0 p-0 text-left line-clamp-1">
              Compare Audit: {currentDoc.title}
            </h1>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono text-left">
              Active threshold: {Math.round(threshold * 100)}%
            </p>
          </div>
        </div>

        <div className="flex space-x-2">
          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold shadow-sm transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Redacted'}</span>
          </button>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .TXT</span>
          </button>
        </div>
      </header>

      {/* Main Diff Display */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto">
        
        {/* Original side */}
        <div className="flex flex-col h-full min-h-[500px]">
          <div className="flex items-center space-x-2 mb-2">
            <FileText className="w-4 h-4 text-rose-500" />
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
              Original Document (PII Highlighted)
            </span>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex-1 text-left font-mono text-sm leading-relaxed overflow-y-auto select-text whitespace-pre-wrap">
            {renderOriginalHighlighted()}
          </div>
        </div>

        {/* Redacted side */}
        <div className="flex flex-col h-full min-h-[500px]">
          <div className="flex items-center space-x-2 mb-2">
            <FileText className="w-4 h-4 text-teal-500" />
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
              Redacted Output (Safe for Share)
            </span>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex-1 text-left font-mono text-sm leading-relaxed overflow-y-auto select-text whitespace-pre-wrap">
            {renderRedactedHighlighted()}
          </div>
        </div>

      </main>
    </div>
  );
};
