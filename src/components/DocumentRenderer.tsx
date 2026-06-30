import React from 'react';
import { useTrustStore } from '../store/useTrustStore';
import { isSpanRedacted } from './TrustSummary';
import { Eye, EyeOff } from 'lucide-react';

export const DocumentRenderer: React.FC = () => {
  const { 
    currentDoc, 
    threshold, 
    flaggedWrongSpans, 
    userRevealedSpans, 
    selectedSpanId, 
    setSelectedSpanId 
  } = useTrustStore();

  if (!currentDoc) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
        <span className="text-slate-400">No document loaded</span>
      </div>
    );
  }

  const { originalText, spans } = currentDoc;

  // Render spans inline
  const renderDocumentSegments = () => {
    const segments: React.ReactNode[] = [];
    let lastIndex = 0;

    // Filter out overlapping spans if any, but since we handcraft, it should be fine.
    spans.forEach((span) => {
      // Add plain text segment before the span
      if (span.start > lastIndex) {
        const textSegment = originalText.substring(lastIndex, span.start);
        segments.push(
          <span 
            key={`text-${lastIndex}`} 
            className="whitespace-pre-wrap leading-relaxed text-slate-800 dark:text-slate-200 font-mono tracking-wide"
          >
            {textSegment}
          </span>
        );
      }

      // Span settings
      const isRedacted = isSpanRedacted(span, threshold, flaggedWrongSpans);
      const isRevealed = !!userRevealedSpans[span.id];
      const isSelected = selectedSpanId === span.id;

      // Color coding for styling elements
      let bgStyle = '';
      let borderStyle = '';
      let textStyle = '';
      let label = span.type;

      if (isRedacted) {
        if (isRevealed) {
          // Revealed redacted span: pink/red highlight with dotted border
          bgStyle = isSelected 
            ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 ring-2 ring-teal-500' 
            : 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/30';
          borderStyle = 'border border-dashed border-rose-300 dark:border-rose-800';
          textStyle = 'px-1 py-0.5 rounded cursor-pointer transition-all duration-200 inline-flex items-center font-mono font-bold';
        } else {
          // Solid black-bar style: charcoal background, mono label, hides text
          bgStyle = isSelected 
            ? 'bg-slate-800 dark:bg-slate-200 text-teal-400 dark:text-teal-700 ring-2 ring-teal-500 scale-[1.02]' 
            : 'bg-slate-900 dark:bg-slate-800 text-slate-300 hover:bg-slate-800 dark:hover:bg-slate-700 hover:scale-[1.01]';
          borderStyle = 'border border-slate-950 dark:border-slate-900';
          textStyle = 'px-2 py-0.5 rounded cursor-pointer font-mono font-bold text-xs select-none shadow-sm transition-all duration-200 inline-flex items-center space-x-1 uppercase tracking-wider';
        }
      } else {
        // Flagged kept span: dotted underline, light gray/teal outline
        bgStyle = isSelected 
          ? 'bg-amber-100/80 dark:bg-amber-950/30 ring-2 ring-teal-500' 
          : 'bg-amber-50/50 dark:bg-slate-800/30 hover:bg-amber-100/30 dark:hover:bg-slate-800/50';
        borderStyle = 'border-b-2 border-dotted border-amber-500 dark:border-amber-400';
        textStyle = 'px-1 rounded cursor-pointer transition-all duration-200 inline-block font-mono';
      }

      segments.push(
        <span
          id={`doc-span-${span.id}`}
          key={span.id}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedSpanId(span.id);
          }}
          className={`${textStyle} ${bgStyle} ${borderStyle} mx-0.5`}
          title={`Click to inspect: ${span.type} (${Math.round(span.confidence * 100)}% Confidence)`}
        >
          {isRedacted ? (
            isRevealed ? (
              <span className="flex items-center space-x-1">
                <span>{span.text}</span>
                <span className="text-[10px] uppercase opacity-75 font-normal tracking-wide px-1 bg-rose-200/50 dark:bg-rose-900/40 rounded ml-1">
                  {label}
                </span>
                <Eye className="w-3 h-3 ml-0.5 text-rose-500" />
              </span>
            ) : (
              <span className="flex items-center space-x-1.5">
                <span className="opacity-50 text-[10px] font-normal">◼</span>
                <span>{label}</span>
                <span className="text-[10px] font-semibold text-teal-400 dark:text-teal-400/80 bg-slate-950 dark:bg-slate-900 px-1 py-0.2 rounded font-mono">
                  {Math.round(span.confidence * 100)}%
                </span>
                <EyeOff className="w-3 h-3 text-slate-500" />
              </span>
            )
          ) : (
            <span className="flex items-center space-x-0.5">
              <span>{span.text}</span>
              <span className="text-[9px] uppercase text-amber-600 dark:text-amber-400 font-bold font-mono tracking-wider ml-1 bg-amber-100 dark:bg-amber-950/50 px-1 rounded">
                Kept
              </span>
            </span>
          )}
        </span>
      );

      lastIndex = span.end;
    });

    // Add trailing text
    if (lastIndex < originalText.length) {
      segments.push(
        <span 
          key={`text-${lastIndex}`} 
          className="whitespace-pre-wrap leading-relaxed text-slate-800 dark:text-slate-200 font-mono tracking-wide"
        >
          {originalText.substring(lastIndex)}
        </span>
      );
    }

    return segments;
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm flex-1 min-h-[450px] relative overflow-y-auto">
      <div className="absolute top-4 right-4 flex items-center space-x-2">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
        </span>
        <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
          Live Redaction Sandboxing
        </span>
      </div>

      <div className="prose dark:prose-invert max-w-none font-mono text-sm leading-relaxed text-left select-text whitespace-pre-wrap mt-6">
        {renderDocumentSegments()}
      </div>
    </div>
  );
};
