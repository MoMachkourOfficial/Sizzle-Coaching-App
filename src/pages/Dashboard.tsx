import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Flame, 
  Plus, 
  DollarSign, 
  ChevronLeft, 
  ChevronRight, 
  Phone,
  Users,
  FileText,
  GripVertical
} from 'lucide-react';
import { getMonthlyPerformance } from '../lib/api';
import type { MonthlyPerformance } from '../lib/types';
import { format } from 'date-fns';

export default function Dashboard() {
  const [monthlyStats, setMonthlyStats] = useState<MonthlyPerformance | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const stats = await getMonthlyPerformance(
        selectedDate.getFullYear(),
        selectedDate.getMonth() + 1
      );
      setMonthlyStats(stats);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Failed to load data:', err);
    } finally {
      setIsLoading(false);
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
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex space-x-4">
          <Link
            to="/drag-test"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600"
          >
            <GripVertical className="h-5 w-5 mr-2" />
            Drag & Drop Demo
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
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
            </div>
          ) : (
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
          )}
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
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
            </div>
          ) : (
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
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              to="/calls"
              className="flex items-center p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <Phone className="h-5 w-5 text-orange-600 mr-3" />
              <span className="text-orange-900">Make Calls</span>
            </Link>
            <Link
              to="/pipeline"
              className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Users className="h-5 w-5 text-blue-600 mr-3" />
              <span className="text-blue-900">View Pipeline</span>
            </Link>
            <Link
              to="/reports"
              className="flex items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <FileText className="h-5 w-5 text-green-600 mr-3" />
              <span className="text-green-900">View Reports</span>
            </Link>
          </div>
        </div>

        {/* Motivation Card */}
        <div className="bg-gradient-to-r from-orange-500 to-yellow-500 rounded-lg shadow p-6 text-white">
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
