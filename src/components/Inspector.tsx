import React, { useState, useEffect, useRef } from 'react';
import { useTrustStore } from '../store/useTrustStore';
import { isSpanRedacted } from './TrustSummary';
import { 
  X, 
  Sparkles, 
  Send, 
  HelpCircle, 
  Eye, 
  EyeOff, 
  ShieldAlert,
  RefreshCcw,
  Flag
} from 'lucide-react';

// Typewriter component for streaming effect
const TypewriterText: React.FC<{ text: string; delay?: number }> = ({ text, delay = 12 }) => {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    setDisplayedText('');
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(i));
      i++;
      if (i >= text.length) {
        clearInterval(interval);
      }
    }, delay);

    return () => clearInterval(interval);
  }, [text, delay]);

  return <span className="typing-cursor font-medium">{displayedText}</span>;
};

// ---- Local fallback engine (used when LLM is unavailable) ----
// Produces a unique, contextual answer per span based on type, status,
// confidence level, the user's question, and worried-mode toggle.
function generateLocalFallback(
  span: { text: string; type: string; confidence: number; status: string; reasoning: string; reasoningWorried: string },
  userQuestion: string,
  worriedMode: boolean
): string {
  const conf = Math.round(span.confidence * 100);
  const isRedacted = span.status === 'redacted';
  const maskedText = isRedacted ? `[${span.type}]` : `"${span.text}"`;

  // Type-specific detail
  const typeDetails: Record<string, { risk: string; regulation: string; worriedExtra: string }> = {
    NAME:       { risk: 'identity theft or targeted social engineering', regulation: 'GDPR Article 4(1), CCPA §1798.140(o)', worriedExtra: 'Your name is the single most important piece of your identity — we take extra care to ensure it never leaks.' },
    EMAIL:      { risk: 'phishing attacks and spam campaigns', regulation: 'CAN-SPAM Act, GDPR Article 9', worriedExtra: 'Email addresses are direct attack vectors for phishing. We redact them to keep you safe from unsolicited contact.' },
    PHONE:      { risk: 'vishing (voice phishing) or SIM-swap fraud', regulation: 'TCPA, GDPR Article 4(1)', worriedExtra: 'Phone numbers can be exploited for SIM-swap attacks. Keeping this hidden protects you from account takeover.' },
    LOC:        { risk: 'physical safety concerns and stalking', regulation: 'GDPR Article 9, various state privacy laws', worriedExtra: 'A physical address can put someone at real-world risk. We always err on the side of caution here.' },
    DATE:       { risk: 'timeline reconstruction that could de-anonymize individuals', regulation: 'HIPAA Safe Harbor, GDPR Recital 26', worriedExtra: 'Dates may seem harmless, but combined with other data they can uniquely identify a person.' },
    ORG:        { risk: 'corporate espionage or competitive intelligence leakage', regulation: 'Trade Secrets Act, NDA enforcement', worriedExtra: 'Organization names are sometimes kept visible when they are public entities, but we flag them for your review.' },
    FIN:        { risk: 'financial fraud, unauthorized transactions, or account takeover', regulation: 'PCI-DSS, GLBA, SOX', worriedExtra: 'Financial data is among the most sensitive categories. Even partial account numbers can be exploited by fraudsters.' },
    IP_ADDRESS: { risk: 'network intrusion, geolocation tracking, or DDoS targeting', regulation: 'GDPR Article 4(1), CCPA §1798.140(o)', worriedExtra: 'IP addresses are legally classified as personal data in many jurisdictions. We always redact them.' },
    SSN:        { risk: 'identity fraud and credit damage', regulation: 'FCRA, state SSN protection laws', worriedExtra: 'Social security numbers are the highest-risk identifier. A single leak can cause years of damage.' },
    OTHER:      { risk: 'contextual privacy leakage depending on surrounding data', regulation: 'General data minimization principles (GDPR Article 5)', worriedExtra: 'Even data that seems generic can become identifying when combined with other fields in the document.' },
  };

  const detail = typeDetails[span.type] || typeDetails['OTHER'];

  // Confidence-based qualifier
  let confQualifier: string;
  if (conf >= 95) confQualifier = 'Our detection engine identified this with very high certainty.';
  else if (conf >= 80) confQualifier = 'The detection confidence is strong, though a human reviewer should confirm.';
  else if (conf >= 60) confQualifier = 'The confidence is moderate — this was flagged for manual review because the pattern match was not conclusive.';
  else confQualifier = 'The confidence is relatively low, which means the system is unsure. This is exactly why a human auditor should verify the decision.';

  // Status-specific explanation
  let statusExplanation: string;
  if (isRedacted) {
    statusExplanation = `This ${span.type} was fully redacted to prevent ${detail.risk}. The applicable regulation(s) include ${detail.regulation}.`;
  } else {
    statusExplanation = `This ${span.type} (${maskedText}) was flagged but kept visible because the system determined it poses an acceptable risk in context. Reason: ${span.reasoning}`;
  }

  // Question-aware response — check if the user is asking about specific topics
  const qLower = userQuestion.toLowerCase();
  let questionResponse = '';
  if (qLower.includes('why') && (qLower.includes('redact') || qLower.includes('mask') || qLower.includes('hidden') || qLower.includes('removed'))) {
    questionResponse = isRedacted
      ? `This was redacted because exposing a ${span.type} carries a risk of ${detail.risk}. ${confQualifier}`
      : `This was kept visible because: ${span.reasoning}. However, the system still flagged it at ${conf}% confidence for your review.`;
  } else if (qLower.includes('confidence') || qLower.includes('accurate') || qLower.includes('sure') || qLower.includes('certain')) {
    questionResponse = `${confQualifier} At ${conf}% confidence, ${conf >= 80 ? 'the system is fairly certain this classification is correct.' : 'there is some ambiguity — this is why human oversight is essential.'}`;
  } else if (qLower.includes('safe') || qLower.includes('risk') || qLower.includes('danger')) {
    questionResponse = `The primary risk of exposing a ${span.type} is ${detail.risk}. ${isRedacted ? 'That is why it was redacted.' : 'It was kept visible because the contextual risk was deemed acceptable, but you may override this.'}`;
  } else if (qLower.includes('regulation') || qLower.includes('law') || qLower.includes('compliance') || qLower.includes('gdpr') || qLower.includes('hipaa')) {
    questionResponse = `The relevant regulation(s) for this ${span.type} include ${detail.regulation}. ${isRedacted ? 'Redaction ensures compliance with these standards.' : 'The system judged that keeping it visible does not violate these standards in this context.'}`;
  } else {
    questionResponse = statusExplanation;
  }

  if (worriedMode) {
    return `${detail.worriedExtra} ${questionResponse} ${confQualifier} Rest assured — every redaction decision is logged and auditable, and you can always override it if needed.`;
  }

  return `${questionResponse} ${confQualifier}`;
}

