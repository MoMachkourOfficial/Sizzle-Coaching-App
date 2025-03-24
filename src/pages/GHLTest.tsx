import React, { useState } from 'react';
import { getLocations, getContacts, getPipelines, getOpportunities } from '../lib/ghl';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function GHLTest() {
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const testLocations = async () => {
    setLoading(true);
    setError(null);
    setApiResponse(null);
    
    try {
      const response = await getLocations();
      setApiResponse({
        endpoint: '/locations/',
        response: response
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('API Test Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const testContacts = async () => {
    setLoading(true);
    setError(null);
    setApiResponse(null);
    
    try {
      const response = await getContacts(1, 10);
      setApiResponse({
        endpoint: '/contacts/',
        locationId: 'If7RlbDkb7KAVAB03iaw',
        response: response
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('API Test Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const testPipelines = async () => {
    setLoading(true);
    setError(null);
    setApiResponse(null);
    
    try {
      const response = await getPipelines();
      setApiResponse({
        endpoint: '/pipelines/',
        response: response
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('API Test Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const testOpportunities = async () => {
    setLoading(true);
    setError(null);
    setApiResponse(null);
    
    try {
      // First get pipelines to get a pipeline ID
      const pipelines = await getPipelines();
      if (!pipelines.length) {
        throw new Error('No pipelines found');
      }

      const pipelineId = pipelines[0].id;
      const response = await getOpportunities(pipelineId, 1, 10);
      setApiResponse({
        endpoint: '/opportunities/',
        pipelineId,
        response: response
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('API Test Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          to="/"
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">GHL API Test</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-2">API Configuration</h2>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm font-mono break-all">
                API Key: {import.meta.env.VITE_GHL_API_KEY ? 
                  `${import.meta.env.VITE_GHL_API_KEY.substring(0, 10)}...` : 
                  'Not configured'}
              </p>
              <p className="text-sm font-mono mt-2">
                Base URL: services.leadconnectorhq.com
              </p>
              <p className="text-sm font-mono mt-2">
                Location ID: If7RlbDkb7KAVAB03iaw
              </p>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={testLocations}
              disabled={loading}
              className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50"
            >
              Test Locations API
            </button>
            <button
              onClick={testContacts}
              disabled={loading}
              className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50"
            >
              Test Contacts API
            </button>
            <button
              onClick={testPipelines}
              disabled={loading}
              className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50"
            >
              Test Pipelines API
            </button>
            <button
              onClick={testOpportunities}
              disabled={loading}
              className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50"
            >
              Test Opportunities API
            </button>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-md">
              <h3 className="font-semibold">Error</h3>
              <p className="mt-1">{error}</p>
            </div>
          )}

          {apiResponse && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">API Response</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm font-mono mb-2">Endpoint: {apiResponse.endpoint}</p>
                {apiResponse.pipelineId && (
                  <p className="text-sm font-mono mb-2">Pipeline ID: {apiResponse.pipelineId}</p>
                )}
                <pre className="text-sm overflow-auto max-h-96">
                  {JSON.stringify(apiResponse.response, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
