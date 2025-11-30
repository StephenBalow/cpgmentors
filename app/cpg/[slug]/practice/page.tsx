'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Check, Clock, Play, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBreadcrumbs } from '@/components/breadcrumb-context';
import { createClient } from '@/lib/supabase/client';

// Database row type (matches patient_cases table)
interface PatientCaseRow {
  id: string;
  name: string;
  age: number;
  occupation: string | null;
  chief_complaint: string;
  duration: string | null;
  onset_type: string | null;
  mechanism_of_injury: string | null;
  difficulty_level: string | null;
  estimated_minutes: number | null;
  display_order: number | null;
  display_hints: string[] | null;
}

// UI display type (what the card needs)
interface PatientCase {
  id: string;
  name: string;
  age: number;
  avatar: string;
  complaint: string;
  hints: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  status: 'Not Started' | 'In Progress' | 'Completed';
  duration: string;
}

// Transform database row to UI display format
function transformToPatientCase(row: PatientCaseRow): PatientCase {
  // Generate avatar from initials
  const nameParts = row.name.split(' ');
  const avatar = nameParts.map(part => part.charAt(0).toUpperCase()).join('');

  // Use display_hints from database (Ryan controls these)
  const hints = row.display_hints || [];

  // Format duration display
  const minutes = row.estimated_minutes || 20;
  const durationDisplay = minutes <= 20 
    ? '15-20 min' 
    : minutes <= 25 
      ? '20-25 min' 
      : '25-30 min';

  // Map difficulty (with fallback)
  const difficultyMap: Record<string, 'Beginner' | 'Intermediate' | 'Advanced'> = {
    'Beginner': 'Beginner',
    'Intermediate': 'Intermediate', 
    'Advanced': 'Advanced',
  };
  const difficulty = difficultyMap[row.difficulty_level || 'Beginner'] || 'Beginner';

  return {
    id: row.id,
    name: row.name,
    age: row.age,
    avatar,
    complaint: row.chief_complaint,
    hints,
    difficulty,
    status: 'Not Started', // TODO: Get from user progress table
    duration: durationDisplay,
  };
}

const difficultyColors = {
  Beginner: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Intermediate: 'bg-blue-50 text-blue-700 border-blue-200',
  Advanced: 'bg-purple-50 text-purple-700 border-purple-200',
};

const statusConfig = {
  Completed: {
    icon: Check,
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  'In Progress': {
    icon: Play,
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  'Not Started': {
    icon: null,
    className: 'bg-muted text-muted-foreground border-border',
  },
};

function PatientCard({
  patient,
  cpgSlug,
}: {
  patient: PatientCase;
  cpgSlug: string;
}) {
  const StatusIcon = statusConfig[patient.status].icon;

  return (
    <Link href={`/cpg/${cpgSlug}/practice/${patient.id}`}>
      <div className="group flex w-full flex-col rounded-xl border border-border bg-card p-5 text-left shadow-sm transition-all hover:border-primary/30 hover:shadow-md cursor-pointer">
        {/* Header with avatar and badges */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Patient Avatar */}
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-sm font-semibold text-primary">
              {patient.avatar}
            </div>
            <div>
              <h3 className="font-medium text-foreground">
                {patient.name}, {patient.age}
              </h3>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {patient.duration}
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div
            className={cn(
              'flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
              statusConfig[patient.status].className
            )}
          >
            {StatusIcon && <StatusIcon className="h-3 w-3" />}
            {patient.status}
          </div>
        </div>

        {/* Chief Complaint */}
        <p className="mt-4 text-sm italic text-foreground">
          {patient.complaint}
        </p>

        {/* Clinical Hints */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {patient.hints.map((hint) => (
            <span
              key={hint}
              className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
            >
              {hint}
            </span>
          ))}
        </div>

        {/* Difficulty Badge */}
        <div className="mt-4 flex items-center justify-between">
          <span
            className={cn(
              'rounded-full border px-2.5 py-0.5 text-xs font-medium',
              difficultyColors[patient.difficulty]
            )}
          >
            {patient.difficulty}
          </span>
          <span className="text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
            Click to start →
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function PracticePage() {
  const params = useParams();
  const slug = params.slug as string;
  const { setBreadcrumbs } = useBreadcrumbs();
  
  // State for patient cases
  const [patientCases, setPatientCases] = useState<PatientCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Format CPG name from slug
  const cpgName = slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Set breadcrumbs
  useEffect(() => {
    setBreadcrumbs([
      { label: 'My CPGs', href: '/my-cpgs' },
      { label: `${cpgName} - Practice` },
    ]);
  }, [cpgName, setBreadcrumbs]);

  // Fetch patient cases from Supabase
  useEffect(() => {
    async function fetchPatientCases() {
      try {
        setLoading(true);
        setError(null);
        
        const supabase = createClient();
        
        const { data, error: fetchError } = await supabase
          .from('patient_cases')
          .select(`
            id,
            name,
            age,
            occupation,
            chief_complaint,
            duration,
            onset_type,
            mechanism_of_injury,
            difficulty_level,
            estimated_minutes,
            display_order,
            display_hints
          `)
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (fetchError) {
          throw fetchError;
        }

        // Transform database rows to UI format
        const transformedCases = (data || []).map(transformToPatientCase);
        setPatientCases(transformedCases);
        
      } catch (err) {
        console.error('Error fetching patient cases:', err);
        setError('Failed to load practice cases. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchPatientCases();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">
            {cpgName} - Practice Cases
          </h1>
          <p className="mt-1 text-muted-foreground">
            Apply the CPG to simulated patients
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading cases...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">
            {cpgName} - Practice Cases
          </h1>
          <p className="mt-1 text-muted-foreground">
            Apply the CPG to simulated patients
          </p>
        </div>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
          <p className="text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (patientCases.length === 0) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">
            {cpgName} - Practice Cases
          </h1>
          <p className="mt-1 text-muted-foreground">
            Apply the CPG to simulated patients
          </p>
        </div>
        <div className="rounded-lg border border-border bg-muted/50 p-8 text-center">
          <p className="text-muted-foreground">No practice cases available yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">
          {cpgName} - Practice Cases
        </h1>
        <p className="mt-1 text-muted-foreground">
          Apply the CPG to simulated patients
        </p>
      </div>

      {/* Case Cards Grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {patientCases.map((patient) => (
          <PatientCard key={patient.id} patient={patient} cpgSlug={slug} />
        ))}
      </div>
    </div>
  );
}