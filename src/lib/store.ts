import { create } from 'zustand';
import { getPipelines, getOpportunities } from './ghl';
import type { GHLPipeline, GHLOpportunity, GHLOpportunityResponse } from './types';

interface PipelineStore {
  pipeline: GHLPipeline | null;
  opportunities: GHLOpportunity[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number;
  lastModified: string | null;
  fetchPipelineData: (force?: boolean) => Promise<void>;
  updateOpportunity: (id: string, updates: Partial<GHLOpportunity>) => void;
  addOpportunity: (opportunity: GHLOpportunity) => void;
}

const CACHE_DURATION = 3000; // 3 seconds

export const usePipelineStore = create<PipelineStore>((set, get) => ({
  pipeline: null,
  opportunities: [],
  isLoading: false,
  error: null,
  lastFetched: 0,
  lastModified: null,

  fetchPipelineData: async (force = false) => {
    const now = Date.now();
    const lastFetched = get().lastFetched;
    const currentLastModified = get().lastModified;

    // Return cached data if within cache duration and not forced
    if (!force && now - lastFetched < CACHE_DURATION && get().opportunities.length > 0) {
      return;
    }

    // Only show loading state on initial load
    if (!get().opportunities.length) {
      set({ isLoading: true });
    }

    try {
      // Get pipelines first
      const pipelines = await getPipelines();
      if (!pipelines.length) {
        throw new Error('No pipelines found');
      }

      // Use the first pipeline
      const selectedPipeline = pipelines[0];

      // Get opportunities with If-Modified-Since header
      const opportunitiesResponse = await getOpportunities(
        selectedPipeline.id,
        currentLastModified
      );

      // If we get a 304 Not Modified, just update lastFetched
      if (opportunitiesResponse.notModified) {
        set({ lastFetched: now });
        return;
      }

      // Only update state if we have new data
      set({
        pipeline: selectedPipeline,
        opportunities: opportunitiesResponse.opportunities,
        lastFetched: now,
        lastModified: opportunitiesResponse.lastModified || null,
        error: null
      });
    } catch (err) {
      // Only set error if it's different from the current error
      const errorMessage = err instanceof Error ? err.message : 'Failed to load pipeline data';
      if (get().error !== errorMessage) {
        set({ error: errorMessage });
      }
      console.error('Failed to load pipeline:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  updateOpportunity: (id: string, updates: Partial<GHLOpportunity>) => {
    set(state => ({
      opportunities: state.opportunities.map(opp =>
        opp.id === id ? { ...opp, ...updates } : opp
      ),
      // Force a refresh on next fetch after local update
      lastModified: null
    }));
  },

  addOpportunity: (opportunity: GHLOpportunity) => {
    set(state => ({
      opportunities: [opportunity, ...state.opportunities],
      // Force a refresh on next fetch after local update
      lastModified: null
    }));
  }
}));
