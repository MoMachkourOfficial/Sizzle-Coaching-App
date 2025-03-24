import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { getUserAssignments, updateAssignmentStatus } from '../lib/api';
import type { AssignmentWithDetails } from '../lib/types';

export default function Assignments() {
  const [assignments, setAssignments] = useState<AssignmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAssignments();
  }, []);

  async function loadAssignments() {
    try {
      const data = await getUserAssignments();
      setAssignments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleComplete(assignmentId: string, currentStatus: boolean) {
    try {
      await updateAssignmentStatus(assignmentId, !currentStatus);
      await loadAssignments(); // Reload to get updated data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update assignment');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">My Assignments</h1>

      <div className="space-y-4">
        {assignments.map((assignment) => (
          <div
            key={assignment.id}
            className="bg-white rounded-lg shadow-md p-6 space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {assignment.session.program.name} - Session {assignment.session.session_number}
                </h3>
                <p className="text-sm text-gray-500">
                  {assignment.session.title}
                </p>
              </div>
              <button
                onClick={() => handleToggleComplete(assignment.id, assignment.completed)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  assignment.completed
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {assignment.completed ? (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    <span>Completed</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5" />
                    <span>Mark Complete</span>
                  </>
                )}
              </button>
            </div>

            {assignment.session.description && (
              <div className="prose prose-sm max-w-none text-gray-600">
                <p>{assignment.session.description}</p>
              </div>
            )}

            {assignment.completed && assignment.completed_at && (
              <div className="text-sm text-gray-500">
                Completed on {new Date(assignment.completed_at).toLocaleDateString()}
              </div>
            )}
          </div>
        ))}

        {assignments.length === 0 && (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-600">No assignments have been assigned to you yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
