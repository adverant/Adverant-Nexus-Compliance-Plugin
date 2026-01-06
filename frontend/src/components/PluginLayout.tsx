/**
 * Plugin Layout Component
 *
 * Provides the layout structure for the compliance plugin UI.
 * Includes navigation sidebar and content area.
 */

import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Library,
  GitCompare,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../lib/utils';

interface PluginLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  {
    name: 'Dashboard',
    href: '',
    icon: LayoutDashboard,
    description: 'Overview of compliance posture',
  },
  {
    name: 'Control Library',
    href: 'controls',
    icon: Library,
    description: '688+ controls across 6 frameworks',
  },
  {
    name: 'Cross-Framework',
    href: 'cross-framework',
    icon: GitCompare,
    description: 'Compare and analyze control mappings',
  },
  {
    name: 'Trustworthiness',
    href: 'trustworthiness',
    icon: ShieldCheck,
    description: 'AI assessment based on 7 EU requirements',
  },
];

export function PluginLayout({ children }: PluginLayoutProps) {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r bg-card flex flex-col">
        {/* Plugin Header */}
        <div className="h-16 flex items-center px-6 border-b">
          <ShieldCheck className="h-8 w-8 text-primary" />
          <div className="ml-3">
            <h1 className="text-lg font-bold">Compliance</h1>
            <p className="text-xs text-muted-foreground">Enterprise Engine</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive =
              location.pathname === `/plugins/compliance/${item.href}` ||
              (item.href === '' && location.pathname === '/plugins/compliance');

            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors group',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="truncate">{item.name}</div>
                  <div
                    className={cn(
                      'text-xs truncate',
                      isActive ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    )}
                  >
                    {item.description}
                  </div>
                </div>
                <ChevronRight
                  className={cn(
                    'h-4 w-4 shrink-0 transition-transform',
                    isActive ? 'rotate-90' : 'opacity-0 group-hover:opacity-100'
                  )}
                />
              </NavLink>
            );
          })}
        </nav>

        {/* Plugin Info Footer */}
        <div className="p-4 border-t">
          <div className="text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Version</span>
              <span className="font-mono">1.0.0</span>
            </div>
            <div className="flex justify-between mt-1">
              <span>Frameworks</span>
              <span className="font-mono">6</span>
            </div>
            <div className="flex justify-between mt-1">
              <span>Controls</span>
              <span className="font-mono">688+</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="h-full">{children}</div>
      </main>
    </div>
  );
}