import React, { useEffect, useState } from "react";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "../utils";

export default function OAuthCallback() {
  const [status, setStatus] = useState("processing");
  const [message, setMessage] = useState("Completing authorization...");

  useEffect(() => {
    const handleAuth = async () => {
      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));

      const code = params.get("code") || hashParams.get("code");
      const error = params.get("error") || hashParams.get("error");

      if (error) {
        setStatus("error");
        setMessage(`OAuth error: ${error}`);
        return;
      }

      if (!code) {
        setStatus("error");
        setMessage("No authorization code received. Please check your Outreach OAuth app settings.");
        return;
      }

      setMessage("Exchanging code for access token...");

      try {
        let result;
        try {
          result = await base44.functions.invoke('outreachCompleteAuth', { code });
        } catch (invokeErr) {
          const detail = invokeErr.response?.data?.error || invokeErr.response?.data?.hint || invokeErr.message;
          throw new Error(detail);
        }

        if (result.data.success) {
          setStatus("success");
          setMessage("Connected to Outreach! Redirecting...");

          // Redirect back to the page the user was on before OAuth
          setTimeout(() => {
            const returnPage = sessionStorage.getItem('oauth_return_page') || 'OpsConsole';
            sessionStorage.removeItem('oauth_return_page');
            // Signal to the next page that OAuth just succeeded
            sessionStorage.setItem('outreach_just_connected', 'true');
            window.location.href = createPageUrl(returnPage);
          }, 1500);
        } else {
          throw new Error(result.data.error || "Unknown error");
        }
      } catch (error) {
        setStatus("error");
        setMessage("Failed to complete authorization: " + error.message);
      }
    };

    handleAuth();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="text-center max-w-md w-full">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
               style={{
                 backgroundColor: status === "success" ? "#10b981" : status === "error" ? "#ef4444" : "#3b82f6"
               }}>
            {status === "processing" && <Loader2 className="w-8 h-8 text-white animate-spin" />}
            {status === "success" && <CheckCircle2 className="w-8 h-8 text-white" />}
            {status === "error" && <XCircle className="w-8 h-8 text-white" />}
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            {status === "processing" && "Connecting..."}
            {status === "success" && "Success!"}
            {status === "error" && "Error"}
          </h2>
          <p className="text-slate-600 mb-4">
            {message}
          </p>

          {status === "error" && (
            <div className="space-y-3">
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-left">
                <div className="text-sm text-red-800 space-y-1">
                  <strong>Troubleshooting:</strong>
                  <ul className="list-disc ml-4 mt-1 space-y-1">
                    <li>Check that your Outreach OAuth app is set as "Web Application"</li>
                    <li>Verify the Redirect URI is exactly: <code className="text-xs bg-white px-1 rounded">https://deal-radar.base44.app/OAuthCallback</code></li>
                    <li>Ensure scopes include: prospects.all, sequences.read</li>
                  </ul>
                </div>
              </div>
              <a
                href={createPageUrl(sessionStorage.getItem('oauth_return_page') || 'OpsConsole')}
                className="inline-block text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Go Back
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
