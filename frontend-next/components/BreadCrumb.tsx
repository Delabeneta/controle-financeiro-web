// src/components/Breadcrumb.tsx
'use client';

import React from 'react';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-2 text-xs md:text-sm overflow-x-auto scrollbar-hide">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        
        return (
          <React.Fragment key={index}>
            {item.path && !isLast ? (
              <Link
                href={item.path}
                className="text-gray-500 hover:text-gray-700 transition-colors whitespace-nowrap"
              >
                {item.label}
              </Link>
            ) : (
              <span className={`${isLast ? 'text-gray-900 font-medium' : 'text-gray-500'} whitespace-nowrap`}>
                {item.label}
              </span>
            )}
            {!isLast && <ChevronRight className="w-3 h-3 md:w-4 md:h-4 text-gray-400 flex-shrink-0" />}
          </React.Fragment>
        );
      })}
    </nav>
  );
}