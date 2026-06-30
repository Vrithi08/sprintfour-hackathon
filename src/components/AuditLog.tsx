import React, { useState, useMemo } from 'react';
import { useTrustStore } from '../store/useTrustStore';
import { isSpanRedacted } from './TrustSummary';
import { Search, SlidersHorizontal, Eye, EyeOff } from 'lucide-react';

export const AuditLog: React.FC = () => {
  const { 
    currentDoc, 
    threshold, 
    flaggedWrongSpans, 
    selectedSpanId, 
    setSelectedSpanId 
  } = useTrustStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, REDACTED, KEPT
  const [sortBy, setSortBy] = useState('position'); // position, confidence_desc, confidence_asc

  // Types list
  const piiTypes = useMemo(() => {
    if (!currentDoc) return [];
    const types = new Set(currentDoc.spans.map(s => s.type));
    return ['ALL', ...Array.from(types)];
  }, [currentDoc]);

  // Filtered and sorted spans
  const processedSpans = useMemo(() => {
    if (!currentDoc) return [];
    
    let result = [...currentDoc.spans];

    // Filter by search
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.text.toLowerCase().includes(q) || 
        s.type.toLowerCase().includes(q)
      );
    }

    // Filter by PII Type
    if (typeFilter !== 'ALL') {
      result = result.filter(s => s.type === typeFilter);
    }

    // Filter by Redact Status
    if (statusFilter !== 'ALL') {
      result = result.filter(s => {
        const isRedacted = isSpanRedacted(s, threshold, flaggedWrongSpans);
        return statusFilter === 'REDACTED' ? isRedacted : !isRedacted;
      });
    }

    // Sort
    if (sortBy === 'position') {
      result.sort((a, b) => a.start - b.start);
    } else if (sortBy === 'confidence_desc') {
      result.sort((a, b) => b.confidence - a.confidence);
    } else if (sortBy === 'confidence_asc') {
      result.sort((a, b) => a.confidence - b.confidence);
    }

    return result;
  }, [currentDoc, searchQuery, typeFilter, statusFilter, sortBy, threshold, flaggedWrongSpans]);

  if (!currentDoc) return null;

  const handleSpanClick = (spanId: string) => {
    setSelectedSpanId(spanId);
    setTimeout(() => {
      const element = document.getElementById(`doc-span-${spanId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'NAME': return 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/30 dark:text-teal-400 dark:border-teal-900';
      case 'EMAIL': return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900';
      case 'PHONE': return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900';
      case 'SSN': return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900';
      case 'ADDRESS': return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900';
      case 'DATE': return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900';
      case 'ORG': return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900';
      default: return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-800';
    }
  };

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.9) return 'bg-emerald-500';
    if (conf >= 0.7) return 'bg-teal-500';
    if (conf >= 0.5) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          Redaction Audit Log
        </h3>
        <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500 dark:text-slate-400">
          Showing {processedSpans.length} / {currentDoc.spans.length}
        </span>
      </div>

      {/* Filters Area */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-900/30">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by text or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-700 dark:text-slate-300"
          />
        </div>

        {/* Filter Badges / Selects */}
        <div className="grid grid-cols-3 gap-2">
          {/* PII Type Select */}
          <div>
            <label className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase tracking-wider">PII Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full py-1 px-2 text-[11px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-700 dark:text-slate-300 font-mono"
            >
              {piiTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Status Select */}
          <div>
            <label className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase tracking-wider">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-1 px-2 text-[11px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-700 dark:text-slate-300 font-mono"
            >
              <option value="ALL">ALL</option>
              <option value="REDACTED">Redacted</option>
              <option value="KEPT">Kept</option>
            </select>
          </div>

          {/* Sort Select */}
          <div>
            <label className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase tracking-wider">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full py-1 px-2 text-[11px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-700 dark:text-slate-300 font-mono"
            >
              <option value="position">Position</option>
              <option value="confidence_desc">Conf (High)</option>
              <option value="confidence_asc">Conf (Low)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Spans List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 max-h-[500px]">
        {processedSpans.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 dark:text-slate-500">
            <SlidersHorizontal className="w-8 h-8 mb-2 opacity-50" />
            <span className="text-xs">No redactions match selected filters.</span>
          </div>
        ) : (
          processedSpans.map((span) => {
            const isRedacted = isSpanRedacted(span, threshold, flaggedWrongSpans);
            const isSelected = selectedSpanId === span.id;

            return (
              <div
                key={span.id}
                onClick={() => handleSpanClick(span.id)}
                className={`p-3 text-left cursor-pointer transition-all duration-150 flex flex-col justify-between ${
                  isSelected 
                    ? 'bg-slate-50 dark:bg-slate-800/60 border-l-4 border-teal-500' 
                    : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/25 border-l-4 border-transparent'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-1.5">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${getBadgeColor(span.type)}`}>
                      {span.type}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      #{span.id.split('_').pop()}
                    </span>
                  </div>
                  
                  {/* Status Indicator */}
                  <div className="flex items-center space-x-1">
                    {isRedacted ? (
                      <span className="flex items-center space-x-0.5 text-[10px] text-teal-600 dark:text-teal-400 font-semibold font-mono">
                        <EyeOff className="w-3 h-3" />
                        <span>Redacted</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-0.5 text-[10px] text-slate-500 dark:text-slate-400 font-semibold font-mono">
                        <Eye className="w-3 h-3" />
                        <span>Kept</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Substring preview */}
                <div className="text-xs font-mono font-medium text-slate-700 dark:text-slate-300 truncate pr-4">
                  {isRedacted ? (
                    <span className="text-slate-400 dark:text-slate-600 bg-slate-100 dark:bg-slate-800 px-1 rounded select-none">
                      [REDACTED DATA]
                    </span>
                  ) : (
                    <span>{span.text}</span>
                  )}
                </div>

                {/* Confidence Bar */}
                <div className="mt-2.5 space-y-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400 dark:text-slate-500">Confidence</span>
                    <span className="font-mono font-semibold text-slate-600 dark:text-slate-400">
                      {Math.round(span.confidence * 100)}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${getConfidenceColor(span.confidence)}`}
                      style={{ width: `${span.confidence * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
