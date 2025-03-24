import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Edit, Plus, ArrowLeft, TrendingUp, TrendingDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { getAllPerformanceRecords } from '../lib/api';
import type { PerformanceMetric } from '../lib/types';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

export default function Reports() {
  const [records, setRecords] = useState<PerformanceMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    loadRecords();
  }, []);

  async function loadRecords() {
    try {
      const data = await getAllPerformanceRecords();
      setRecords(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load records');
    } finally {
      setLoading(false);
    }
  }

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

  // Filter records for the selected month
  const monthlyRecords = records.filter(record => {
    const recordDate = new Date(record.week_start);
    return isWithinInterval(recordDate, {
      start: startOfMonth(selectedDate),
      end: endOfMonth(selectedDate)
    });
  });

  // Calculate monthly KPIs
  const monthlyKPIs = {
    totalSales: monthlyRecords.reduce((sum, record) => sum + (record.sales_amount || 0), 0),
    totalCalls: monthlyRecords.reduce((sum, record) => sum + (record.calls_made || 0), 0),
    totalMeetings: monthlyRecords.reduce((sum, record) => sum + (record.meetings_booked || 0), 0),
    totalLeads: monthlyRecords.reduce((sum, record) => sum + (record.leads_generated || 0), 0),
    avgSalesPerWeek: monthlyRecords.length ? 
      monthlyRecords.reduce((sum, record) => sum + (record.sales_amount || 0), 0) / monthlyRecords.length : 0,
    avgCallsPerWeek: monthlyRecords.length ? 
      monthlyRecords.reduce((sum, record) => sum + (record.calls_made || 0), 0) / monthlyRecords.length : 0,
    conversionRate: monthlyRecords.reduce((sum, record) => sum + (record.calls_made || 0), 0) > 0 ?
      (monthlyRecords.reduce((sum, record) => sum + (record.meetings_booked || 0), 0) / 
       monthlyRecords.reduce((sum, record) => sum + (record.calls_made || 0), 0) * 100) : 0
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/"
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Performance Reports</h1>
        </div>
        <Link
          to="/report"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Report
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          {error}
        </div>
      )}

      {/* Month Selection */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Monthly Overview</h2>
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

        {/* Monthly KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-600">Total Revenue</div>
            <div className="mt-2 flex items-end justify-between">
              <div className="text-2xl font-bold text-gray-900">
                ${monthlyKPIs.totalSales.toLocaleString()}
              </div>
              <div className="flex items-center text-sm">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-green-600">
                  ${monthlyKPIs.avgSalesPerWeek.toLocaleString()}/week
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-600">Total Calls</div>
            <div className="mt-2 flex items-end justify-between">
              <div className="text-2xl font-bold text-gray-900">
                {monthlyKPIs.totalCalls.toLocaleString()}
              </div>
              <div className="flex items-center text-sm">
                <Calendar className="h-4 w-4 text-blue-500 mr-1" />
                <span className="text-blue-600">
                  {Math.round(monthlyKPIs.avgCallsPerWeek)}/week
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-600">Meetings Booked</div>
            <div className="mt-2 flex items-end justify-between">
              <div className="text-2xl font-bold text-gray-900">
                {monthlyKPIs.totalMeetings.toLocaleString()}
              </div>
              <div className="flex items-center text-sm">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-green-600">
                  {monthlyKPIs.conversionRate.toFixed(1)}% conversion
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-600">Leads Generated</div>
            <div className="mt-2 flex items-end justify-between">
              <div className="text-2xl font-bold text-gray-900">
                {monthlyKPIs.totalLeads.toLocaleString()}
              </div>
              <div className="flex items-center text-sm">
                <TrendingUp className="h-4 w-4 text-purple-500 mr-1" />
                <span className="text-purple-600">
                  {(monthlyKPIs.totalLeads / (monthlyRecords.length || 1)).toFixed(1)}/week
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Records Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Week
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sales Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Calls Made
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Meetings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Leads
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {monthlyRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(record.week_start), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${record.sales_amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.calls_made}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.meetings_booked}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.leads_generated}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      to={`/report/${record.id}`}
                      className="text-orange-600 hover:text-orange-900"
                    >
                      <Edit className="h-5 w-5" />
                    </Link>
                  </td>
                </tr>
              ))}
              {monthlyRecords.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No performance records found for {format(selectedDate, 'MMMM yyyy')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
