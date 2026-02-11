import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "./utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Menu, X, Database, BookOpen, FileText, Shield, LogOut, RefreshCw } from "lucide-react";

export default function Layout({ children }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      console.error("Error loading user:", error);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  const isActive = (pageName) => {
    return location.pathname === createPageUrl(pageName).replace(/\?.*$/, '');
  };

  const navItems = [
    { name: "Saved Targets", path: "SavedTargets", icon: Database },
    { name: "Ops Console", path: "OpsConsole", icon: Database },
  ];

  // Add admin-only items
  if (user?.role === "admin") {
    navItems.push({ name: "Data Refresh", path: "DataRefresh", icon: RefreshCw });
    navItems.push({ name: "Documentation", path: "Documentation", icon: BookOpen });
  }

  const footerLinks = [
    { name: "Privacy Policy", path: "PrivacyPolicy", icon: Shield },
    { name: "Terms of Service", path: "TermsOfService", icon: FileText },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to={createPageUrl("SavedTargets")} className="flex items-center gap-3">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6914b46d39cf2944cbc25c62/f8da923e2_image.png" 
                alt="Deal Radar Logo" 
                className="w-10 h-10 object-contain"
              />
              <span className="text-xl font-bold text-slate-900">Deal Radar</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={createPageUrl(item.path)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive(item.path)
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
              
              {user && (
                <div className="flex items-center gap-4 pl-4 border-l border-slate-200">
                  <div className="text-sm">
                    <div className="font-medium text-slate-900">{user.full_name}</div>
                    <div className="text-xs text-slate-500">{user.email}</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </Button>
                </div>
              )}
            </nav>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-slate-200">
              <nav className="flex flex-col gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={createPageUrl(item.path)}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                        isActive(item.path)
                          ? "bg-emerald-50 text-emerald-700"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.name}
                    </Link>
                  );
                })}
                
                {user && (
                  <div className="pt-4 mt-4 border-t border-slate-200">
                    <div className="px-3 py-2 text-sm">
                      <div className="font-medium text-slate-900">{user.full_name}</div>
                      <div className="text-xs text-slate-500">{user.email}</div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLogout}
                      className="w-full mt-2 gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </Button>
                  </div>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-8rem)]">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-slate-600">
              © {new Date().getFullYear()} Deal Radar. All rights reserved.
            </div>
            <div className="flex gap-6">
              {footerLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.path}
                    to={createPageUrl(link.path)}
                    className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
                  >
                    <Icon className="w-3 h-3" />
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}