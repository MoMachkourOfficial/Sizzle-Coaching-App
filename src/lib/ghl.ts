import { GHLContact, GHLContactsResponse, GHLLocation, GHLOpportunity, GHLPipeline, GHLOpportunityResponse, GHLTask } from './types';

const GHL_API_URL = 'https://services.leadconnectorhq.com';
const DEFAULT_LOCATION_ID = 'If7RlbDkb7KAVAB03iaw';

function getHeaders(lastModified?: string | null) {
  const apiKey = import.meta.env.VITE_GHL_API_KEY;
  if (!apiKey) {
    throw new Error('GHL API key is not configured');
  }

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${apiKey}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Version': '2021-07-28'
  };

  if (lastModified) {
    headers['If-Modified-Since'] = lastModified;
  }

  return headers;
}

export async function getLocations(): Promise<GHLLocation[]> {
  try {
    const headers = getHeaders();
    const response = await fetch(
      `${GHL_API_URL}/locations/`,
      { 
        method: 'GET',
        headers,
        mode: 'cors',
        credentials: 'omit'
      }
    );
    
    if (response.status === 401) {
      throw new Error('Invalid or expired API key. Please check your GHL API key configuration.');
    }

    if (response.status === 422) {
      return [];
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.locations || [];
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Unable to connect to Go High Level API. Please check your internet connection and API configuration.');
    }
    console.error('Error fetching GHL locations:', error);
    throw error;
  }
}

export async function getContacts(page = 1, limit = 100): Promise<GHLContactsResponse> {
  try {
    const headers = getHeaders();
    const response = await fetch(
      `${GHL_API_URL}/contacts/?locationId=${DEFAULT_LOCATION_ID}&page=${page}&limit=${limit}`,
      { 
        method: 'GET',
        headers,
        mode: 'cors',
        credentials: 'omit'
      }
    );
    
    if (response.status === 401) {
      throw new Error('Invalid or expired API key. Please check your GHL API key configuration.');
    }

    if (response.status === 422) {
      return {
        contacts: [],
        meta: { total: 0, count: 0, currentPage: page, totalPages: 1 }
      };
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      contacts: data.contacts || [],
      meta: data.meta || { total: 0, count: 0, currentPage: page, totalPages: 1 }
    };
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Unable to connect to Go High Level API. Please check your internet connection and API configuration.');
    }
    console.error('Error fetching GHL contacts:', error);
    throw error;
  }
}

export async function searchContacts(query: string, pageLimit: number = 10): Promise<GHLContact[]> {
  try {
    const headers = getHeaders();
    const response = await fetch(
      `${GHL_API_URL}/contacts/search`,
      { 
        method: 'POST',
        headers,
        mode: 'cors',
        credentials: 'omit',
        body: JSON.stringify({
          locationId: DEFAULT_LOCATION_ID,
          pageLimit,
          query
        })
      }
    );
    
    if (response.status === 401) {
      throw new Error('Invalid or expired API key. Please check your GHL API key configuration.');
    }

    if (response.status === 422) {
      return [];
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.contacts || [];
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Unable to connect to Go High Level API. Please check your internet connection and API configuration.');
    }
    console.error('Error searching GHL contacts:', error);
    throw error;
  }
}

export async function createContact(contact: Partial<GHLContact>): Promise<GHLContact> {
  try {
    const headers = getHeaders();
    const response = await fetch(
      `${GHL_API_URL}/contacts/?locationId=${DEFAULT_LOCATION_ID}`,
      {
        method: 'POST',
        headers,
        mode: 'cors',
        credentials: 'omit',
        body: JSON.stringify(contact)
      }
    );
    
    if (response.status === 401) {
      throw new Error('Invalid or expired API key. Please check your GHL API key configuration.');
    }

    if (response.status === 422) {
      return {} as GHLContact;
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Unable to connect to Go High Level API. Please check your internet connection and API configuration.');
    }
    console.error('Error creating GHL contact:', error);
    throw error;
  }
}

export async function updateContact(id: string, contact: Partial<GHLContact>): Promise<GHLContact> {
  try {
    const headers = getHeaders();
    const response = await fetch(
      `${GHL_API_URL}/contacts/${id}?locationId=${DEFAULT_LOCATION_ID}`,
      {
        method: 'PUT',
        headers,
        mode: 'cors',
        credentials: 'omit',
        body: JSON.stringify(contact)
      }
    );
    
    if (response.status === 401) {
      throw new Error('Invalid or expired API key. Please check your GHL API key configuration.');
    }

    if (response.status === 422) {
      return {} as GHLContact;
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Unable to connect to Go High Level API. Please check your internet connection and API configuration.');
    }
    console.error('Error updating GHL contact:', error);
    throw error;
  }
}

export async function getPipelines(): Promise<GHLPipeline[]> {
  try {
    const headers = getHeaders();
    const response = await fetch(
      `${GHL_API_URL}/pipelines/?locationId=${DEFAULT_LOCATION_ID}`,
      {
        method: 'GET',
        headers,
        mode: 'cors',
        credentials: 'omit'
      }
    );

    if (response.status === 401) {
      throw new Error('Invalid or expired API key. Please check your GHL API key configuration.');
    }

    if (response.status === 422) {
      return [];
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.pipelines || [];
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Unable to connect to Go High Level API. Please check your internet connection and API configuration.');
    }
    console.error('Error fetching GHL pipelines:', error);
    throw error;
  }
}

