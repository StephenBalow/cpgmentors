'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Check, Clock, Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useBreadcrumbs } from '@/components/breadcrumb-context';

interface Module {
  id: string;
  number: number;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'not-started';
  duration: string;
  progress?: { current: number; total: number };
}

const modules: Module[] = [
  {
    id: 'medical-screening',
    number: 1,
    title: 'Medical Screening (Red Flags)',
    description:
      'Learn to identify serious pathology requiring immediate referral',
    status: 'completed',
    duration: '15 min',
  },
  {
    id: 'classification',
    number: 2,
    title: 'Classification & Clinical Tests',
    description:
      'Master the classification system and key examination techniques',
    status: 'in-progress',
    duration: '20 min',
    progress: { current: 3, total: 5 },
  },
  {
    id: 'stage-determination',
    number: 3,
    title: 'Stage Determination',
    description: 'Determine acute, subacute, or chronic presentation staging',
    status: 'not-started',
    duration: '15 min',
  },
  {
    id: 'treatment-recommendations',
    number: 4,
    title: 'Treatment Recommendations',
    description:
      'Apply evidence-based interventions matched to patient classification',
    status: 'not-started',
    duration: '25 min',
  },
];

function ModuleCard({ module, cpgSlug }: { module: Module; cpgSlug: string }) {
  const isLocked = module.status === 'not-started';

  return (
    <Link href={`/cpg/${cpgSlug}/training/${module.id}`}>
      <Card
        className={cn(
          'group cursor-pointer border-border bg-card transition-all hover:border-primary/30 hover:shadow-md',
          isLocked && 'opacity-75'
        )}
      >
        <CardContent className="flex items-center gap-5 p-5">
          {/* Module Number */}
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
              module.status === 'completed' &&
                'bg-emerald-100 text-emerald-700',
              module.status === 'in-progress' && 'bg-primary/10 text-primary',
              module.status === 'not-started' &&
                'bg-muted text-muted-foreground'
            )}
          >
            {module.status === 'completed' ? (
              <Check className="h-5 w-5" />
            ) : (
              module.number
            )}
          </div>

          {/* Module Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-foreground">{module.title}</h3>
              {isLocked && (
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {module.description}
            </p>
          </div>

          {/* Status & Duration */}
          <div className="flex shrink-0 items-center gap-4">
            {/* Progress indicator for in-progress */}
            {module.status === 'in-progress' && module.progress && (
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{
                      width: `${
                        (module.progress.current / module.progress.total) * 100
                      }%`,
                    }}
                  />
                </div>
                <span className="text-xs font-medium text-primary">
                  {module.progress.current}/{module.progress.total}
                </span>
              </div>
            )}

            {/* Status badge */}
            <span
              className={cn(
                'rounded-full px-2.5 py-1 text-xs font-medium',
                module.status === 'completed' &&
                  'bg-emerald-100 text-emerald-700',
                module.status === 'in-progress' && 'bg-primary/10 text-primary',
                module.status === 'not-started' &&
                  'bg-muted text-muted-foreground'
              )}
            >
              {module.status === 'completed' && 'Completed'}
              {module.status === 'in-progress' && 'In Progress'}
              {module.status === 'not-started' && 'Not Started'}
            </span>

            {/* Duration */}
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>{module.duration}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function TrainingPage() {
  const params = useParams();
  const slug = params.slug as string;
  const displayName = slug.replace(/-/g, ' ');
  const { setBreadcrumbs } = useBreadcrumbs();

  const completedCount = modules.filter((m) => m.status === 'completed').length;
  const totalCount = modules.length;

  useEffect(() => {
    setBreadcrumbs([
      { label: 'My CPGs', href: '/my-cpgs' },
      { label: displayName, href: `/cpg/${slug}` },
      { label: 'Training' },
    ]);
  }, [displayName, slug, setBreadcrumbs]);

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold capitalize text-foreground">
          {displayName} CPG Training
        </h1>
        <p className="mt-1 text-muted-foreground">
          Master the APTA 2017 Clinical Practice Guideline
        </p>

        {/* Overall Progress */}
        <div className="mt-4 flex items-center gap-3">
          <div className="h-2 max-w-xs flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            />
          </div>
          <span className="text-sm text-muted-foreground">
            {completedCount} of {totalCount} modules complete
          </span>
        </div>
      </div>

      {/* Module Cards */}
      <div className="flex flex-col gap-4">
        {modules.map((module) => (
          <ModuleCard key={module.id} module={module} cpgSlug={slug} />
        ))}
      </div>
    </div>
  );
}
