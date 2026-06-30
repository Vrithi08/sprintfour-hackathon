import React from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useTrustStore } from '../store/useTrustStore';
import { isSpanRedacted } from '../components/TrustSummary';
import { ArrowLeft, Copy, Download, Check, FileText, ShieldCheck, AlertTriangle, X } from 'lucide-react';

export const DiffView: React.FC = () => {
  const navigate = useNavigate();
  const { docId } = useParams<{ docId: string }>();
  const { currentDoc, threshold, flaggedWrongSpans, showToast } = useTrustStore();

  const [copied, setCopied] = React.useState(false);
  const [showVerifyModal, setShowVerifyModal] = React.useState(false);
  const [verifyAction, setVerifyAction] = React.useState<'download' | 'copy' | null>(null);
  const [piiChecked, setPiiChecked] = React.useState(false);
  const [unmaskedChecked, setUnmaskedChecked] = React.useState(false);

  const redactedCount = React.useMemo(() => {
    return currentDoc?.spans.filter(s => isSpanRedacted(s, threshold, flaggedWrongSpans)).length || 0;
  }, [currentDoc, threshold, flaggedWrongSpans]);

  const keptCount = React.useMemo(() => {
    return currentDoc?.spans.filter(s => !isSpanRedacted(s, threshold, flaggedWrongSpans)).length || 0;
  }, [currentDoc, threshold, flaggedWrongSpans]);

  const lowConfidenceKeptCount = React.useMemo(() => {
    return currentDoc?.spans.filter(s => !isSpanRedacted(s, threshold, flaggedWrongSpans) && s.confidence < 0.8).length || 0;
  }, [currentDoc, threshold, flaggedWrongSpans]);

  // Generate redacted version of text
  const redactedText = React.useMemo(() => {
    if (!currentDoc) return '';
    const { originalText, spans } = currentDoc;
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
  }, [currentDoc, threshold, flaggedWrongSpans]);

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

  const triggerVerify = (action: 'download' | 'copy') => {
    setVerifyAction(action);
    setPiiChecked(false);
    setUnmaskedChecked(false);
    setShowVerifyModal(true);
  };

  const handleConfirmVerify = () => {
    setShowVerifyModal(false);
    if (verifyAction === 'copy') {
      handleCopy();
    } else if (verifyAction === 'download') {
      handleDownload();
    }
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
            onClick={() => triggerVerify('copy')}
            className="flex items-center space-x-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold shadow-sm transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Redacted'}</span>
          </button>

          {/* Download Button */}
          <button
            onClick={() => triggerVerify('download')}
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

      {/* Before-You-Share Verification Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    Before-You-Share Verification
                  </h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                    Verify the safety of the redacted output
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowVerifyModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4">
              {/* Document Summary Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 p-3 rounded-2xl text-left">
                  <span className="block text-[9px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-mono font-bold">Redacted</span>
                  <span className="text-lg font-bold text-emerald-800 dark:text-emerald-300 font-mono">{redactedCount}</span>
                  <span className="block text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">items safely hidden</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/80 p-3 rounded-2xl text-left">
                  <span className="block text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono font-bold">Kept Visible</span>
                  <span className="text-lg font-bold text-slate-700 dark:text-slate-300 font-mono">{keptCount}</span>
                  <span className="block text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">items kept unmasked</span>
                </div>
              </div>

              {/* Low Confidence Warning */}
              {lowConfidenceKeptCount > 0 && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 p-3.5 rounded-2xl text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed flex items-start space-x-2.5 text-left">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Attention Required:</strong> There are <span className="font-mono font-bold">{lowConfidenceKeptCount}</span> unmasked items with low confidence scores (&lt; 80%). Please ensure no sensitive information is leaked.
                  </div>
                </div>
              )}

              {/* Checklist */}
              <div className="space-y-3 pt-2">
                <label className="flex items-start space-x-3 cursor-pointer group text-left">
                  <input
                    type="checkbox"
                    checked={piiChecked}
                    onChange={(e) => setPiiChecked(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 mt-0.5 accent-teal-600"
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-300 select-none leading-relaxed">
                    I have verified that all sensitive PII (e.g., Passport Numbers, Emails, Phone Numbers) is correctly masked.
                  </span>
                </label>

                <label className="flex items-start space-x-3 cursor-pointer group text-left">
                  <input
                    type="checkbox"
                    checked={unmaskedChecked}
                    onChange={(e) => setUnmaskedChecked(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 mt-0.5 accent-teal-600"
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-300 select-none leading-relaxed">
                    I confirm that the visible, unmasked text is safe for external sharing and does not violate privacy policies.
                  </span>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex space-x-3 justify-end">
              <button
                onClick={() => setShowVerifyModal(false)}
                className="py-2 px-4 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmVerify}
                disabled={!piiChecked || !unmaskedChecked}
                className="py-2 px-5 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center space-x-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Confirm & {verifyAction === 'copy' ? 'Copy' : 'Download'}</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
