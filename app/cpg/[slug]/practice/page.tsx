'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Check, Clock, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBreadcrumbs } from '@/components/breadcrumb-context';

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

const patientCases: PatientCase[] = [
  {
    id: 'sarah-martinez',
    name: 'Sarah Martinez',
    age: 45,
    avatar: 'SM',
    complaint: "I can't check my blind spot when backing up my car",
    hints: ['3 weeks duration', 'No trauma', 'Office worker'],
    difficulty: 'Beginner',
    status: 'Completed',
    duration: '15-20 min',
  },
  {
    id: 'michael-chen',
    name: 'Michael Chen',
    age: 62,
    avatar: 'MC',
    complaint: 'My neck is so stiff every morning, it takes hours to loosen up',
    hints: ['6 months duration', 'Gradual onset', 'Retired teacher'],
    difficulty: 'Intermediate',
    status: 'In Progress',
    duration: '20-25 min',
  },
  {
    id: 'emma-thompson',
    name: 'Emma Thompson',
    age: 28,
    avatar: 'ET',
    complaint: "Ever since the car accident, my neck hasn't been the same",
    hints: ['Post-MVA', '2 weeks ago', 'Whiplash mechanism'],
    difficulty: 'Advanced',
    status: 'Not Started',
    duration: '25-30 min',
  },
  {
    id: 'robert-williams',
    name: 'Robert Williams',
    age: 55,
    avatar: 'RW',
    complaint: 'The pain shoots down my arm when I look up',
    hints: ['Radiating symptoms', 'Numbness in fingers', 'Construction worker'],
    difficulty: 'Intermediate',
    status: 'Not Started',
    duration: '20-25 min',
  },
  {
    id: 'lisa-anderson',
    name: 'Lisa Anderson',
    age: 38,
    avatar: 'LA',
    complaint: 'These headaches always start at the base of my skull',
    hints: ['Cervicogenic pattern', 'Desk job', 'No visual changes'],
    difficulty: 'Beginner',
    status: 'Not Started',
    duration: '15-20 min',
  },
  {
    id: 'james-cooper',
    name: 'James Cooper',
    age: 71,
    avatar: 'JC',
    complaint: "I've had this neck pain for years, nothing seems to help",
    hints: ['Chronic pain', 'Multiple treatments tried', 'Retired'],
    difficulty: 'Advanced',
    status: 'Not Started',
    duration: '25-30 min',
  },
];

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

  // Format CPG name
  const cpgName = slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  useEffect(() => {
    setBreadcrumbs([
      { label: 'My CPGs', href: '/my-cpgs' },
      { label: `${cpgName} - Practice` },
    ]);
  }, [cpgName, setBreadcrumbs]);

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
