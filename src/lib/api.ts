import { supabase } from './supabase';
import { PerformanceMetric, MonthlyPerformance, AssignmentWithDetails, PipelineEntry, CallListEntry, CallStatus, CallAttempt } from './types';
import { startOfWeek, getWeek, getYear } from 'date-fns';

export async function submitWeeklyReport(data: Omit<PerformanceMetric, 'id' | 'created_at' | 'updated_at'>) {
  const { error: upsertError } = await supabase
    .from('profiles')
    .upsert([{ id: data.user_id }], {
      onConflict: 'id'
    });
  
  if (upsertError) throw upsertError;

  const weekStart = getWeekStartDate(data.year, data.week_number);
  
  const { error } = await supabase
    .from('performance_metrics')
    .insert([{
      ...data,
      week_start: weekStart.toISOString()
    }]);
  
  if (error) throw error;
}

export async function getAllPerformanceRecords(): Promise<PerformanceMetric[]> {
  const { data, error } = await supabase
    .from('performance_metrics')
    .select('*')
    .order('week_start', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getPerformanceRecord(id: string): Promise<PerformanceMetric> {
  const { data, error } = await supabase
    .from('performance_metrics')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
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

export async function getMonthlyPerformance(year: number, month: number): Promise<MonthlyPerformance> {
  const startWeek = getWeekNumber(new Date(year, month - 1, 1));
  const endWeek = getWeekNumber(new Date(year, month, 0));

  // Get performance metrics for the month
  const { data: metrics, error: metricsError } = await supabase
    .from('performance_metrics')
    .select('*')
    .eq('year', year)
    .gte('week_number', startWeek)
    .lte('week_number', endWeek)
    .order('week_number', { ascending: true });

  if (metricsError) throw metricsError;

  // Get closed deals for the month
  const startDate = new Date(year, month - 1, 1).toISOString();
  const endDate = new Date(year, month, 0).toISOString();

  const { data: closedDeals, error: dealsError } = await supabase
    .from('pipeline_entries')
    .select('value, updated_at')
    .eq('stage', 'CLOSED')
    .gte('updated_at', startDate)
    .lt('updated_at', endDate);

  if (dealsError) throw dealsError;

  // Calculate total sales including closed deals
  const closedDealsTotal = closedDeals?.reduce((sum, deal) => sum + (deal.value || 0), 0) || 0;
  const reportedSales = metrics?.reduce((sum, m) => sum + (m.sales_amount || 0), 0) || 0;

  // Get pipeline metrics
  const { data: pipelineData, error: pipelineError } = await supabase
    .from('pipeline_entries')
    .select('stage, value');

  if (pipelineError) throw pipelineError;

  const pipelineMetrics = {
    totalLeads: pipelineData?.filter(entry => entry.stage === 'LEADS').length || 0,
    totalValue: pipelineData?.reduce((sum, entry) => sum + entry.value, 0) || 0,
    closedDeals: pipelineData?.filter(entry => entry.stage === 'CLOSED').length || 0,
    closedValue: pipelineData?.filter(entry => entry.stage === 'CLOSED')
      .reduce((sum, entry) => sum + entry.value, 0) || 0
  };

  return {
    totalSales: reportedSales + closedDealsTotal,
    totalCalls: metrics?.reduce((sum, m) => sum + (m.calls_made || 0), 0) || 0,
    totalMeetings: metrics?.reduce((sum, m) => sum + (m.meetings_booked || 0), 0) || 0,
    totalLeads: metrics?.reduce((sum, m) => sum + (m.leads_generated || 0), 0) || 0,
    weeklyMetrics: metrics || [],
    pipelineMetrics
  };
}

export async function getUserAssignments(): Promise<AssignmentWithDetails[]> {
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
  return data as AssignmentWithDetails[];
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

// Pipeline Management Functions
export async function getPipelineEntries(): Promise<PipelineEntry[]> {
  const { data, error } = await supabase
    .from('pipeline_entries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createPipelineEntry(entry: Omit<PipelineEntry, 'id' | 'created_at' | 'updated_at'>) {
  const { error } = await supabase
    .from('pipeline_entries')
    .insert([entry]);

  if (error) throw error;
}

export async function updatePipelineEntry(id: string, updates: Partial<PipelineEntry>) {
  const { data: currentEntry, error: fetchError } = await supabase
    .from('pipeline_entries')
    .select('stage')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;

  const { error: updateError } = await supabase
    .from('pipeline_entries')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (updateError) throw updateError;

  // If the entry is being moved to CLOSED stage, update the performance metrics
  if (updates.stage === 'CLOSED' && currentEntry.stage !== 'CLOSED') {
    const { data: entry, error: entryError } = await supabase
      .from('pipeline_entries')
      .select('value, user_id')
      .eq('id', id)
      .single();

    if (entryError) throw entryError;

    const now = new Date();
    const weekNumber = getWeek(now);
    const year = getYear(now);

    // Check if there's an existing performance record for this week
    const { data: existingRecord, error: recordError } = await supabase
      .from('performance_metrics')
      .select('id, sales_amount')
      .eq('user_id', entry.user_id)
      .eq('week_number', weekNumber)
      .eq('year', year)
      .single();

    if (recordError && recordError.message !== 'No rows found') throw recordError;

    if (existingRecord) {
      // Update existing record
      const { error: updateRecordError } = await supabase
        .from('performance_metrics')
        .update({
          sales_amount: (existingRecord.sales_amount || 0) + entry.value
        })
        .eq('id', existingRecord.id);

      if (updateRecordError) throw updateRecordError;
    } else {
      // Create new record
      const { error: createRecordError } = await supabase
        .from('performance_metrics')
        .insert([{
          user_id: entry.user_id,
          week_number: weekNumber,
          year: year,
          sales_amount: entry.value,
          calls_made: 0,
          meetings_booked: 0,
          leads_generated: 0,
          week_start: startOfWeek(now).toISOString()
        }]);

      if (createRecordError) throw createRecordError;
    }
  }
}

export async function getCallList(): Promise<CallListEntry[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get leads and opportunities with their latest call attempts
  const { data, error } = await supabase
    .from('pipeline_entries')
    .select(`
      *,
      call_attempts (*)
    `)
    .in('stage', ['LEADS', 'CONVERSATIONS'])
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Process and sort entries
  const entries = (data as CallListEntry[]).map(entry => {
    const attempts = entry.call_attempts || [];
    const latestAttempt = attempts.length > 0 
      ? attempts.reduce((latest, current) => 
          new Date(current.attempt_date) > new Date(latest.attempt_date) ? current : latest
        )
      : undefined;

    return {
      ...entry,
      latest_attempt: latestAttempt
    };
  });

  // Prioritize entries:
  // 1. No call attempts
  // 2. Due for follow-up
  // 3. No answer calls from previous days
  // 4. Other leads by value (highest first)
  return entries.sort((a, b) => {
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
    return b.value - a.value;
  });
}

export async function createCallAttempt(data: {
  pipeline_entry_id: string;
  status: CallStatus;
  notes?: string;
  next_follow_up?: Date;
}) {
  // Get the user_id from the pipeline entry
  const { data: pipelineEntry, error: pipelineError } = await supabase
    .from('pipeline_entries')
    .select('user_id')
    .eq('id', data.pipeline_entry_id)
    .single();

  if (pipelineError) throw pipelineError;

  const { error } = await supabase
    .from('call_attempts')
    .insert([{
      ...data,
      user_id: pipelineEntry.user_id, // Add the user_id from the pipeline entry
      next_follow_up: data.next_follow_up?.toISOString(),
      attempt_date: new Date().toISOString()
    }]);

  if (error) throw error;
}

export async function updateCallAttempt(
  id: string,
  data: Partial<Omit<CallAttempt, 'id' | 'created_at' | 'updated_at'>>
) {
  const { error } = await supabase
    .from('call_attempts')
    .update(data)
    .eq('id', id);

  if (error) throw error;
}

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

function getWeekStartDate(year: number, weekNumber: number): Date {
  const januaryFirst = new Date(year, 0, 1);
  const daysToAdd = (weekNumber - 1) * 7 - januaryFirst.getDay();
  const weekStart = new Date(year, 0, 1 + daysToAdd);
  return weekStart;
}