export async function getOpportunities(pipelineId?: string, lastModified?: string | null): Promise<GHLOpportunityResponse & { notModified?: boolean; lastModified?: string }> {
  try {
    const headers = getHeaders(lastModified);
    const url = new URL(`${GHL_API_URL}/opportunities/`);
    url.searchParams.append('locationId', DEFAULT_LOCATION_ID);
    if (pipelineId) {
      url.searchParams.append('pipelineId', pipelineId);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
      mode: 'cors',
      credentials: 'omit'
    });

    // Handle 304 Not Modified
    if (response.status === 304) {
      return { 
        opportunities: [],
        notModified: true,
        meta: {
          total: 0,
          count: 0,
          currentPage: 1,
          totalPages: 1,
          nextPageUrl: null
        }
      };
    }

    if (response.status === 401) {
      throw new Error('Invalid or expired API key. Please check your GHL API key configuration.');
    }

    if (response.status === 422) {
      return {
        opportunities: [],
        meta: {
          total: 0,
          count: 0,
          currentPage: 1,
          totalPages: 1,
          nextPageUrl: null
        }
      };
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
      opportunities: data.opportunities.map((opp: any) => ({
        id: opp.id,
        title: opp.name,
        value: opp.monetaryValue,
        status: opp.status,
        stage: opp.pipelineStageId,
        pipelineId: opp.pipelineId,
        contactId: opp.contactId,
        contact: opp.contact ? {
          id: opp.contact.id,
          firstName: opp.contact.name?.split(' ')[0] || '',
          lastName: opp.contact.name?.split(' ').slice(1).join(' ') || '',
          email: opp.contact.email,
          tags: opp.contact.tags || []
        } : undefined,
        dateAdded: opp.createdAt,
        dateUpdated: opp.updatedAt,
        customFields: opp.customFields || {},
        notes: '',
        tags: []
      })),
      meta: {
        total: data.meta.total || 0,
        count: data.opportunities?.length || 0,
        currentPage: data.meta.currentPage || 1,
        totalPages: Math.ceil((data.meta.total || 0) / 100),
        nextPageUrl: data.meta.nextPageUrl || null
      },
      lastModified: response.headers.get('Last-Modified') || undefined
    };
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Unable to connect to Go High Level API. Please check your internet connection and API configuration.');
    }
    console.error('Error fetching GHL opportunities:', error);
    throw error;
  }
}

export async function createOpportunity(opportunity: Partial<GHLOpportunity>): Promise<GHLOpportunity> {
  try {
    const headers = getHeaders();
    const response = await fetch(
      `${GHL_API_URL}/opportunities/?locationId=${DEFAULT_LOCATION_ID}`,
      {
        method: 'POST',
        headers,
        mode: 'cors',
        credentials: 'omit',
        body: JSON.stringify(opportunity)
      }
    );

    if (response.status === 401) {
      throw new Error('Invalid or expired API key. Please check your GHL API key configuration.');
    }

    if (response.status === 422) {
      return {} as GHLOpportunity;
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Unable to connect to Go High Level API. Please check your internet connection and API configuration.');
    }
    console.error('Error creating GHL opportunity:', error);
    throw error;
  }
}

export async function updateOpportunity(id: string, opportunity: Partial<GHLOpportunity>): Promise<GHLOpportunity> {
  try {
    const headers = getHeaders();
    const response = await fetch(
      `${GHL_API_URL}/opportunities/${id}?locationId=${DEFAULT_LOCATION_ID}`,
      {
        method: 'PUT',
        headers,
        mode: 'cors',
        credentials: 'omit',
        body: JSON.stringify(opportunity)
      }
    );

    if (response.status === 401) {
      throw new Error('Invalid or expired API key. Please check your GHL API key configuration.');
    }

    if (response.status === 422) {
      return {} as GHLOpportunity;
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Unable to connect to Go High Level API. Please check your internet connection and API configuration.');
    }
    console.error('Error updating GHL opportunity:', error);
    throw error;
  }
}

export async function getTasks(): Promise<GHLTask[]> {
  try {
    const headers = getHeaders();
    const response = await fetch(
      `${GHL_API_URL}/tasks/?locationId=${DEFAULT_LOCATION_ID}`,
      {
        method: 'GET',
        headers,
        mode: 'cors',
        credentials: 'omit'
      }
    );

    if (response.status === 401) {
      throw new Error('Invalid or expired API key');
    }

    if (response.status === 422) {
      return [];
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.tasks || [];
  } catch (error) {
    console.error('Error fetching GHL tasks:', error);
    throw error;
  }
}

export async function createTask(task: Partial<GHLTask>): Promise<GHLTask> {
  try {
    const headers = getHeaders();
    const response = await fetch(
      `${GHL_API_URL}/tasks/?locationId=${DEFAULT_LOCATION_ID}`,
      {
        method: 'POST',
        headers,
        mode: 'cors',
        credentials: 'omit',
        body: JSON.stringify(task)
      }
    );

    if (response.status === 401) {
      throw new Error('Invalid or expired API key');
    }

    if (response.status === 422) {
      return {} as GHLTask;
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating GHL task:', error);
    throw error;
  }
}

export async function updateTask(id: string, task: Partial<GHLTask>): Promise<GHLTask> {
  try {
    const headers = getHeaders();
    const response = await fetch(
      `${GHL_API_URL}/tasks/${id}?locationId=${DEFAULT_LOCATION_ID}`,
      {
        method: 'PUT',
        headers,
        mode: 'cors',
        credentials: 'omit',
        body: JSON.stringify(task)
      }
    );

    if (response.status === 401) {
      throw new Error('Invalid or expired API key');
    }

    if (response.status === 422) {
      return {} as GHLTask;
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating GHL task:', error);
    throw error;
  }
}
