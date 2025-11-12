import React, { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function OAuthCallback() {
  useEffect(() => {
    // Extract code from URL
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const error = params.get("error");

    if (error) {
      // Handle OAuth error
      if (window.opener) {
        window.opener.postMessage({ 
          type: "outreach-oauth-error", 
          error 
        }, window.location.origin);
      }
      window.close();
    } else if (code) {
      // Send code to parent window
      if (window.opener) {
        window.opener.postMessage({ 
          type: "outreach-oauth-success", 
          code 
        }, window.location.origin);
      }
      // Close the popup after a short delay
      setTimeout(() => {
        window.close();
      }, 1000);
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">
          Completing Authorization...
        </h2>
        <p className="text-slate-600">
          You can close this window if it doesn't close automatically.
        </p>
      </div>
    </div>
  );
}