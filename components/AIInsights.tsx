
import React from 'react';
import { Sparkles, TrendingUp, Lightbulb, ChevronRight } from 'lucide-react';

interface AIInsightsProps {
  insights: string[];
  loading: boolean;
}

export const AIInsights: React.FC<AIInsightsProps> = ({ insights, loading }) => {
  if (loading) {
    return (
      <div className="px-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm animate-pulse">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-5 h-5 bg-indigo-100 rounded-full"></div>
            <div className="h-3 w-24 bg-slate-100 rounded-full"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full bg-slate-50 rounded-full"></div>
            <div className="h-4 w-3/4 bg-slate-50 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (insights.length === 0) return null;

  return (
    <div className="px-4 mb-6 animate-slide-up">
      <div className="bg-white border border-indigo-100 rounded-3xl p-5 shadow-sm relative overflow-hidden group">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-indigo-50 rounded-full blur-2xl group-hover:bg-indigo-100 transition-colors"></div>
        
        <div className="flex items-center space-x-2 mb-4 relative z-10">
          <div className="bg-indigo-600 p-1.5 rounded-lg">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-sm font-extrabold text-indigo-900 tracking-tight">Kazi Smart Insights</h3>
        </div>

        <div className="space-y-4 relative z-10">
          {insights.map((insight, idx) => (
            <div key={idx} className="flex items-start space-x-3">
              <div className="mt-1 flex-shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5"></div>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed font-medium">
                {insight}
              </p>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Powered by Gemini AI</span>
          <button className="text-indigo-600 text-[10px] font-extrabold flex items-center uppercase tracking-widest">
            Learn More <ChevronRight className="w-3 h-3 ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
