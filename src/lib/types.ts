import { Database } from './database.types';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type PerformanceMetric = Database['public']['Tables']['performance_metrics']['Row'];
export type CoachingSession = Database['public']['Tables']['coaching_sessions']['Row'];
export type CoachingProgram = Database['public']['Tables']['coaching_programs']['Row'];
export type ProgramSession = Database['public']['Tables']['program_sessions']['Row'];
export type UserAssignment = Database['public']['Tables']['user_assignments']['Row'];
export type PipelineEntry = Database['public']['Tables']['pipeline_entries']['Row'];
export type CallAttempt = Database['public']['Tables']['call_attempts']['Row'];

export type CallStatus = 'PENDING' | 'COMPLETED' | 'NO_ANSWER' | 'RESCHEDULED';

export type PipelineStage = 
  | 'LEADS'
  | 'CONVERSATIONS'
  | 'APPOINTMENTS'
  | 'FOLLOW_UP'
  | 'CLOSED'
  | 'LOST';

export type PipelineStatus = 'OPEN' | 'WON' | 'LOST';

export interface PipelineMetrics {
  totalLeads: number;
  totalValue: number;
  closedDeals: number;
  closedValue: number;
  wonDeals: number;
  wonValue: number;
  lostDeals: number;
  lostValue: number;
}

export interface MonthlyPerformance {
  totalSales: number;
  totalCalls: number;
  totalMeetings: number;
  totalLeads: number;
  weeklyMetrics: PerformanceMetric[];
  pipelineMetrics: PipelineMetrics;
}

export interface AssignmentWithDetails extends UserAssignment {
  session: ProgramSession;
  program: CoachingProgram;
}

export interface CallListEntry extends PipelineEntry {
  call_attempts?: CallAttempt[];
  latest_attempt?: CallAttempt;
}

export interface DragDropResult {
  draggableId: string;
  type: string;
  source: {
    droppableId: string;
    index: number;
  };
  destination: {
    droppableId: string;
    index: number;
  } | null;
  reason: 'DROP' | 'CANCEL';
}

export interface GHLContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  tags: string[];
  customFields: Record<string, any>;
  dateAdded: string;
  dateUpdated: string;
}

export interface GHLContactsResponse {
  contacts: GHLContact[];
  meta: {
    total: number;
    count: number;
    currentPage: number;
    totalPages: number;
  };
}

export interface GHLLocation {
  id: string;
  name: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  phone?: string;
  email?: string;
  website?: string;
  timezone?: string;
}

export interface GHLOpportunity {
  id: string;
  title: string;
  value: number;
  status: string;
  stage: string;
  pipelineId: string;
  contactId: string;
  contact?: GHLContact;
  dateAdded: string;
  dateUpdated: string;
  customFields?: Record<string, any>;
  notes?: string;
  tags?: string[];
}

export interface GHLPipeline {
  id: string;
  name: string;
  stages: GHLPipelineStage[];
  dateAdded: string;
  dateUpdated: string;
}

export interface GHLPipelineStage {
  id: string;
  name: string;
  order: number;
  color?: string;
}

export interface GHLOpportunityResponse {
  opportunities: GHLOpportunity[];
  meta: {
    total: number;
    count: number;
    currentPage: number;
    totalPages: number;
  };
}
