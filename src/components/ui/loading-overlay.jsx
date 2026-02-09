import React from "react";
import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export function LoadingOverlay({ message, progress }) {
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          <span className="font-medium">{message}</span>
        </div>
        {progress && (
          <>
            <Progress value={(progress.current / progress.total) * 100} className="w-64" />
            <div className="text-sm text-slate-600 mt-2 text-center">
              {progress.current} / {progress.total}
            </div>
          </>
        )}
      </div>
    </div>
  );
}