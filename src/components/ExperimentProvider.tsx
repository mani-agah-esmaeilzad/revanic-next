// src/components/ExperimentProvider.tsx
"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { useEventTracker, useJourneyId } from '@/hooks/useEventTracker';
import { getExperimentDefinitions, pickWeightedVariant } from '@/lib/experiments';

type AssignmentMap = Record<string, string>;

interface ExperimentContextValue {
  assignments: AssignmentMap;
}

const ExperimentContext = createContext<ExperimentContextValue>({ assignments: {} });

const STORAGE_PREFIX = 'revanac_experiment:';

function buildSeed(source: string) {
  let hash = 0;
  for (let i = 0; i < source.length; i += 1) {
    hash = (hash << 5) - hash + source.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

interface ExperimentProviderProps {
  children: React.ReactNode;
}

const experiments = getExperimentDefinitions();

export function ExperimentProvider({ children }: ExperimentProviderProps) {
  const track = useEventTracker();
  const journeyId = useJourneyId();
  const [assignments, setAssignments] = useState<AssignmentMap>({});
  const exposedExperimentsRef = useRef(new Set<string>());

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const nextAssignments: AssignmentMap = {};
    for (const experiment of experiments) {
      const storageKey = `${STORAGE_PREFIX}${experiment.id}`;
      let variant = window.localStorage.getItem(storageKey);

      if (!variant) {
        const seedSource = journeyId ? `${journeyId}:${experiment.id}` : `${Date.now()}:${Math.random()}`;
        const seed = buildSeed(seedSource);
        variant = pickWeightedVariant(experiment.variants, seed);
        window.localStorage.setItem(storageKey, variant);
      }

      nextAssignments[experiment.id] = variant;
    }

    setAssignments((prev) => ({ ...nextAssignments, ...prev }));
  }, [journeyId]);

  useEffect(() => {
    Object.entries(assignments).forEach(([experimentId, variant]) => {
      const exposureKey = `${experimentId}:${variant}`;
      if (exposedExperimentsRef.current.has(exposureKey)) return;
      exposedExperimentsRef.current.add(exposureKey);
      track({
        name: 'experiment_exposure',
        experimentId,
        variant,
        payload: { location: typeof window !== 'undefined' ? window.location.pathname : undefined },
      });
    });
  }, [assignments, track]);

  const value = useMemo(() => ({ assignments }), [assignments]);

  return <ExperimentContext.Provider value={value}>{children}</ExperimentContext.Provider>;
}

export function useExperiment(experimentId: string) {
  const { assignments } = useContext(ExperimentContext);
  return assignments[experimentId] ?? 'control';
}
