import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Flame, 
  ArrowLeft, 
  Plus, 
  DollarSign, 
  ChevronLeft, 
  ChevronRight, 
  Phone,
  Users,
  TestTube 
} from 'lucide-react';
import { getMonthlyPerformance, getPipelineEntries, updatePipelineEntry, createPipelineEntry } from '../lib/api';
import type { MonthlyPerformance, PipelineEntry } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

export default function Dashboard() {
  const { session } = useAuth();
  const [monthlyStats, setMonthlyStats] = useState<MonthlyPerformance | null>(null);
  const [pipelineEntries, setPipelineEntries] = useState<PipelineEntry[]>([]);
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);
  const [newLead, setNewLead] = useState({ prospect_name: '', value: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    try {
      const [stats, pipeline] = await Promise.all([
        getMonthlyPerformance(selectedDate.getFullYear(), selectedDate.getMonth() + 1),
        getPipelineEntries()
      ]);
      setMonthlyStats(stats);
      setPipelineEntries(pipeline);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const getPipelineStageValue = (stage: 'LEAD' | 'OPPORTUNITY' | 'CLOSED') => {
    return pipelineEntries
      .filter(entry => entry.stage === stage)
      .reduce((sum, entry) => sum + entry.value, 0);
  };

  const handleStageChange = async (entryId: string, newStage: 'LEAD' | 'OPPORTUNITY' | 'CLOSED') => {
    try {
      await updatePipelineEntry(entryId, { stage: newStage });
      await loadData();
    } catch (error) {
      console.error('Failed to update pipeline entry:', error);
    }
  };

  const handleNewLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!session?.user?.id) {
        throw new Error('User not authenticated');
      }

      const value = parseFloat(newLead.value);
      if (isNaN(value) || value <= 0) {
        throw new Error('Please enter a valid value');
      }

      if (!newLead.prospect_name.trim()) {
        throw new Error('Please enter a prospect name');
      }

      await createPipelineEntry({
        user_id: session.user.id,
        prospect_name: newLead.prospect_name.trim(),
        value: value,
        stage: 'LEADS'
      });

      setNewLead({ prospect_name: '', value: '' });
      setShowNewLeadModal(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create lead');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreviousMonth = () => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    const now = new Date();
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate > now ? prev : newDate;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        </div>
        <div className="flex space-x-4">
          <Link
            to="/contacts"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600"
          >
            <Users className="h-5 w-5 mr-2" />
            Contacts
          </Link>
          <Link
            to="/pipeline"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600"
          >
            <Plus className="h-5 w-5 mr-2" />
            Pipeline
          </Link>
          <Link
            to="/calls"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600"
          >
            <Phone className="h-5 w-5 mr-2" />
            Daily Calls
          </Link>
          <Link
            to="/assignments"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600"
          >
            View All Assignments
          </Link>
          <Link
            to="/reports"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600"
          >
            View Reports
          </Link>
          <Link
            to="/report"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600"
          >
            Submit Report
          </Link>
          <Link
            to="/ghl-test"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-500 hover:bg-green-600"
          >
            <TestTube className="h-5 w-5 mr-2" />
            Test GHL API
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly Performance */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Monthly Performance</h2>
            <div className="flex items-center space-x-4">
              <button
                onClick={handlePreviousMonth}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>
              <span className="text-sm font-medium text-gray-900">
                {format(selectedDate, 'MMMM yyyy')}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-1 rounded-full hover:bg-gray-100"
                disabled={selectedDate.getMonth() === new Date().getMonth()}
              >
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-sm font-medium text-gray-600">Revenue</div>
              <div className="text-lg font-semibold">
                ${monthlyStats?.totalSales.toLocaleString() || '0'}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-gray-600">Calls Made</div>
              <div className="text-lg font-semibold">
                {monthlyStats?.totalCalls.toLocaleString() || '0'}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-gray-600">Meetings Booked</div>
              <div className="text-lg font-semibold">
                {monthlyStats?.totalMeetings.toLocaleString() || '0'}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-gray-600">Leads Generated</div>
              <div className="text-lg font-semibold">
                {monthlyStats?.totalLeads.toLocaleString() || '0'}
              </div>
            </div>
          </div>
        </div>

        {/* Pipeline Overview */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Pipeline Overview</h2>
            <Link
              to="/pipeline"
              className="text-sm text-orange-600 hover:text-orange-700"
            >
              View Full Pipeline →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-sm font-medium text-gray-600">Total Pipeline Value</div>
              <div className="text-lg font-semibold">
                ${monthlyStats?.pipelineMetrics.totalValue.toLocaleString() || '0'}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-gray-600">Active Leads</div>
              <div className="text-lg font-semibold">
                {monthlyStats?.pipelineMetrics.totalLeads || '0'}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-gray-600">Closed Deals (MTD)</div>
              <div className="text-lg font-semibold">
                {monthlyStats?.pipelineMetrics.closedDeals || '0'}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-gray-600">Closed Value (MTD)</div>
              <div className="text-lg font-semibold">
                ${monthlyStats?.pipelineMetrics.closedValue.toLocaleString() || '0'}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Action */}
        <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Action</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/calls"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600"
            >
              Make Calls
            </Link>
            <Link
              to="/pipeline"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600"
            >
              View Pipeline
            </Link>
            <Link
              to="/reports"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600"
            >
              View Report
            </Link>
          </div>
        </div>

        {/* Motivation Card */}
        <div className="bg-gradient-to-r from-orange-500 to-yellow-500 rounded-lg shadow p-6 text-white md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Daily Motivation</h2>
            <Flame className="h-6 w-6" />
          </div>
          <p className="text-lg font-medium">
            "Success is not final, failure is not fatal: it is the courage to continue that counts."
          </p>
          <p className="mt-2 text-sm">Keep pushing forward! Your goals are within reach.</p>
        </div>
      </div>
    </div>
  );
}
