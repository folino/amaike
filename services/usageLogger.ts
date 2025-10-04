/**
 * Simple usage logger for tracking user queries during testing
 */

interface UsageLog {
  timestamp: string;
  userQuery: string;
  responseLength: number;
  sourcesFound: number;
  hasCallToAction: boolean;
  sessionId: string;
}

// Generate a simple session ID
const getSessionId = (): string => {
  let sessionId = localStorage.getItem('amaike_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('amaike_session_id', sessionId);
  }
  return sessionId;
};

/**
 * Logs user interaction for testing purposes
 */
export const logUsage = async (userQuery: string, responseLength: number, sourcesFound: number, hasCallToAction: boolean = false): Promise<void> => {
  try {
    const logData: UsageLog = {
      timestamp: new Date().toISOString(),
      userQuery: userQuery.trim(),
      responseLength,
      sourcesFound,
      hasCallToAction,
      sessionId: getSessionId()
    };

    // Log to console for development
    console.log('📊 Usage Log:', logData);

    // Send to external logging service (optional)
    // You can replace this with your preferred logging service
    await sendToLoggingService(logData);
  } catch (error) {
    console.error('Error logging usage:', error);
    // Don't throw error to avoid breaking the main flow
  }
};

/**
 * Sends log data to Airtable
 */
const sendToLoggingService = async (logData: UsageLog): Promise<void> => {
  try {
    const airtableApiKey = import.meta.env.VITE_AIRTABLE_API_KEY;
    const airtableBaseId = import.meta.env.VITE_AIRTABLE_BASE_ID;
    const airtableTableName = import.meta.env.VITE_AIRTABLE_TABLE_NAME || 'Usage Logs';
    
    if (!airtableApiKey || !airtableBaseId) {
      console.log('Airtable not configured, skipping external logging');
      return;
    }

    const airtableUrl = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}`;
    
    console.log('🚀 Sending to Airtable...');
    
    const response = await fetch(airtableUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${airtableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          'Timestamp': new Date().toISOString().split('T')[0], // Try YYYY-MM-DD format
          'User Query': logData.userQuery,
          'Response Length': logData.responseLength,
          'Sources Found': logData.sourcesFound,
          'Has Call to Action': logData.hasCallToAction,
          'Session ID': logData.sessionId,
        }
      }),
    });

    console.log('📡 Airtable response:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Airtable error details:', errorText);
      console.error('❌ Request data sent:', {
        fields: {
          'Timestamp': new Date().toISOString().split('T')[0],
          'User Query': logData.userQuery,
          'Response Length': logData.responseLength,
          'Sources Found': logData.sourcesFound,
          'Has Call to Action': logData.hasCallToAction,
          'Session ID': logData.sessionId,
        }
      });
      throw new Error(`Airtable API error: ${response.status} - ${errorText}`);
    }

    console.log('✅ Log sent to Airtable successfully');
  } catch (error) {
    console.warn('Failed to send log to Airtable:', error);
  }
};

/**
 * Get usage statistics for the current session
 */
export const getSessionStats = (): { sessionId: string; queryCount: number } => {
  const sessionId = getSessionId();
  const queryCount = parseInt(localStorage.getItem('amaike_query_count') || '0');
  return { sessionId, queryCount };
};

/**
 * Increment query counter
 */
export const incrementQueryCount = (): void => {
  const currentCount = parseInt(localStorage.getItem('amaike_query_count') || '0');
  localStorage.setItem('amaike_query_count', (currentCount + 1).toString());
};
