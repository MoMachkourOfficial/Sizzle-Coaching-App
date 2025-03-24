import { supabase } from './supabase';
import { getOpportunities, getPipelines, createOpportunity } from './ghl';
import type { PerformanceMetric, MonthlyPerformance, PipelineMetrics, PipelineEntry, CallListEntry, CallStatus } from './types';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, getWeek, getYear } from 'date-fns';

export async function submitWeeklyReport(data: Omit<PerformanceMetric, 'id' | 'created_at' | 'updated_at'>) {
  const { error } = await supabase
    .from('performance_metrics')
    .insert([{
      ...data,
      week_start: startOfWeek(new Date()).toISOString()
    }]);

  if (error) throw error;
}

export async function getAllPerformanceRecords(): Promise<PerformanceMetric[]> {
  const { data, error } = await supabase
    .from('performance_metrics')
    .select('*')
    .order('week_start', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getMonthlyPerformance(year: number, month: number): Promise<MonthlyPerformance> {
  const monthStart = startOfMonth(new Date(year, month - 1));
  const monthEnd = endOfMonth(new Date(year, month - 1));

  // Get performance metrics for the month
  const { data: metrics, error: metricsError } = await supabase
    .from('performance_metrics')
    .select('*')
    .gte('week_start', monthStart.toISOString())
    .lte('week_start', monthEnd.toISOString())
    .order('week_start', { ascending: true });

  if (metricsError) throw metricsError;

  // Calculate monthly totals
  const totalSales = metrics?.reduce((sum, m) => sum + (m.sales_amount || 0), 0) || 0;
  const totalCalls = metrics?.reduce((sum, m) => sum + (m.calls_made || 0), 0) || 0;
  const totalMeetings = metrics?.reduce((sum, m) => sum + (m.meetings_booked || 0), 0) || 0;
  const totalLeads = metrics?.reduce((sum, m) => sum + (m.leads_generated || 0), 0) || 0;

  // Get pipeline data from GHL
  const pipelines = await getPipelines();
  if (!pipelines.length) {
    throw new Error('No pipelines found in GHL');
  }

  const pipeline = pipelines[0]; // Use the first pipeline
  const opportunitiesResponse = await getOpportunities(pipeline.id);
  const opportunities = opportunitiesResponse.opportunities;

  // Calculate pipeline metrics from GHL opportunities
  const pipelineMetrics: PipelineMetrics = {
    // Count active leads (opportunities in first stage and not won/lost)
    totalLeads: opportunities.filter(opp => 
      opp.stage === pipeline.stages[0].id && 
      opp.status !== 'won' && 
      opp.status !== 'lost'
    ).length,

    // Total value of all active opportunities
    totalValue: opportunities
      .filter(opp => opp.status !== 'won' && opp.status !== 'lost')
      .reduce((sum, opp) => sum + (opp.value || 0), 0),

    // Count and sum closed deals this month
    closedDeals: opportunities.filter(opp => 
      opp.status === 'won' &&
      opp.dateUpdated &&
      new Date(opp.dateUpdated) >= monthStart &&
      new Date(opp.dateUpdated) <= monthEnd
    ).length,

    // Sum of values for closed deals this month
    closedValue: opportunities
      .filter(opp => 
        opp.status === 'won' &&
        opp.dateUpdated &&
        new Date(opp.dateUpdated) >= monthStart &&
        new Date(opp.dateUpdated) <= monthEnd
      )
      .reduce((sum, opp) => sum + (opp.value || 0), 0),

    // All time won deals
    wonDeals: opportunities.filter(opp => opp.status === 'won').length,
    wonValue: opportunities
      .filter(opp => opp.status === 'won')
      .reduce((sum, opp) => sum + (opp.value || 0), 0),

    // All time lost deals
    lostDeals: opportunities.filter(opp => opp.status === 'lost').length,
    lostValue: opportunities
      .filter(opp => opp.status === 'lost')
      .reduce((sum, opp) => sum + (opp.value || 0), 0)
  };

  return {
    totalSales,
    totalCalls,
    totalMeetings,
    totalLeads,
    weeklyMetrics: metrics || [],
    pipelineMetrics
  };
}

export async function getPerformanceRecord(id: string): Promise<PerformanceMetric> {
  const { data, error } = await supabase
    .from('performance_metrics')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  if (!data) throw new Error('Performance record not found');

  return data;
}

export async function updatePerformanceRecord(
  id: string,
  data: Partial<Omit<PerformanceMetric, 'id' | 'created_at' | 'updated_at'>>
) {
  const { error } = await supabase
    .from('performance_metrics')
    .update(data)
    .eq('id', id);

  if (error) throw error;
}

export async function createCallAttempt(data: {
  pipeline_entry_id: string;
  status: CallStatus;
  notes?: string;
  next_follow_up?: Date;
}) {
  const { error } = await supabase
    .from('call_attempts')
    .insert([{
      pipeline_entry_id: data.pipeline_entry_id,
      status: data.status,
      notes: data.notes,
      next_follow_up: data.next_follow_up?.toISOString(),
      attempt_date: new Date().toISOString()
    }]);

  if (error) throw error;
}

export async function getCallList(): Promise<CallListEntry[]> {
  // Get pipelines first to determine stages
  const pipelines = await getPipelines();
  if (!pipelines.length) {
    throw new Error('No pipelines found in GHL');
  }

  const pipeline = pipelines[0];
  const opportunitiesResponse = await getOpportunities(pipeline.id);
  const opportunities = opportunitiesResponse.opportunities;

  // Get tasks (call attempts) for each opportunity
  const callList = opportunities.map(opp => ({
    id: opp.id,
    prospect_name: opp.title,
    value: opp.value,
    stage: opp.stage,
    status: opp.status,
    created_at: opp.dateAdded,
    updated_at: opp.dateUpdated,
    call_attempts: opp.call_attempts || [],
    latest_attempt: opp.call_attempts?.[0]
  }));

  // Sort by priority:
  // 1. No call attempts
  // 2. Due for follow-up
  // 3. No answer calls
  // 4. Value (highest first)
  return callList.sort((a, b) => {
    // First priority: No call attempts
    if (!a.latest_attempt && b.latest_attempt) return -1;
    if (a.latest_attempt && !b.latest_attempt) return 1;

    // Second priority: Due for follow-up
    if (a.latest_attempt?.next_follow_up && b.latest_attempt?.next_follow_up) {
      return new Date(a.latest_attempt.next_follow_up).getTime() - 
             new Date(b.latest_attempt.next_follow_up).getTime();
    }

    // Third priority: No answer calls
    if (a.latest_attempt?.status === 'NO_ANSWER' && b.latest_attempt?.status !== 'NO_ANSWER') return -1;
    if (a.latest_attempt?.status !== 'NO_ANSWER' && b.latest_attempt?.status === 'NO_ANSWER') return 1;

    // Finally, sort by value
    return (b.value || 0) - (a.value || 0);
  });
}

export async function getUserAssignments(): Promise<any[]> {
  const { data, error } = await supabase
    .from('user_assignments')
    .select(`
      *,
      session:program_sessions (
        *,
        program:coaching_programs (*)
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function updateAssignmentStatus(assignmentId: string, completed: boolean) {
  const { error } = await supabase
    .from('user_assignments')
    .update({
      completed,
      completed_at: completed ? new Date().toISOString() : null
    })
    .eq('id', assignmentId);

  if (error) throw error;
}

export async function createPipelineEntry(data: {
  user_id: string;
  prospect_name: string;
  value: number;
  target_amount?: number;
  event_type?: string;
  stage: string;
  status: string;
}): Promise<void> {
  try {
    // First create the opportunity in GHL
    const pipelines = await getPipelines();
    if (!pipelines.length) {
      throw new Error('No pipelines found in GHL');
    }

    const pipeline = pipelines[0];
    const firstStage = pipeline.stages[0];

    await createOpportunity({
      title: data.prospect_name,
      value: data.value,
      pipelineId: pipeline.id,
      stage: firstStage.id
    });

    // Then create local entry for tracking
    const { error } = await supabase
      .from('pipeline_entries')
      .insert([data]);

    if (error) throw error;
  } catch (error) {
    console.error('Error creating pipeline entry:', error);
    throw error;
  }
}

export async function getPipelineEntries(): Promise<PipelineEntry[]> {
  const { data, error } = await supabase
    .from('pipeline_entries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function updatePipelineEntry(id: string, updates: Partial<PipelineEntry>) {
  const { error } = await supabase
    .from('pipeline_entries')
    .update(updates)
    .eq('id', id);

  if (error) throw error;
}

function getWeekStartDate(year: number, weekNumber: number): Date {
  const januaryFirst = new Date(year, 0, 1);
  const daysToAdd = (weekNumber - 1) * 7 - januaryFirst.getDay();
  const weekStart = new Date(year, 0, 1 + daysToAdd);
  return weekStart;
}
