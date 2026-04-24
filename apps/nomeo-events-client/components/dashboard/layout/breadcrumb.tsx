'use client';

import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { Home04Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons';

interface BreadcrumbProps {
  pathname: string | null;
  menuItems?: Array<{ path: string; label: string }>;
}

export const Breadcrumb = ({ pathname, menuItems = [] }: BreadcrumbProps) => {
  if (!pathname) return null;

  // Split pathname into segments
  const segments = pathname.split('/').filter(Boolean);

  // Build breadcrumb items
  const breadcrumbs = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    const isLast = index === segments.length - 1;
    const prevSegment = index > 0 ? segments[index - 1] : '';
    const nextSegment = index < segments.length - 1 ? segments[index + 1] : '';
    
    // Check if current segment is a dynamic ID
    const isDynamicId = /^[0-9a-fA-F]{24}$/.test(segment) || // MongoDB ObjectId
                        /^\d+$/.test(segment) || // Numeric ID
                        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment); // UUID

    let label = '';

    // Handle dynamic ID segments
    if (isDynamicId) {
      // Check if this is an edit route (create-event/:id)
      if (prevSegment === 'create-event') {
        label = 'Edit Event';
      } 
      // Check if this is a view details route (events/:id)
      else if (prevSegment === 'events') {
        label = 'Event Details';
      }
      // Default fallback
      else {
        label = `ID: ${segment.slice(0, 8)}...`;
      }
    } 
    // Handle regular segments
    else {
      // Try to find a matching label from menuItems
      const menuItem = menuItems.find(item => 
        item.path === href || item.path === `/${segment}`
      );
      
      label = menuItem?.label || 
        segment
          .replace(/-/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase());
    }

    // Special case overrides for specific segments
    const specialCases: Record<string, string> = {
      'dashboard': 'Dashboard',
      'events': 'Events',
      'create-event': 'Create Event',
      'edit': 'Edit',
      'view': 'View',
    };

    if (specialCases[segment]) {
      label = specialCases[segment];
    }

    return {
      href,
      label,
      isLast,
      isDynamic: isDynamicId,
    };
  });

  return (
    <nav className="mb-6 flex items-center text-sm" aria-label="Breadcrumb">
      <div className="flex items-center space-x-2 text-muted-foreground">
        {/* Home */}
        <Link 
          href="/" 
          className="hover:text-foreground transition-colors flex items-center gap-1.5"
        >
          <HugeiconsIcon icon={Home04Icon} className="w-4 h-4" />
          Home
        </Link>

        {breadcrumbs.map((crumb, index) => (
          <div key={index} className="flex items-center">
            <HugeiconsIcon 
              icon={ArrowRight01Icon} 
              className="w-4 h-4 mx-2 text-muted-foreground" 
            />
            
            {crumb.isLast ? (
              <span className="font-medium text-foreground">
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="hover:text-foreground transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </div>
        ))}
      </div>
    </nav>
  );
};