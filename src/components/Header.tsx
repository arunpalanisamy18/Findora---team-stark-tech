import { useState } from 'react';
import {
  Search,
  PlusCircle,
  Menu,
  X,
  User,
  LogOut,
  LogIn,
  Sun,
  Moon,
  Clock,
  Shield,
} from 'lucide-react';
import type { HealthStatus, AuthUser } from '../types/index.js';

interface HeaderProps {
  activePortal: 'consumer' | 'admin';
  onSelectPortal: (portal: 'consumer' | 'admin') => void;
  activeConsumerTab: 'browse' | 'activity';
  onSelectConsumerTab: (tab: 'browse' | 'activity') => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenReport: (defaultType: 'lost' | 'found') => void;
  health: HealthStatus | null;
  healthLoading: boolean;
  onRefreshHealth: () => void;
  currentUser: AuthUser | null;
  onOpenAuth: () => void;
  onSignOut: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activePortal,
  onSelectPortal,
  activeConsumerTab,
  onSelectConsumerTab,
  theme,
  onToggleTheme,
  onOpenReport,
  health,
  healthLoading: _healthLoading,
  onRefreshHealth: _onRefreshHealth,
  currentUser,
  onOpenAuth,
  onSignOut,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isHealthy = health?.status === 'healthy';
  const isAdmin = currentUser?.role === 'admin';

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm transition-colors">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Main Portal Links */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2.5 py-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-600 text-white font-bold text-lg shadow-xs select-none">
              F
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Findora</span>
              <span className="hidden sm:inline-block ml-2 text-xs font-medium text-slate-500 dark:text-slate-400 border-l border-slate-200 dark:border-slate-800 pl-2">
                {isAdmin ? 'Staff Administration' : 'University Lost & Found'}
              </span>
            </div>
          </div>

          {/* Desktop Nav Tabs (Only for Students / Consumers) */}
          {!isAdmin && (
            <nav className="hidden md:flex items-center gap-1.5 ml-2" aria-label="Main Navigation">
              <button
                type="button"
                onClick={() => onSelectConsumerTab('browse')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  activeConsumerTab === 'browse'
                    ? 'bg-amber-100/80 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Search className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" />
                <span>Explore Directory</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectConsumerTab('activity')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  activeConsumerTab === 'activity'
                    ? 'bg-amber-100/80 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Clock className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" />
                <span>My Activity &amp; Claims</span>
              </button>
            </nav>
          )}

          {isAdmin && (
            <div className="hidden md:flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                <Shield className="h-3.5 w-3.5 text-amber-600" />
                <span>Command Center</span>
              </span>
            </div>
          )}
        </div>

        {/* Right Actions: Theme Toggle, User Auth & CTA */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Light / Dark Mode Toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'black'} theme`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'black'} theme`}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-slate-600" />
            )}
          </button>

          {/* Quick Report CTA (Consumer portal only) */}
          {!isAdmin && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenReport('lost')}
                className="btn btn-outline text-xs py-1.5 px-3"
              >
                Report Lost
              </button>
              <button
                type="button"
                onClick={() => onOpenReport('found')}
                className="btn btn-primary text-xs py-1.5 px-3"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Report Found</span>
              </button>
            </div>
          )}

          {/* User Auth Section */}
          {currentUser ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <User className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                <span className="font-medium max-w-[120px] truncate" title={currentUser.email}>
                  {currentUser.name}
                </span>
                {currentUser.role === 'admin' && (
                  <span className="text-[10px] uppercase font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                    Admin
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={onSignOut}
                title="Sign Out"
                className="btn btn-outline text-xs py-1.5 px-2.5 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden lg:inline text-xs">Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="btn btn-primary text-xs py-1.5 px-3"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>

        {/* Mobile menu and theme toggle */}
        <div className="flex sm:hidden items-center gap-2">
          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-3 pb-4 space-y-3 shadow-lg">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500">System Status</span>
            <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  isHealthy ? 'bg-emerald-500' : 'bg-red-500'
                }`}
              />
              <span>{isHealthy ? 'API Online' : 'API Offline'}</span>
            </div>
          </div>

          {/* User Auth Status */}
          <div className="pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            {currentUser ? (
              <div className="flex items-center justify-between w-full">
                <div className="text-xs">
                  <p className="font-semibold text-slate-900 dark:text-white">{currentUser.name}</p>
                  <p className="text-slate-500 text-[11px]">{currentUser.email}</p>
                </div>
                <button
                  onClick={() => {
                    onSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="btn btn-outline text-xs py-1 px-2.5 text-red-600"
                >
                  <LogOut className="h-3 w-3 mr-1" />
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  onOpenAuth();
                  setMobileMenuOpen(false);
                }}
                className="btn btn-primary text-xs py-1.5 w-full justify-center"
              >
                <LogIn className="h-3.5 w-3.5 mr-1" />
                Sign In / Register
              </button>
            )}
          </div>

          {/* Navigation Links for Mobile */}
          {!isAdmin ? (
            <>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    onSelectPortal('consumer');
                    onSelectConsumerTab('browse');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md ${
                    activePortal === 'consumer' && activeConsumerTab === 'browse'
                      ? 'bg-amber-50 dark:bg-amber-950 text-amber-900 dark:text-amber-200 font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Search className="h-4 w-4 text-amber-600" />
                  <span>Explore Directory</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onSelectPortal('consumer');
                    onSelectConsumerTab('activity');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md ${
                    activePortal === 'consumer' && activeConsumerTab === 'activity'
                      ? 'bg-amber-50 dark:bg-amber-950 text-amber-900 dark:text-amber-200 font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span>My Activity &amp; Claims</span>
                </button>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onOpenReport('lost');
                    setMobileMenuOpen(false);
                  }}
                  className="btn btn-outline text-xs py-2 w-full justify-center"
                >
                  Report Lost
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onOpenReport('found');
                    setMobileMenuOpen(false);
                  }}
                  className="btn btn-primary text-xs py-2 w-full justify-center"
                >
                  Report Found
                </button>
              </div>
            </>
          ) : (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-900 dark:text-amber-200">
              <span className="font-semibold">Security Command Center Session</span>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                Logged in as Campus Administrator. Authorized staff functions are accessible on the main dashboard.
              </p>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
