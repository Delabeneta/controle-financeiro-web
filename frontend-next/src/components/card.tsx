// src/components/Card.tsx
'use client';

import React from 'react';
import { cn } from '@/src/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className, onClick }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl shadow-sm border border-gray-200 p-6',
        onClick && 'cursor-pointer hover:shadow-md transition-shadow duration-200',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'red' | 'purple';
}

export function StatCard({ title, value, icon, color = 'blue' }: StatCardProps) {
  const colorStyles = {
    blue: 'text-[#1A2B4C] bg-blue-50',
    green: 'text-[#10B981] bg-green-50',
    red: 'text-[#EF4444] bg-red-50',
    purple: 'text-purple-600 bg-purple-50',
  };
  
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
        {icon && (
          <div className={cn('p-3 rounded-lg', colorStyles[color])}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}