import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Search, 
  UserPlus, 
  Phone, 
  Mail, 
  Tag,
  Calendar,
  Building
} from 'lucide-react';
import { getContacts, searchContacts, type GHLContact } from '../lib/ghl';
import { createPipelineEntry } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export default function Contacts() {
  const { session } = useAuth();
  const [contacts, setContacts] = useState<GHLContact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddToPipelineModal, setShowAddToPipelineModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<GHLContact | null>(null);
  const [pipelineForm, setPipelineForm] = useState({
    value: '',
    target_amount: '',
    event_type: ''
  });

  useEffect(() => {
    loadContacts();
  }, [currentPage]);

  const loadContacts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!import.meta.env.VITE_GHL_API_KEY) {
        throw new Error('GHL API key is not configured. Please check your environment variables.');
      }

      const response = await getContacts(currentPage);
      setContacts(response.contacts);
      setTotalPages(response.meta.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contacts');
      console.error('Error loading contacts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadContacts();
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const results = await searchContacts(searchQuery);
      setContacts(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search contacts');
      console.error('Error searching contacts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToPipeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact || !session?.user?.id) return;

    try {
      const value = parseFloat(pipelineForm.value);
      const targetAmount = parseFloat(pipelineForm.target_amount);

      if (isNaN(value) || value <= 0) {
        throw new Error('Please enter a valid value');
      }

      if (isNaN(targetAmount) || targetAmount <= 0) {
        throw new Error('Please enter a valid target amount');
      }

      await createPipelineEntry({
        user_id: session.user.id,
        prospect_name: `${selectedContact.firstName} ${selectedContact.lastName}`,
        value,
        target_amount: targetAmount,
        event_type: pipelineForm.event_type,
        stage: 'LEADS',
        status: 'OPEN'
      });

      setShowAddToPipelineModal(false);
      setSelectedContact(null);
      setPipelineForm({ value: '', target_amount: '', event_type: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add to pipeline');
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
          <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Search Bar */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contacts..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Search
          </button>
        </div>

        {/* Contacts List */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
          </div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No contacts found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {contact.firstName} {contact.lastName}
                    </h3>
                    <div className="mt-1 space-y-1">
                      {contact.email && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-4 w-4 mr-2" />
                          {contact.email}
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-4 w-4 mr-2" />
                          {contact.phone}
                        </div>
                      )}
                      {contact.tags && contact.tags.length > 0 && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Tag className="h-4 w-4 mr-2" />
                          {contact.tags.join(', ')}
                        </div>
                      )}
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        Added: {new Date(contact.dateAdded).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedContact(contact);
                      setShowAddToPipelineModal(true);
                    }}
                    className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 transition-colors"
                  >
                    Add to Pipeline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!searchQuery && totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Add to Pipeline Modal */}
      {showAddToPipelineModal && selectedContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              Add {selectedContact.firstName} {selectedContact.lastName} to Pipeline
            </h3>
            <form onSubmit={handleAddToPipeline} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Current Value
                </label>
                <input
                  type="number"
                  value={pipelineForm.value}
                  onChange={(e) => setPipelineForm(prev => ({ ...prev, value: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Target Amount
                </label>
                <input
                  type="number"
                  value={pipelineForm.target_amount}
                  onChange={(e) => setPipelineForm(prev => ({ ...prev, target_amount: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Event Type
                </label>
                <select
                  value={pipelineForm.event_type}
                  onChange={(e) => setPipelineForm(prev => ({ ...prev, event_type: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                >
                  <option value="">Select Event Type</option>
                  <option value="Networking">Networking</option>
                  <option value="Seminar">Seminar</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Live Event">Live Event</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddToPipelineModal(false);
                    setSelectedContact(null);
                    setPipelineForm({ value: '', target_amount: '', event_type: '' });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-md"
                >
                  Add to Pipeline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
