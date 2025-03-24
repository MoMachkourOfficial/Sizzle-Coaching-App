import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Phone, Clock, CheckCircle, XCircle, Calendar } from 'lucide-react';
import { getCallList, createCallAttempt } from '../lib/api';
import type { CallListEntry, CallStatus } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

export default function CallList() {
  const { session } = useAuth();
  const [entries, setEntries] = useState<CallListEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<CallListEntry | null>(null);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callForm, setCallForm] = useState({
    status: 'COMPLETED' as CallStatus,
    notes: '',
    next_follow_up: ''
  });

  useEffect(() => {
    loadCallList();
  }, []);

  const loadCallList = async () => {
    try {
      setIsLoading(true);
      const data = await getCallList();
      setEntries(data);
    } catch (err) {
      setError('Failed to load call list');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCallComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntry) return;

    try {
      await createCallAttempt({
        pipeline_entry_id: selectedEntry.id,
        status: callForm.status,
        notes: callForm.notes,
        next_follow_up: callForm.next_follow_up ? new Date(callForm.next_follow_up) : undefined
      });

      setShowCallModal(false);
      setSelectedEntry(null);
      setCallForm({
        status: 'COMPLETED',
        notes: '',
        next_follow_up: ''
      });
      await loadCallList();
    } catch (err) {
      setError('Failed to save call attempt');
      console.error(err);
    }
  };

  const getStatusBadge = (status: CallStatus) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Completed</span>;
      case 'NO_ANSWER':
        return <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">No Answer</span>;
      case 'RESCHEDULED':
        return <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Rescheduled</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">Pending</span>;
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Daily Call List</h1>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Today's Calls</h2>
            <div className="text-sm text-gray-500">
              Target: 5 calls per day
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No calls scheduled for today
            </div>
          ) : (
            <div className="space-y-4">
              {entries.slice(0, 5).map(entry => (
                <div
                  key={entry.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{entry.prospect_name}</h3>
                      <div className="text-sm text-gray-500">
                        ${entry.value.toLocaleString()} - {entry.stage}
                      </div>
                      {entry.latest_attempt && (
                        <div className="mt-1 flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-500">
                            Last called: {format(new Date(entry.latest_attempt.attempt_date), 'MMM d, yyyy')}
                          </span>
                          {getStatusBadge(entry.latest_attempt.status)}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedEntry(entry);
                        setShowCallModal(true);
                      }}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-500 hover:bg-orange-600"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Log Call
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Call Log Modal */}
      {showCallModal && selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              Log Call - {selectedEntry.prospect_name}
            </h3>
            <form onSubmit={handleCallComplete} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Call Status
                </label>
                <select
                  value={callForm.status}
                  onChange={(e) => setCallForm(prev => ({ ...prev, status: e.target.value as CallStatus }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                >
                  <option value="COMPLETED">Completed</option>
                  <option value="NO_ANSWER">No Answer</option>
                  <option value="RESCHEDULED">Rescheduled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  value={callForm.notes}
                  onChange={(e) => setCallForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                  placeholder="Add any notes about the call..."
                />
              </div>

              {(callForm.status === 'NO_ANSWER' || callForm.status === 'RESCHEDULED') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Next Follow-up
                  </label>
                  <input
                    type="datetime-local"
                    value={callForm.next_follow_up}
                    onChange={(e) => setCallForm(prev => ({ ...prev, next_follow_up: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
              )}

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCallModal(false);
                    setSelectedEntry(null);
                    setCallForm({
                      status: 'COMPLETED',
                      notes: '',
                      next_follow_up: ''
                    });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-md"
                >
                  Save Call Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
