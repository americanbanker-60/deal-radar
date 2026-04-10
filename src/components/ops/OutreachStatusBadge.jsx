import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

/**
 * Small status badge showing whether Outreach is connected.
 * If not connected, clicking it starts the OAuth flow directly.
 */
export default function OutreachStatusBadge({ currentPage }) {
  const [connected, setConnected] = useState(null); // null = loading
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const user = await base44.auth.me();
        const connections = await base44.entities.OutreachConnection.list();
        const match = connections.find(c => c.user_email === user.email && c.status === "connected");
        setConnected(!!match);
      } catch {
        setConnected(false);
      }
    };
    check();
  }, []);

  if (connected === null) return null;

  if (connected) {
    return (
      <Badge className="bg-green-100 text-green-700 border border-green-200 gap-1 self-center">
        <CheckCircle2 className="w-3 h-3" />
        Outreach Connected
      </Badge>
    );
  }

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const result = await base44.functions.invoke('outreachInitAuth', {});
      const authUrl = result.data.authUrl;
      if (!authUrl || !authUrl.startsWith('https://')) {
        throw new Error("Invalid authorization URL received.");
      }
      sessionStorage.setItem('oauth_return_page', currentPage || 'OpsConsole');
      window.location.href = authUrl;
    } catch (error) {
      alert("Failed to connect Outreach: " + error.message);
      setConnecting(false);
    }
  };

  return (
    <button onClick={handleConnect} disabled={connecting}>
      <Badge className="bg-slate-100 text-slate-500 border border-slate-200 gap-1 self-center cursor-pointer hover:bg-slate-200 transition-colors">
        {connecting ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <XCircle className="w-3 h-3" />
        )}
        {connecting ? "Connecting..." : "Outreach Not Connected"}
      </Badge>
    </button>
  );
}
