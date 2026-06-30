import React from 'react';
import { useTrustStore } from '../store/useTrustStore';
import { AnimatedCountUp } from './AnimatedCountUp';
import type { PIISpan } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { Shield, ShieldAlert, ShieldCheck, Eye, Activity } from 'lucide-react';

export const isSpanRedacted = (
  span: PIISpan, 
  threshold: number, 
  flaggedWrongSpans: Record<string, boolean>
): boolean => {
  const isInitiallyRedacted = span.status === 'redacted' && span.confidence >= threshold;
  // If flagged wrong, invert the status
  const isOverridden = flaggedWrongSpans[span.id];
  return isOverridden ? !isInitiallyRedacted : isInitiallyRedacted;
};

export const TrustSummary: React.FC = () => {
  const { currentDoc, threshold, setThreshold, flaggedWrongSpans } = useTrustStore();

  if (!currentDoc) return null;

  const totalSpans = currentDoc.spans.length;
  
  // Calculate dynamic states
  const redactedSpans = currentDoc.spans.filter(span => 
    isSpanRedacted(span, threshold, flaggedWrongSpans)
  );
  
  const visibleSpans = currentDoc.spans.filter(span => 
    !isSpanRedacted(span, threshold, flaggedWrongSpans)
  );

  const redactionRate = totalSpans > 0 ? Math.round((redactedSpans.length / totalSpans) * 100) : 100;
  
  // Calculate average confidence of detected PII
  const avgConfidence = totalSpans > 0 
    ? Math.round((currentDoc.spans.reduce((sum, s) => sum + s.confidence, 0) / totalSpans) * 100) 
    : 0;

  // Dynamic Safety Score
  // Threat is defined by the sum of confidence of PII spans that remain visible (unredacted).
  // A higher threat reduces the safety score.
  const totalThreat = visibleSpans.reduce((sum, s) => sum + s.confidence, 0);
  const maxThreat = currentDoc.spans.reduce((sum, s) => sum + s.confidence, 0) || 1;
  const dynamicSafetyScore = Math.max(0, Math.min(100, Math.round(100 - (totalThreat / maxThreat) * 100)));

  // Generate chart data based on active redactions
  const typeCounts: Record<string, number> = {};
  currentDoc.spans.forEach(span => {
    const isRedacted = isSpanRedacted(span, threshold, flaggedWrongSpans);
    const key = isRedacted ? `${span.type} (Redacted)` : `${span.type} (Visible)`;
    typeCounts[key] = (typeCounts[key] || 0) + 1;
  });

  const chartData = Object.entries(typeCounts).map(([name, count]) => ({
    name,
    count
  })).sort((a, b) => b.count - a.count);

  // Colors for PII categories
  const getBarColor = (name: string) => {
    if (name.includes('Visible')) return '#94A3B8'; // gray for visible
    if (name.includes('NAME')) return '#0D9488'; // teal
    if (name.includes('EMAIL')) return '#3B82F6'; // blue
    if (name.includes('PHONE')) return '#6366F1'; // indigo
    if (name.includes('SSN')) return '#EF4444'; // red
    if (name.includes('ADDRESS')) return '#F59E0B'; // amber
    if (name.includes('DATE')) return '#8B5CF6'; // purple
    if (name.includes('ORG')) return '#10B981'; // emerald
    return '#64748B'; // slate other
  };

  const getSafetyIcon = (score: number) => {
    if (score >= 80) return <ShieldCheck className="w-12 h-12 text-emerald-500" />;
    if (score >= 50) return <Shield className="w-12 h-12 text-amber-500" />;
    return <ShieldAlert className="w-12 h-12 text-red-500" />;
  };

  const getSafetyBadgeStyle = (score: number) => {
    if (score >= 80) return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900';
    if (score >= 50) return 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-900';
    return 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border-red-200 dark:border-red-900';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      {/* Safety Score Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500">
            Document Safety Score
          </span>
          <Activity className="w-5 h-5 text-slate-300 dark:text-slate-700" />
        </div>
        
        <div className="flex items-center space-x-6 my-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
            {getSafetyIcon(dynamicSafetyScore)}
          </div>
          <div>
            <div className="flex items-baseline">
              <AnimatedCountUp 
                value={dynamicSafetyScore} 
                className="text-5xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100" 
              />
              <span className="text-xl text-slate-400 dark:text-slate-500 ml-1">/100</span>
            </div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border mt-1.5 ${getSafetyBadgeStyle(dynamicSafetyScore)}`}>
              {dynamicSafetyScore >= 80 ? 'Secure' : dynamicSafetyScore >= 50 ? 'Moderate Risk' : 'High Risk Exposure'}
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
          Calculated dynamically based on the exposure risk of unredacted PII in this document.
        </p>
      </div>

      {/* Threshold & Summary Stats Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500">
            Redaction Control
          </span>
          <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500 dark:text-slate-400">
            Confidence &gt;= {Math.round(threshold * 100)}%
          </span>
        </div>

        {/* Confidence Threshold Slider */}
        <div className="space-y-2 mb-6">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Aggressive (0%)</span>
            <span>Balanced</span>
            <span>Conservative (100%)</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-600 dark:accent-teal-500"
          />
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Slide to adjust the minimum AI confidence level required to auto-redact a span.
          </p>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-4 gap-1 border-t border-slate-100 dark:border-slate-800 pt-4">
          <div className="text-center">
            <span className="block text-[10px] font-medium text-slate-400 dark:text-slate-500">Spans</span>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{totalSpans}</span>
          </div>
          <div className="text-center border-x border-slate-100 dark:border-slate-800">
            <span className="block text-[10px] font-medium text-slate-400 dark:text-slate-500">Rate</span>
            <span className="text-sm font-bold text-teal-600 dark:text-teal-400">{redactionRate}%</span>
          </div>
          <div className="text-center border-r border-slate-100 dark:border-slate-800">
            <span className="block text-[10px] font-medium text-slate-400 dark:text-slate-500">Avg Conf</span>
            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{avgConfidence}%</span>
          </div>
          <div className="text-center">
            <span className="block text-[10px] font-medium text-slate-400 dark:text-slate-500">Visible</span>
            <span className="text-sm font-bold text-slate-600 dark:text-slate-400 flex items-center justify-center space-x-0.5">
              <Eye className="w-3 h-3" />
              <span>{visibleSpans.length}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Distribution Chart Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col">
        <span className="text-sm font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500 mb-4 block">
          PII Entity Distribution
        </span>
        <div className="flex-1 min-h-[140px] flex items-center justify-center">
          {chartData.length === 0 ? (
            <span className="text-xs text-slate-400">No active spans detected in document.</span>
          ) : (
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} style={{ fontSize: '10px', fill: '#94A3B8' }} />
                <Tooltip
                  cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                  contentStyle={{
                    fontSize: '11px',
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={8}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.name)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};
