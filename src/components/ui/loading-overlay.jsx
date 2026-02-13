import React from "react";
import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export function LoadingOverlay({ message, progress }) {
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center gap-3 mb-4">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          <span className="font-medium">{message}</span>
        </div>
        {progress && progress.total > 0 && (
          <div className="space-y-2">
            <Progress value={(progress.current / progress.total) * 100} className="w-full" />
            <div className="text-sm text-slate-600 text-center">
              {progress.current} / {progress.total} completed
            </div>
            {progress.step && (
              <div className="text-xs text-slate-500 text-center italic">
                {progress.step}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}