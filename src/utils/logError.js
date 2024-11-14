export const logErrorToServer = async (error,functionName) => {
  try {
    const apiUrl = process.env.REACT_APP_NODEAPIURL;
    const errorData = {
      message: error.message,         // The error message
      stack: error.stack,             // The stack trace
      name: error.name,               // The error name (e.g., "Error", "TypeError")
      details: error.details || null, // Custom details if available
      // You can also include other contextual information like:
      timestamp: new Date().toISOString(),
      url: window.location.href,      // Current URL (optional)
      passedData: error?.response?.config?.data || null,
      responseData: error?.response?.data || null,
      statusText: error?.response?.statusText || null,
      functionName:functionName
    };

    const response = await fetch(`${apiUrl}/log-error`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: errorData 
      }),
    });

    const data = await response.json();
    if (response.ok) {
      console.log('Error logged successfully');
    } else {
      console.error('Failed to log error:', data.message);
    }
  } catch (err) {
    console.error('Error sending log to server:', err);
  }
};