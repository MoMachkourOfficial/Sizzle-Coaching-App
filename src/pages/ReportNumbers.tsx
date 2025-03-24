import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { submitWeeklyReport, getPerformanceRecord, updatePerformanceRecord } from '../lib/api';
import type { PerformanceMetric } from '../lib/types';

export default function ReportNumbers() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { session } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [formData, setFormData] = useState({
    sales_amount: '',
    calls_made: '',
    meetings_booked: '',
    leads_generated: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    if (id) {
      loadRecord();
    }
  }, [id]);

  async function loadRecord() {
    try {
      const record = await getPerformanceRecord(id);
      setSelectedDate(new Date(record.week_start));
      setFormData({
        sales_amount: record.sales_amount.toString(),
        calls_made: record.calls_made.toString(),
        meetings_booked: record.meetings_booked.toString(),
        leads_generated: record.leads_generated.toString(),
        notes: record.notes || ''
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load record');
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const data = {
        user_id: session?.user.id!,
        sales_amount: parseFloat(formData.sales_amount) || 0,
        calls_made: parseInt(formData.calls_made) || 0,
        meetings_booked: parseInt(formData.meetings_booked) || 0,
        leads_generated: parseInt(formData.leads_generated) || 0,
        week_number: getWeekNumber(selectedDate),
        year: selectedDate.getFullYear(),
        notes: formData.notes
      };

      if (id) {
        await updatePerformanceRecord(id, data);
      } else {
        await submitWeeklyReport(data);
      }
      
      setShowSummary(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.id]: e.target.value
    }));
  };

  function getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/reports')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back to Reports
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {id ? 'Edit Report' : 'New Report'}
          </h1>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          {error}
        </div>
      )}

      {showSummary ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-2 mb-6 text-green-600">
            <CheckCircle className="h-6 w-6" />
            <h2 className="text-xl font-semibold">Report {id ? 'Updated' : 'Submitted'} Successfully!</h2>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500">Report Date</h3>
              <p className="text-lg font-semibold text-gray-900">
                {selectedDate.toLocaleDateString()}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500">Sales Amount</h3>
              <p className="text-2xl font-bold text-gray-900">
                ${parseFloat(formData.sales_amount || '0').toLocaleString()}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500">Calls Made</h3>
              <p className="text-2xl font-bold text-gray-900">
                {parseInt(formData.calls_made || '0').toLocaleString()}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500">Meetings Booked</h3>
              <p className="text-2xl font-bold text-gray-900">
                {parseInt(formData.meetings_booked || '0').toLocaleString()}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500">Leads Generated</h3>
              <p className="text-2xl font-bold text-gray-900">
                {parseInt(formData.leads_generated || '0').toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              onClick={() => navigate('/reports')}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-md"
            >
              View All Reports
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Report Date
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type="date"
                  value={selectedDate.toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="sales_amount" className="block text-sm font-medium text-gray-700">
                Sales Amount
              </label>
              <input
                type="number"
                id="sales_amount"
                value={formData.sales_amount}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label htmlFor="calls_made" className="block text-sm font-medium text-gray-700">
                Calls Made
              </label>
              <input
                type="number"
                id="calls_made"
                value={formData.calls_made}
                onChange={handleChange}
                min="0"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                placeholder="0"
              />
            </div>

            <div>
              <label htmlFor="meetings_booked" className="block text-sm font-medium text-gray-700">
                Meetings Booked
              </label>
              <input
                type="number"
                id="meetings_booked"
                value={formData.meetings_booked}
                onChange={handleChange}
                min="0"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                placeholder="0"
              />
            </div>

            <div>
              <label htmlFor="leads_generated" className="block text-sm font-medium text-gray-700">
                Leads Generated
              </label>
              <input
                type="number"
                id="leads_generated"
                value={formData.leads_generated}
                onChange={handleChange}
                min="0"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                placeholder="0"
              />
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                placeholder="Add any notes about this report..."
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : id ? 'Update Report' : 'Submit Report'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
