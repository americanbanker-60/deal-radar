import React, { useState } from "react";
import { Drawer } from "vaul";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { X, Copy, Check, Sparkles, TrendingUp, Mail, ExternalLink, Loader2 } from "lucide-react";
import { createPageUrl } from "../../utils";

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      disabled={!text}
      className="flex items-center gap-1.5 h-7 text-xs"
    >
      {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied!" : "Copy"}
    </Button>
  );
}

function Section({ icon: Icon, title, color, children, copyText, badge }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${color}`} />
          <span className="font-semibold text-slate-800 text-sm">{title}</span>
          {badge}
        </div>
        <CopyButton text={copyText} />
      </div>
      <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700 leading-relaxed min-h-[60px]">
        {children}
      </div>
    </div>
  );
}

export default function TargetDrawer({ target, open, onClose, onGenerateRationale, isGeneratingRationale }) {
  if (!target) return null;

  return (
    <Drawer.Root direction="right" open={open} onOpenChange={(v) => !v && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Drawer.Content className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[500px] bg-white flex flex-col shadow-2xl">
          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50">
            <div className="flex-1 min-w-0 pr-3">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-slate-900 leading-tight">{target.name}</h2>
                {target.qualityTier && (
                  <Badge className={
                    target.qualityTier === "great" ? "bg-green-100 text-green-800 border-green-200 text-xs" :
                    target.qualityTier === "good" ? "bg-blue-100 text-blue-800 border-blue-200 text-xs" :
                    "bg-slate-100 text-slate-700 border-slate-200 text-xs"
                  }>
                    {target.qualityTier.toUpperCase()}
                  </Badge>
                )}
              </div>
              {target.correspondenceName && (
                <p className="text-xs text-slate-500 mt-0.5">{target.correspondenceName}</p>
              )}
              <p className="text-xs text-slate-500 mt-0.5">
                {[target.city, target.state].filter(Boolean).join(", ")}
                {target.sectorFocus && <> · {target.sectorFocus}</>}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4 text-slate-600" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* AI Investment Thesis */}
            <Section
              icon={Sparkles}
              title="AI Investment Thesis"
              color="text-indigo-600"
              copyText={target.strategicRationale}
            >
              {target.strategicRationale ? (
                <p>{target.strategicRationale}</p>
              ) : (
                <div className="flex flex-col items-start gap-2">
                  <p className="text-slate-400 italic text-xs">No thesis generated yet.</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onGenerateRationale(target)}
                    disabled={isGeneratingRationale}
                    className="text-xs h-7"
                  >
                    {isGeneratingRationale ? (
                      <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3 mr-1.5" />
                    )}
                    {isGeneratingRationale ? "Generating..." : "Generate Thesis"}
                  </Button>
                </div>
              )}
            </Section>

            <Separator />

            {/* Recent Growth Events */}
            <Section
              icon={TrendingUp}
              title="Recent Growth Events"
              color="text-green-600"
              copyText={target.growthSignals}
              badge={
                target.growthSignalsDate && (
                  <span className="text-xs text-slate-400">
                    checked {new Date(target.growthSignalsDate).toLocaleDateString()}
                  </span>
                )
              }
            >
              {target.growthSignals ? (
                <ul className="space-y-1.5">
                  {target.growthSignals.split(";").map((s, i) => s.trim() && (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                      <span>{s.trim()}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-400 italic text-xs">No growth signals detected yet. Use "Detect Growth Signals" from the bulk actions.</p>
              )}
            </Section>

            <Separator />

            {/* Draft Outreach Snippets */}
            <Section
              icon={Mail}
              title="Draft Outreach Snippet"
              color="text-blue-600"
              copyText={target.personalization_snippet}
            >
              {target.personalization_snippet ? (
                <p className="italic">"{target.personalization_snippet}"</p>
              ) : (
                <p className="text-slate-400 italic text-xs">No outreach snippet yet. Use "Personalize" from the bulk actions.</p>
              )}
            </Section>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 p-4 bg-slate-50">
            <a
              href={createPageUrl("TargetDetails") + `?id=${target.id}`}
              className="flex items-center justify-center gap-2 w-full text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View Full Details
            </a>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}