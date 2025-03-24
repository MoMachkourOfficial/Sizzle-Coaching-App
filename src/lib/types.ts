import { Database } from './database.types';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type PerformanceMetric = Database['public']['Tables']['performance_metrics']['Row'];
export type PipelineEntry = Database['public']['Tables']['pipeline_entries']['Row'];
export type CallAttempt = Database['public']['Tables']['call_attempts']['Row'];

export type CallStatus = 'PENDING' | 'COMPLETED' | 'NO_ANSWER' | 'RESCHEDULED';

export type PipelineStage = 
  | 'LEADS'
  | 'CONVERSATIONS'
  | 'APPOINTMENTS'
  | 'FOLLOW_UP'
  | 'CLOSED';

export type PipelineStatus = 'OPEN' | 'WON' | 'LOST';

export interface PipelineMetrics {
  totalLeads: number;
  totalValue: number;
  closedDeals: number;
  closedValue: number;
  wonDeals?: number;
  wonValue?: number;
  lostDeals?: number;
  lostValue?: number;
}

export interface MonthlyPerformance {
  totalSales: number;
  totalCalls: number;
  totalMeetings: number;
  totalLeads: number;
  weeklyMetrics: PerformanceMetric[];
  pipelineMetrics: PipelineMetrics;
}

export interface CallListEntry extends PipelineEntry {
  call_attempts?: CallAttempt[];
  latest_attempt?: CallAttempt;
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
  address: string;
  timezone: string;
}

export interface GHLPipeline {
  id: string;
  name: string;
  stages: {
    id: string;
    name: string;
    order: number;
    color?: string;
  }[];
}

export interface GHLOpportunity {
  id: string;
  title: string;
  value?: number;
  status: string;
  stage: string;
  pipelineId: string;
  contactId?: string;
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    tags?: string[];
  };
  dateAdded: string;
  dateUpdated: string;
  customFields?: Record<string, any>;
  notes?: string;
  tags?: string[];
}

export interface GHLOpportunityResponse {
  opportunities: GHLOpportunity[];
  meta: {
    total: number;
    count: number;
    currentPage: number;
    totalPages: number;
    nextPageUrl: string | null;
  };
}

export interface GHLTask {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  status: string;
  assignedTo?: string;
  contactId?: string;
  opportunityId?: string;
}

export interface TestItem {
  id: string;
  content: string;
  color?: string;
}

export interface Column {
  id: string;
  title: string;
  items: TestItem[];
}
