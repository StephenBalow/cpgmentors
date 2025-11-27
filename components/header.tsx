'use client';

import { ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';
import { useBreadcrumbs } from '@/components/breadcrumb-context';

interface HeaderProps {
  userInitials?: string;
}

export function Header({ userInitials = 'JD' }: HeaderProps) {
  const { breadcrumbs } = useBreadcrumbs();

  return (
    <header className="fixed left-0 right-0 top-0 z-50 flex h-[60px] items-center justify-between border-b border-border bg-card px-6">
      {/* Logo */}
      <Link
        href="/my-cpgs"
        className="text-lg font-semibold tracking-tight text-slate-700 hover:text-slate-900"
      >
        CPGmentors
      </Link>

      {/* Breadcrumb Navigation */}
      <nav className="absolute left-48 flex items-center gap-1.5 text-sm">
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.label} className="flex items-center gap-1.5">
            {index > 0 && (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            {crumb.href ? (
              <Link
                href={crumb.href}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className="font-medium text-foreground">{crumb.label}</span>
            )}
          </div>
        ))}
      </nav>

      {/* User Avatar */}
      <Link href="/profile">
        <Avatar className="h-8 w-8 cursor-pointer transition-opacity hover:opacity-80">
          <AvatarFallback className="bg-primary text-xs font-medium text-primary-foreground">
            {userInitials}
          </AvatarFallback>
        </Avatar>
      </Link>
    </header>
  );
}
