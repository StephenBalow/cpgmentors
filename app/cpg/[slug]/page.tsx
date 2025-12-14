'use client';

import React, { useState } from 'react';
import { BookOpen, Shield, ArrowRight, CheckCircle2, Lock, Clock, ChevronRight, Layers, GitBranch, LucideIcon } from 'lucide-react';

// Type definitions
type LearningPath = 'step' | 'classification' | null;
type ModuleStatus = 'completed' | 'in-progress' | 'locked' | 'available' | 'not-started';

interface UniversalModule {
  id: string;
  title: string;
  description: string;
  duration: string;
  status: ModuleStatus;
  icon: LucideIcon;
}

interface StepModule {
  id: string;
  title: string;
  description: string;
  duration: string;
  status: ModuleStatus;
  progress?: number;
}

interface ClassificationModule {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  bgLight: string;
  border: string;
  duration: string;
  status: ModuleStatus;
  keyIndicators: string[];
}

interface Section {
  title: string;
  duration: string;
  status: ModuleStatus;
}

interface ClassificationContent {
  [key: string]: {
    sections: Section[];
  };
}

// Two-Views Training Concept for CPGmentors
// User chooses their learning path after completing universal modules

export default function TrainingTwoViews() {
  const [learningPath, setLearningPath] = useState<LearningPath>(null);
  const [selectedClassification, setSelectedClassification] = useState<string | null>(null);

  // Universal modules (everyone does these first)
  const universalModules: UniversalModule[] = [
    {
      id: 'overview',
      title: 'CPG Overview',
      description: 'How this guideline works and why it matters',
      duration: '10 min',
      status: 'completed',
      icon: BookOpen
    },
    {
      id: 'screening',
      title: 'Medical Screening',
      description: 'Red flags and when to refer',
      duration: '15 min',
      status: 'completed',
      icon: Shield
    }
  ];

  // Step-based modules (horizontal approach)
  const stepModules: StepModule[] = [
    {
      id: 'all-classification',
      title: 'Classification Systems',
      description: 'Learn all 4 classification categories and how to differentiate them',
      duration: '25 min',
      status: 'in-progress',
      progress: 60
    },
    {
      id: 'all-stage',
      title: 'Stage Determination',
      description: 'Acute, subacute, and chronic staging across all classifications',
      duration: '15 min',
      status: 'locked'
    },
    {
      id: 'all-treatment',
      title: 'Treatment Recommendations',
      description: 'Evidence-based interventions organized by classification and stage',
      duration: '30 min',
      status: 'locked'
    }
  ];

  // Classification-based modules (vertical deep-dives)
  const classificationModules: ClassificationModule[] = [
    {
      id: 'mobility-deficits',
      title: 'Mobility Deficits',
      subtitle: 'Limited ROM, restricted segmental mobility',
      color: 'from-blue-500 to-blue-600',
      bgLight: 'bg-blue-50',
      border: 'border-blue-200',
      duration: '20 min',
      status: 'available',
      keyIndicators: ['Limited cervical ROM', 'Pain at end ranges', 'No trauma history']
    },
    {
      id: 'wad',
      title: 'Movement Coordination (WAD)',
      subtitle: 'Whiplash-associated disorder',
      color: 'from-amber-500 to-orange-500',
      bgLight: 'bg-amber-50',
      border: 'border-amber-200',
      duration: '25 min',
      status: 'available',
      keyIndicators: ['Trauma mechanism', 'Referred pain patterns', 'Psychosocial factors']
    },
    {
      id: 'headache',
      title: 'Cervicogenic Headache',
      subtitle: 'Neck-related headache patterns',
      color: 'from-purple-500 to-purple-600',
      bgLight: 'bg-purple-50',
      border: 'border-purple-200',
      duration: '18 min',
      status: 'available',
      keyIndicators: ['Unilateral neck pain', 'Referred headache', 'Positive CFRT']
    },
    {
      id: 'radicular',
      title: 'Radiating Pain (Radicular)',
      subtitle: 'Nerve root involvement',
      color: 'from-rose-500 to-red-500',
      bgLight: 'bg-rose-50',
      border: 'border-rose-200',
      duration: '22 min',
      status: 'available',
      keyIndicators: ['Dermatomal pattern', 'Neurological signs', 'Positive Spurling\'s']
    }
  ];

  // Classification deep-dive content (what you see when you select one)
  const classificationContent: ClassificationContent = {
    'mobility-deficits': {
      sections: [
        { title: 'Presentation & Key Indicators', duration: '5 min', status: 'available' },
        { title: 'Clinical Tests', duration: '5 min', status: 'locked' },
        { title: 'Stage Determination', duration: '4 min', status: 'locked' },
        { title: 'Treatment by Stage', duration: '6 min', status: 'locked' }
      ]
    }
  };

  const StatusBadge = ({ status, progress }: { status: string; progress?: number }) => {
    if (status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Completed
        </span>
      );
    }
    if (status === 'in-progress') {
      return (
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs font-medium text-blue-600">{progress}%</span>
        </div>
      );
    }
    if (status === 'locked') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
          <Lock className="w-3.5 h-3.5" />
          Locked
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
        Not Started
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            <span>My CPGs</span>
            <ChevronRight className="w-4 h-4" />
            <span>Neck Pain</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-slate-900 font-medium">Training</span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Neck Pain CPG Training</h1>
          <p className="text-slate-600 mt-1">Master the APTA 2017 Clinical Practice Guideline</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Universal Modules Section */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Foundation</h2>
              <p className="text-sm text-slate-500">Required for all learning paths</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {universalModules.map((module) => {
              const Icon = module.icon;
              return (
                <div 
                  key={module.id}
                  className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900">{module.title}</h3>
                      <p className="text-sm text-slate-500">{module.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <StatusBadge status={module.status} />
                    <div className="flex items-center gap-1 text-sm text-slate-400">
                      <Clock className="w-4 h-4" />
                      {module.duration}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Learning Path Choice */}
        {!learningPath && (
          <div className="mb-10">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Choose Your Learning Path</h2>
              <p className="text-slate-600">Both paths cover the same content. Pick the approach that fits how you learn.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Step-Based Option */}
              <button
                onClick={() => setLearningPath('step')}
                className="group relative p-6 bg-white border-2 border-slate-200 rounded-2xl hover:border-blue-400 hover:shadow-lg transition-all text-left"
              >
                <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                  <Layers className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Learn by Step</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Master each decision step across all classifications. Great for understanding the clinical decision process.
                </p>
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">View Step Learning Path</span>
                </div>
              </button>

              {/* Classification-Based Option */}
              <button
                onClick={() => setLearningPath('classification')}
                className="group relative p-6 bg-white border-2 border-slate-200 rounded-2xl hover:border-emerald-400 hover:shadow-lg transition-all text-left"
              >
                <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
                  <GitBranch className="w-5 h-5 text-emerald-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Learn by Classification</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Deep-dive into one classification at a time. Great for focused learning and quick clinical reference.
                </p>
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <span className="text-xs font-medium text-emerald-600 uppercase tracking-wide">View Classification Learning Path</span>
                </div>
              </button>
            </div>

            <p className="text-center text-sm text-slate-400 mt-4">
              You can switch paths anytime. Your progress is saved.
            </p>
          </div>
        )}

        {/* Step-Based View */}
        {learningPath === 'step' && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                  <Layers className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">Learning by Step</h2>
                  <p className="text-sm text-slate-500">Master each decision step across all classifications</p>
                </div>
              </div>
              <button 
                onClick={() => setLearningPath(null)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Switch Path
              </button>
            </div>

            <div className="space-y-3">
              {stepModules.map((module, idx) => (
                <div 
                  key={module.id}
                  className={`flex items-center justify-between p-4 bg-white border rounded-xl transition-colors cursor-pointer ${
                    module.status === 'locked' 
                      ? 'border-slate-100 opacity-60' 
                      : 'border-slate-200 hover:border-blue-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      module.status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                      module.status === 'in-progress' ? 'bg-blue-100 text-blue-600' :
                      'bg-slate-100 text-slate-400'
                    }`}>
                      {module.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900">{module.title}</h3>
                      <p className="text-sm text-slate-500">{module.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <StatusBadge status={module.status} progress={module.progress} />
                    <div className="flex items-center gap-1 text-sm text-slate-400">
                      <Clock className="w-4 h-4" />
                      {module.duration}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Classification-Based View */}
        {learningPath === 'classification' && !selectedClassification && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                  <GitBranch className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">Learning by Classification</h2>
                  <p className="text-sm text-slate-500">Select a classification for a focused deep-dive</p>
                </div>
              </div>
              <button 
                onClick={() => setLearningPath(null)}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Switch Path
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {classificationModules.map((classification) => (
                <button
                  key={classification.id}
                  onClick={() => setSelectedClassification(classification.id)}
                  className={`group p-5 ${classification.bgLight} border ${classification.border} rounded-xl hover:shadow-md transition-all text-left`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${classification.color}`}></div>
                    <div className="flex items-center gap-1 text-sm text-slate-500">
                      <Clock className="w-4 h-4" />
                      {classification.duration}
                    </div>
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1">{classification.title}</h3>
                  <p className="text-sm text-slate-600 mb-3">{classification.subtitle}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {classification.keyIndicators.map((indicator, idx) => (
                      <span 
                        key={idx}
                        className="px-2 py-0.5 bg-white/70 rounded text-xs text-slate-600"
                      >
                        {indicator}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-sm font-medium text-slate-700 group-hover:text-slate-900">
                    Start Deep-Dive
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Classification Deep-Dive View */}
        {learningPath === 'classification' && selectedClassification && (
          <div className="mb-10">
            <button 
              onClick={() => setSelectedClassification(null)}
              className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-4"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              Back to Classifications
            </button>

            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white mb-6">
              <h2 className="text-xl font-semibold mb-1">Mobility Deficits</h2>
              <p className="text-blue-100">Deep-dive: Presentation → Tests → Stage → Treatment</p>
            </div>

            <div className="space-y-3">
              {classificationContent['mobility-deficits'].sections.map((section, idx) => (
                <div 
                  key={idx}
                  className={`flex items-center justify-between p-4 bg-white border rounded-xl transition-colors cursor-pointer ${
                    section.status === 'locked' 
                      ? 'border-slate-100 opacity-60' 
                      : 'border-slate-200 hover:border-blue-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      section.status === 'available' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {idx + 1}
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900">{section.title}</h3>
                      <p className="text-sm text-slate-500">Within Mobility Deficits classification</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <StatusBadge status={section.status === 'available' ? 'not-started' : section.status} />
                    <div className="flex items-center gap-1 text-sm text-slate-400">
                      <Clock className="w-4 h-4" />
                      {section.duration}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <p className="text-sm text-slate-600 text-center">
            <strong>Tip:</strong> Classification-based learning is great for clinical reference — 
            when you have a patient, come back and review that specific classification.
          </p>
        </div>
      </div>
    </div>
  );
}