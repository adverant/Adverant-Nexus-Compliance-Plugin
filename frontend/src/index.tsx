/**
 * Nexus Compliance Plugin - Frontend Entry Point
 *
 * This is a standalone plugin UI that can be mounted into the Nexus platform.
 * It provides compliance management capabilities including:
 * - Dashboard with KPIs and risk overview
 * - Control Library with 688+ controls across 6 frameworks
 * - Cross-Framework Analysis with mapping heatmaps
 * - Trustworthiness Assessment based on 7 EU AI Requirements
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Pages
import ComplianceDashboard from './pages/ComplianceDashboard';
import ControlLibrary from './pages/ControlLibrary';
import CrossFrameworkAnalysis from './pages/CrossFrameworkAnalysis';
import TrustworthinessAssessment from './pages/TrustworthinessAssessment';

// Layout
import { PluginLayout } from './components/PluginLayout';

// Styles
import './styles/globals.css';

// Query client for data fetching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

/**
 * Plugin Configuration - Used by Nexus Plugin Loader
 */
export const pluginConfig = {
  id: 'compliance',
  name: 'Enterprise Compliance Engine',
  version: '1.0.0',
  routes: [
    { path: '/', component: ComplianceDashboard, label: 'Dashboard' },
    { path: '/controls', component: ControlLibrary, label: 'Control Library' },
    { path: '/cross-framework', component: CrossFrameworkAnalysis, label: 'Cross-Framework Analysis' },
    { path: '/trustworthiness', component: TrustworthinessAssessment, label: 'Trustworthiness Assessment' },
  ],
  menuEntry: {
    label: 'Compliance',
    icon: 'ShieldCheck',
    position: 'primary',
  },
};

/**
 * Export individual components for plugin loader
 */
export {
  ComplianceDashboard,
  ControlLibrary,
  CrossFrameworkAnalysis,
  TrustworthinessAssessment,
};

/**
 * Standalone App - For development and standalone deployment
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename="/plugins/compliance">
        <PluginLayout>
          <Routes>
            <Route index element={<ComplianceDashboard />} />
            <Route path="controls" element={<ControlLibrary />} />
            <Route path="cross-framework" element={<CrossFrameworkAnalysis />} />
            <Route path="trustworthiness" element={<TrustworthinessAssessment />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </PluginLayout>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

/**
 * Mount function for Nexus Plugin Loader
 */
export function mount(container: HTMLElement, props?: { basePath?: string }) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter basename={props?.basePath || '/plugins/compliance'}>
          <Routes>
            <Route index element={<ComplianceDashboard />} />
            <Route path="controls" element={<ControlLibrary />} />
            <Route path="cross-framework" element={<CrossFrameworkAnalysis />} />
            <Route path="trustworthiness" element={<TrustworthinessAssessment />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </React.StrictMode>
  );
  return root;
}

/**
 * Unmount function for cleanup
 */
export function unmount(root: ReturnType<typeof createRoot>) {
  root.unmount();
}

// Standalone rendering when not loaded as a plugin
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

export default App;