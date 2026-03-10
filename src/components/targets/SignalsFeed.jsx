import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, DollarSign, MapPin, Users, Loader2 } from "lucide-react";

const SIGNAL_CONFIG = {
  funding: {
    label: "Funding",
    icon: DollarSign,
    color: "bg-green-100 text-green-800 border-green-200",
    dot: "bg-green-500",
    line: "border-green-200",
  },
  expansion: {
    label: "Expansion",
    icon: MapPin,
    color: "bg-blue-100 text-blue-800 border-blue-200",
    dot: "bg-blue-500",
    line: "border-blue-200",
  },
  hiring: {
    label: "Hiring",
    icon: Users,
    color: "bg-purple-100 text-purple-800 border-purple-200",
    dot: "bg-purple-500",
    line: "border-purple-200",
  },
};

export default function SignalsFeed({ targetId }) {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!targetId) return;
    base44.entities.GrowthSignal.filter({ target_id: targetId }, '-created_date')
      .then(setSignals)
      .finally(() => setLoading(false));
  }, [targetId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (signals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <TrendingUp className="w-12 h-12 text-slate-200 mb-4" />
        <p className="text-slate-500 font-medium">No growth signals yet</p>
        <p className="text-slate-400 text-sm mt-1">
          Run "Detect Growth Signals" from the Saved Targets page to populate this feed.
        </p>
      </div>
    );
  }

  return (
    <div className="relative pl-6">
      {/* Vertical line */}
      <div className="absolute left-2.5 top-0 bottom-0 w-px bg-slate-200" />

      <div className="space-y-6">
        {signals.map((signal, idx) => {
          const config = SIGNAL_CONFIG[signal.type] || SIGNAL_CONFIG.expansion;
          const Icon = config.icon;

          return (
            <div key={signal.id || idx} className="relative flex items-start gap-4">
              {/* Dot */}
              <div className={`absolute -left-[17px] w-3.5 h-3.5 rounded-full border-2 border-white ${config.dot} flex-shrink-0 mt-1`} />

              <div className="flex-1 bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-1.5 rounded-lg border ${config.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <Badge className={`text-xs mb-2 ${config.color}`}>
                        {config.label}
                      </Badge>
                      <p className="text-sm text-slate-700 leading-relaxed">{signal.description}</p>
                    </div>
                  </div>
                  {signal.date && (
                    <span className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0 mt-0.5">
                      {signal.date}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}