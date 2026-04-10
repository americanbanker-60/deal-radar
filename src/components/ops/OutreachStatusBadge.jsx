import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Link as LinkIcon } from "lucide-react";
import { createPageUrl } from "../../utils";

/**
 * Small status badge showing whether Outreach is connected.
 * If not connected, links to OpsConsole where the user can connect.
 */
export default function OutreachStatusBadge() {
  const [connected, setConnected] = useState(null); // null = loading

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

  if (connected === null) return null; // still loading

  if (connected) {
    return (
      <Badge className="bg-green-100 text-green-700 border border-green-200 gap-1 self-center">
        <CheckCircle2 className="w-3 h-3" />
        Outreach Connected
      </Badge>
    );
  }

  return (
    <a href={createPageUrl("OpsConsole")}>
      <Badge className="bg-slate-100 text-slate-500 border border-slate-200 gap-1 self-center cursor-pointer hover:bg-slate-200 transition-colors">
        <XCircle className="w-3 h-3" />
        Outreach Not Connected
      </Badge>
    </a>
  );
}