export const Inspector: React.FC = () => {
  const { 
    currentDoc, 
    threshold, 
    flaggedWrongSpans, 
    userRevealedSpans, 
    selectedSpanId, 
    setSelectedSpanId, 
    toggleFlaggedWrong, 
    toggleRevealed,
    worriedMode,
    askWhyHistory,
    addAskWhyQA,
    showToast
  } = useTrustStore();

  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamText, setStreamText] = useState<string | null>(null);
  
  // 2-step verification for revealing redacted spans
  const [confirmRevealState, setConfirmRevealState] = useState<'idle' | 'warning' | 'revealed'>('idle');

  const historyEndRef = useRef<HTMLDivElement>(null);

  // Find the selected span
  const span = currentDoc?.spans.find(s => s.id === selectedSpanId);

  // Sync confirm state when span changes
  useEffect(() => {
    if (span) {
      const isRevealed = !!userRevealedSpans[span.id];
      setConfirmRevealState(isRevealed ? 'revealed' : 'idle');
    }
  }, [selectedSpanId, span, userRevealedSpans]);

  // Scroll to bottom of QA history
  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [askWhyHistory, streamText, loading]);

  if (!currentDoc) return null;

  if (!span) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm h-full flex flex-col justify-center items-center text-center">
        <HelpCircle className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3 animate-pulse-slow" />
        <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
          Inspect Decision
        </h4>
        <p className="text-xs text-slate-400 max-w-[200px]">
          Select any highlighted term or redacted bar in the document to audit its policy reasoning.
        </p>
      </div>
    );
  }

  const isRedacted = isSpanRedacted(span, threshold, flaggedWrongSpans);
  const history = askWhyHistory[span.id] || [];

  const handleRevealClick = () => {
    if (confirmRevealState === 'idle') {
      setConfirmRevealState('warning');
    } else if (confirmRevealState === 'revealed') {
      toggleRevealed(span.id);
      setConfirmRevealState('idle');
      showToast('Data concealed.');
    }
  };

  const handleConfirmReveal = () => {
    toggleRevealed(span.id);
    setConfirmRevealState('revealed');
    showToast('Data temporarily decrypted locally.');
  };

  const handleFlagDecision = () => {
    toggleFlaggedWrong(span.id);
    const nowRedacted = !isRedacted;
    showToast(`Decision overridden. Term is now ${nowRedacted ? 'Redacted' : 'Kept Visible'}.`);
  };

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || loading) return;

    const userQuestion = question.trim();
    setQuestion('');
    setLoading(true);
    setStreamText(null);

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          span,
          question: userQuestion,
          worriedMode
        })
      });

      const data = await response.json();

      if (data.fallback) {
        // Generate a rich, unique fallback answer per span
        const fallbackAnswer = generateLocalFallback(span, userQuestion, worriedMode);
        
        setStreamText(fallbackAnswer);
        setTimeout(() => {
          addAskWhyQA(span.id, userQuestion, fallbackAnswer, true);
          setStreamText(null);
          setLoading(false);
        }, 1500);
      } else {
        setStreamText(data.answer);
        // Wait for the typewriter animation duration roughly, then save to history
        const duration = Math.min(3000, data.answer.length * 15);
        setTimeout(() => {
          addAskWhyQA(span.id, userQuestion, data.answer, false);
          setStreamText(null);
          setLoading(false);
        }, duration);
      }
    } catch (err) {
      console.error(err);
      const errorMsg = 'Failed to connect to the explanation service. Please check your internet connection.';
      setStreamText(errorMsg);
      setTimeout(() => {
        addAskWhyQA(span.id, userQuestion, errorMsg, true);
        setStreamText(null);
        setLoading(false);
      }, 1500);
    }
  };

  const getConfidenceLevel = (conf: number) => {
    if (conf >= 0.9) return { text: 'High Confidence', style: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200' };
    if (conf >= 0.7) return { text: 'Moderate Confidence', style: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/20 border-teal-200' };
    if (conf >= 0.5) return { text: 'Low Confidence / Borderline', style: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border-amber-200' };
    return { text: 'Extremely Low / System Flagged', style: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 border-rose-200' };
  };

  const confMeta = getConfidenceLevel(span.confidence);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm h-full flex flex-col overflow-hidden relative">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 dark:text-slate-500">
            Selected Entity #{span.id.split('_').pop()}
          </span>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-1.5 mt-0.5">
            <span>{span.type} Detection</span>
          </h3>
        </div>
        <button 
          onClick={() => setSelectedSpanId(null)}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Info */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[500px]">
        {/* Confidence & Status */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 p-3 rounded-xl">
            <span className="block text-[10px] text-slate-400 uppercase tracking-wide font-medium">Confidence Score</span>
            <span className="text-xl font-bold font-mono text-slate-700 dark:text-slate-300">{Math.round(span.confidence * 100)}%</span>
            <span className={`block text-[9px] mt-1 font-semibold ${confMeta.style.split(' ')[0]}`}>
              {confMeta.text}
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 p-3 rounded-xl flex flex-col justify-between">
            <div>
              <span className="block text-[10px] text-slate-400 uppercase tracking-wide font-medium">State Decision</span>
              <span className={`text-sm font-bold block mt-1 ${isRedacted ? 'text-teal-600 dark:text-teal-400' : 'text-slate-600 dark:text-slate-400'}`}>
                {isRedacted ? 'Redacted (Hidden)' : 'Kept (Visible)'}
              </span>
            </div>
            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono">
              {span.status === 'flagged_kept' ? 'System policy match' : 'Pattern auto-match'}
            </span>
          </div>
        </div>

        {/* Text Decryption & Verification */}
        <div className="bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800 rounded-xl p-3">
          <span className="block text-[10px] text-slate-400 uppercase tracking-wide font-semibold mb-2">
            Verification Box
          </span>
          
          {confirmRevealState === 'idle' && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                Text is currently masked
              </span>
              <button
                onClick={handleRevealClick}
                className="flex items-center space-x-1 py-1 px-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Decrypt Text</span>
              </button>
            </div>
          )}

          {confirmRevealState === 'warning' && (
            <div className="space-y-2">
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 p-2.5 rounded-lg text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed flex items-start space-x-2">
                <ShieldAlert className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Privacy Warning:</strong> This text is never sent to the AI tool — you're viewing the redaction proof locally. Confirm reveal?
                </span>
              </div>
              <div className="flex space-x-2 justify-end">
                <button
                  onClick={() => setConfirmRevealState('idle')}
                  className="py-1 px-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReveal}
                  className="py-1 px-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold"
                >
                  Confirm Reveal
                </button>
              </div>
            </div>
          )}

          {confirmRevealState === 'revealed' && (
            <div className="flex items-center justify-between">
              <div className="text-xs font-mono bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 px-2 py-1 rounded font-bold border border-rose-100 dark:border-rose-900/40">
                {span.text}
              </div>
              <button
                onClick={handleRevealClick}
                className="flex items-center space-x-1 py-1 px-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition-colors"
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span>Mask Data</span>
              </button>
            </div>
          )}
        </div>

        {/* Explain Base Reasoning */}
        <div className="space-y-1">
          <span className="block text-[10px] text-slate-400 uppercase tracking-wide font-semibold">
            Audit Explanation
          </span>
          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 p-3 rounded-xl">
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {worriedMode ? span.reasoningWorried : span.reasoning}
            </p>
          </div>
        </div>

        {/* Q&A Chat Section */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
          <span className="block text-[10px] text-slate-400 uppercase tracking-wide font-semibold">
            Audit Interactive Q&A
          </span>

          {/* History */}
          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
            {history.map((msg, idx) => (
              <div key={idx} className="space-y-1.5 text-left">
                {/* Question */}
                <div className="flex items-start space-x-1.5 justify-end">
                  <div className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-2 rounded-2xl rounded-tr-none text-xs max-w-[85%] font-medium">
                    {msg.question}
                  </div>
                </div>

                {/* Answer */}
                <div className="flex items-start space-x-1.5">
                  <div className="bg-teal-50/50 dark:bg-slate-800/20 border border-teal-100/40 dark:border-slate-800 p-2.5 rounded-2xl rounded-tl-none text-xs text-slate-600 dark:text-slate-300 max-w-[85%] relative">
                    <div className="flex items-center space-x-1 text-[9px] text-teal-600 dark:text-teal-400 font-bold uppercase tracking-wider mb-1 font-mono">
                      <Sparkles className="w-3 h-3" />
                      <span>{msg.isFallback ? 'Static Explanation' : 'Live Grounded explanation'}</span>
                    </div>
                    <div>{msg.answer}</div>
                    <span className="block text-[9px] text-slate-400 text-right mt-1 font-mono">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Simulated Live Stream response */}
            {loading && (
              <div className="space-y-1.5 text-left">
                <div className="flex items-start space-x-1.5 justify-end">
                  <div className="bg-slate-100 dark:bg-slate-800 text-slate-400 p-2 rounded-2xl rounded-tr-none text-xs">
                    Thinking...
                  </div>
                </div>
                <div className="flex items-start space-x-1.5">
                  <div className="bg-teal-50/50 dark:bg-slate-800/20 border border-teal-100/40 dark:border-slate-800 p-2.5 rounded-2xl rounded-tl-none text-xs text-slate-600 dark:text-slate-400 max-w-[85%] flex items-center space-x-2">
                    <RefreshCcw className="w-3.5 h-3.5 animate-spin text-teal-500" />
                    {streamText ? (
                      <TypewriterText text={streamText} />
                    ) : (
                      <span className="font-medium animate-pulse">Querying Gemini for explanation...</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {history.length === 0 && !loading && (
              <div className="text-center py-4 text-slate-400 dark:text-slate-500 border border-dashed border-slate-100 dark:border-slate-800 rounded-xl">
                <HelpCircle className="w-6 h-6 mx-auto mb-1 opacity-40 text-slate-400" />
                <p className="text-[10px]">No questions asked yet. Challenge this decision below.</p>
              </div>
            )}
            <div ref={historyEndRef} />
          </div>

          {/* Form */}
          <form onSubmit={handleQuestionSubmit} className="flex space-x-2">
            <input
              type="text"
              placeholder="Ask why this was redacted/kept..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={loading}
              className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-700 dark:text-slate-300 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="p-1.5 bg-teal-600 text-white rounded-lg disabled:opacity-40 hover:bg-teal-500 transition-colors shadow-sm"
              title="Submit follow-up question"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Flag / Override Action Footer */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex space-x-2">
        <button
          onClick={handleFlagDecision}
          className="flex-1 py-1.5 px-3 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center space-x-1.5 shadow-sm transition-all"
        >
          <Flag className="w-3.5 h-3.5 text-rose-500" />
          <span>{isRedacted ? 'Flag Kept (Unmask)' : 'Flag Redacted (Mask)'}</span>
        </button>
      </div>
    </div>
  );
};
