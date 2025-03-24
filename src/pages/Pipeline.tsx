import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  DollarSign, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  GripVertical,
  ChevronRight,
  ChevronLeft,
  Loader2
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { getPipelines, getOpportunities, createOpportunity, updateOpportunity } from '../lib/ghl';
import type { GHLPipeline, GHLOpportunity, GHLPipelineStage } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

export default function Pipeline() {
  const { session } = useAuth();
  const [pipeline, setPipeline] = useState<GHLPipeline | null>(null);
  const [opportunities, setOpportunities] = useState<GHLOpportunity[]>([]);
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);
  const [newLead, setNewLead] = useState({
    title: '',
    value: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth] = useState(format(new Date(), 'MMMM yyyy'));

  useEffect(() => {
    loadPipelineData();
  }, []);

  const loadPipelineData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get pipelines first
      const pipelines = await getPipelines();
      if (!pipelines.length) {
        throw new Error('No pipelines found');
      }

      // Use the first pipeline
      const selectedPipeline = pipelines[0];
      setPipeline(selectedPipeline);

      // Get opportunities for this pipeline
      const opportunitiesResponse = await getOpportunities(selectedPipeline.id);
      setOpportunities(opportunitiesResponse.opportunities);
    } catch (err) {
      setError('Failed to load pipeline data. Please try again.');
      console.error('Failed to load pipeline:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStageValue = (stageId: string) => {
    return opportunities
      .filter(opp => opp.stage === stageId)
      .reduce((sum, opp) => sum + (opp.value || 0), 0);
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination || !pipeline) return;

    const { draggableId, source, destination } = result;
    if (source.droppableId === destination.droppableId) return;

    const opportunity = opportunities.find(opp => opp.id === draggableId);
    if (!opportunity) return;

    // Optimistically update UI
    setOpportunities(prev => 
      prev.map(opp => 
        opp.id === draggableId 
          ? { ...opp, stage: destination.droppableId }
          : opp
      )
    );

    try {
      await updateOpportunity(draggableId, {
        stage: destination.droppableId,
        pipelineId: pipeline.id
      });
    } catch (err) {
      setError('Failed to update opportunity. Please try again.');
      console.error('Failed to update opportunity:', err);
      await loadPipelineData(); // Reload to get correct state
    }
  };

  const handleNewLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pipeline) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const value = parseFloat(newLead.value);
      if (isNaN(value) || value <= 0) {
        throw new Error('Please enter a valid value');
      }

      if (!newLead.title.trim()) {
        throw new Error('Please enter a title');
      }

      // Get the first stage of the pipeline
      const firstStage = pipeline.stages[0];
      if (!firstStage) {
        throw new Error('No stages found in pipeline');
      }

      await createOpportunity({
        title: newLead.title.trim(),
        value: value,
        notes: newLead.notes,
        pipelineId: pipeline.id,
        stage: firstStage.id
      });

      setNewLead({ title: '', value: '', notes: '' });
      setShowNewLeadModal(false);
      await loadPipelineData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create opportunity');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!session) {
    return null;
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
          <h1 className="text-3xl font-bold text-gray-900">Sales Pipeline</h1>
          <span className="text-gray-500">({currentMonth})</span>
        </div>
        <button
          onClick={() => setShowNewLeadModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Opportunity
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      ) : !pipeline ? (
        <div className="bg-yellow-50 text-yellow-700 p-4 rounded-lg">
          No pipeline configuration found.
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-6">
            {pipeline.stages.map((stage) => (
              <Droppable key={stage.id} droppableId={stage.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 bg-white rounded-lg shadow-md p-4 min-w-[300px] transition-colors duration-200 ${
                      snapshot.isDraggingOver ? 'bg-orange-50 ring-2 ring-orange-500 ring-opacity-50' : ''
                    }`}
                    style={{
                      borderTop: `3px solid ${stage.color || '#cbd5e1'}`
                    }}
                  >
                    <div className="mb-4">
                      <h2 className="text-lg font-semibold text-gray-900">{stage.name}</h2>
                      <div className="mt-2 text-lg font-bold text-orange-600">
                        ${getStageValue(stage.id).toLocaleString()}
                      </div>
                    </div>
                    <div className="space-y-3">
                      {opportunities
                        .filter(opp => opp.stage === stage.id)
                        .map((opp, index) => (
                          <Draggable
                            key={opp.id}
                            draggableId={opp.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`bg-white p-4 rounded-lg border shadow-sm select-none transition-all duration-200 ${
                                  snapshot.isDragging 
                                    ? 'shadow-lg scale-105 rotate-2 border-orange-500' 
                                    : 'border-gray-200 hover:border-orange-200 hover:shadow'
                                }`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center">
                                      <div
                                        {...provided.dragHandleProps}
                                        className="mr-2 cursor-grab"
                                      >
                                        <GripVertical className="h-4 w-4 text-gray-400" />
                                      </div>
                                      <div className="font-medium text-gray-900">
                                        {opp.title}
                                      </div>
                                    </div>
                                    <div className="text-sm text-gray-600 mt-1">
                                      ${opp.value?.toLocaleString() || '0'}
                                    </div>
                                    {opp.contact && (
                                      <div className="text-xs text-gray-500 mt-2">
                                        Contact: {opp.contact.firstName} {opp.contact.lastName}
                                      </div>
                                    )}
                                    {opp.dateAdded && (
                                      <div className="text-xs text-gray-500 mt-1 flex items-center">
                                        <Calendar className="h-3 w-3 mr-1" />
                                        Added: {format(new Date(opp.dateAdded), 'MMM d, yyyy')}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      )}

      {/* New Opportunity Modal */}
      {showNewLeadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Add New Opportunity</h3>
            {error && (
              <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">
                {error}
              </div>
            )}
            <form onSubmit={handleNewLeadSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  type="text"
                  value={newLead.title}
                  onChange={(e) => setNewLead(prev => ({ ...prev, title: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Value
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    value={newLead.value}
                    onChange={(e) => setNewLead(prev => ({ ...prev, value: e.target.value }))}
                    className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  value={newLead.notes}
                  onChange={(e) => setNewLead(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                  placeholder="Add any notes about this opportunity..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewLeadModal(false);
                    setError(null);
                    setNewLead({ title: '', value: '', notes: '' });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-md disabled:opacity-50"
                >
                  {isSubmitting ? 'Adding...' : 'Add Opportunity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
