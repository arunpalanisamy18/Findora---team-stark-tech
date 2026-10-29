import { useEffect, useState, useCallback } from 'react';
import './style.css';
import type { Item, ItemFilters, HealthStatus, AuthUser } from './types/index.js';
import { getItems, getHealth, getStoredUser, getMe, logout } from './services/api.js';
import { Header } from './components/Header.js';
import { BrowseView } from './components/BrowseView.js';
import { ConsumerActivityView } from './components/ConsumerActivityView.js';
import { AdminView } from './components/AdminView.js';
import { ItemDetailModal } from './components/ItemDetailModal.js';
import { ReportModal } from './components/ReportModal.js';
import { ClaimModal } from './components/ClaimModal.js';
import { AuthModal } from './components/AuthModal.js';

export default function App() {
  // Theme State: 'light' | 'dark'
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('findora_theme');
      if (saved === 'light' || saved === 'dark') return saved;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    try {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.removeAttribute('data-theme');
      }
      localStorage.setItem('findora_theme', theme);
    } catch {
      // Ignore
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Portals: 'consumer' (students/public) vs 'admin' (campus staff)
  const [activePortal, setActivePortal] = useState<'consumer' | 'admin'>('consumer');
  const [activeConsumerTab, setActiveConsumerTab] = useState<'browse' | 'activity'>('browse');

  // Auth State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => getStoredUser());
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'register'>('signin');
  const [authModalMessage, setAuthModalMessage] = useState<string | undefined>(undefined);

  // Synchronize portal with role: Admins are locked exclusively to 'admin', students to 'consumer'
  useEffect(() => {
    if (currentUser?.role === 'admin') {
      setActivePortal('admin');
    } else {
      setActivePortal('consumer');
    }
  }, [currentUser]);

  // Backend Health
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);

  // Items State (Directory)
  const [items, setItems] = useState<Item[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ItemFilters>({
    search: '',
    category: '',
    type: '',
    status: '',
    page: 1,
    limit: 50,
  });

  // Modals
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<Item | null>(null);
  const [itemDetailHideClaim, setItemDetailHideClaim] = useState(false);
  const [selectedItemForClaim, setSelectedItemForClaim] = useState<Item | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportDefaultType, setReportDefaultType] = useState<'lost' | 'found'>('lost');

  // Check health
  const checkBackendHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const status = await getHealth();
      setHealth(status);
    } catch {
      setHealth(null);
    } finally {
      setHealthLoading(false);
    }
  }, []);

  // Fetch Items
  const fetchItems = useCallback(async (currentFilters: ItemFilters) => {
    setItemsLoading(true);
    setItemsError(null);
    try {
      const res = await getItems(currentFilters);
      setItems(res.data);
      setTotalCount(res.meta.total);
    } catch (err: any) {
      setItemsError(
        err.message || 'Unable to connect to Findora backend. Please ensure the server is running.'
      );
    } finally {
      setItemsLoading(false);
    }
  }, []);

  // Check user session
  useEffect(() => {
    if (getStoredUser()) {
      getMe()
        .then((user) => setCurrentUser(user))
        .catch(() => {
          logout();
          setCurrentUser(null);
        });
    }
  }, []);

  // Initial load
  useEffect(() => {
    checkBackendHealth();
    fetchItems(filters);
  }, []);

  // Handle filter changes
  const handleFilterChange = (newFilters: ItemFilters) => {
    setFilters(newFilters);
    fetchItems(newFilters);
  };

  // Auth triggers
  const handleOpenAuth = (mode: 'signin' | 'register' = 'signin', message?: string) => {
    setAuthModalMode(mode);
    setAuthModalMessage(message);
    setAuthModalOpen(true);
  };

  const handleSignOut = () => {
    logout();
    setCurrentUser(null);
    setActivePortal('consumer');
    setActiveConsumerTab('browse');
  };

  // Open Report Modal
  const handleOpenReport = (type: 'lost' | 'found') => {
    setReportDefaultType(type);
    setReportModalOpen(true);
  };

  // When report is created successfully
  const handleReportCreated = (createdItem: Item) => {
    setItems((prev) => [createdItem, ...prev]);
    setTotalCount((c) => c + 1);
  };

  // When claim is created successfully
  const handleClaimCreated = () => {
    fetchItems(filters);
  };

  // When item is updated via admin view or activity view
  const handleItemUpdated = () => {
    fetchItems(filters);
  };

  return (
    <div className="min-h-svh bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased selection:bg-amber-100 selection:text-amber-900 transition-colors">
      {/* Global Header */}
      <Header
        activePortal={activePortal}
        onSelectPortal={setActivePortal}
        activeConsumerTab={activeConsumerTab}
        onSelectConsumerTab={setActiveConsumerTab}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenReport={handleOpenReport}
        health={health}
        healthLoading={healthLoading}
        onRefreshHealth={checkBackendHealth}
        currentUser={currentUser}
        onOpenAuth={() => handleOpenAuth('signin')}
        onSignOut={handleSignOut}
      />

      {/* Main Container */}
      <main className="container flex-1 py-8 px-4 sm:px-6 lg:px-8">
        {activePortal === 'consumer' ? (
          activeConsumerTab === 'browse' ? (
            <BrowseView
              items={items}
              totalCount={totalCount}
              loading={itemsLoading}
              error={itemsError}
              filters={filters}
              onFilterChange={handleFilterChange}
              onRefresh={() => fetchItems(filters)}
              onViewItem={(item) => {
                setItemDetailHideClaim(false);
                setSelectedItemForDetail(item);
              }}
              onClaimItem={(item) => setSelectedItemForClaim(item)}
              onOpenReport={handleOpenReport}
            />
          ) : (
            <ConsumerActivityView
              currentUser={currentUser}
              onOpenAuth={() => handleOpenAuth('signin', 'Sign in to access your personal reports and claim status')}
              onViewItem={(item, hide) => {
                setItemDetailHideClaim(Boolean(hide));
                setSelectedItemForDetail(item);
              }}
              onOpenReport={handleOpenReport}
            />
          )
        ) : (
          <AdminView
            onItemUpdated={handleItemUpdated}
            currentUser={currentUser}
            onLoginSuccess={(user) => setCurrentUser(user)}
          />
        )}
      </main>

      {/* Modals */}
      {selectedItemForDetail && (
        <ItemDetailModal
          item={selectedItemForDetail}
          hideClaimAction={itemDetailHideClaim}
          onClose={() => setSelectedItemForDetail(null)}
          onClaimItem={(item) => {
            setSelectedItemForDetail(null);
            setSelectedItemForClaim(item);
          }}
          onSelectAnotherItem={(anotherItem) => {
            setSelectedItemForDetail(anotherItem);
          }}
        />
      )}

      {selectedItemForClaim && (
        <ClaimModal
          item={selectedItemForClaim}
          onClose={() => setSelectedItemForClaim(null)}
          onSuccess={() => {
            handleClaimCreated();
          }}
          currentUser={currentUser}
          onOpenAuth={() => handleOpenAuth('signin', 'Sign in or register to submit ownership claims')}
        />
      )}

      {reportModalOpen && (
        <ReportModal
          initialType={reportDefaultType}
          onClose={() => setReportModalOpen(false)}
          onSuccess={(created) => {
            handleReportCreated(created);
            // If it is a found item, immediately close the modal and return to current page
            if (created.type === 'found') {
              setReportModalOpen(false);
            }
          }}
          onInspectMatches={(created) => {
            setReportModalOpen(false);
            // Only inspect candidate matches for lost items
            if (created.type === 'lost') {
              setSelectedItemForDetail(created);
            }
          }}
          currentUser={currentUser}
          onOpenAuth={() => handleOpenAuth('signin', 'Sign in or register to report lost or found items')}
        />
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
        message={authModalMessage}
        onSuccess={(user) => {
          setCurrentUser(user);
          if (user.role === 'admin') {
            setActivePortal('admin');
          }
        }}
      />

      {/* Global Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 mt-auto py-8 transition-colors">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">Findora</span>
              <span>&mdash; Smart Lost &amp; Found Management Platform</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span>Student &amp; Staff Portals</span>
              <span>&bull;</span>
              <span>Photo Verification</span>
              <span>&bull;</span>
              <span>Light &amp; Dark Theme</span>
              <span>&bull;</span>
              <span>MongoDB Full-Stack</span>
            </div>

            <div>
              <span>Verified Claims &bull; Algorithmic Item Matching</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
