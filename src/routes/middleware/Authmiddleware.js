import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";
import sessionManager from "utils/sessionManager";

const Authmiddleware = (props) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const apiUrl = process.env.REACT_APP_NODEAPIURL;

  useEffect(() => {
    const validateToken = async () => {
      // First, try to get session data from other tabs if not available in current tab
      if (!sessionManager.getItem('token')) {
        sessionManager.requestSessionData();
        // Small delay to allow other tabs to respond
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const token = sessionManager.getItem('token');

      if (token) {
        try {
          // Validate token with server
          const response = await axios.get(`${apiUrl}/getCDTCodes`, {
            headers: {
              Authorization: `${token}`
            }
          });

          if (response.status === 200) {
            setIsAuthenticated(true);
          } else {
            // Token is invalid
            sessionManager.clearSession();
            setIsAuthenticated(false);
          }
        } catch (error) {
          // Token validation failed
          console.error('Token validation failed:', error);
          sessionManager.clearSession();
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }

      setIsLoading(false);
    };

    // Listen for session changes from other tabs
    const handleSessionChange = (type, sessionData) => {
      if (type === 'login' && sessionData.token) {
        setIsAuthenticated(true);
      } else if (type === 'logout') {
        setIsAuthenticated(false);
      }
    };

    const removeListener = sessionManager.addEventListener(handleSessionChange);
    
    validateToken();

    // Cleanup
    return () => {
      removeListener();
    };
  }, [apiUrl]);

  // Show loading spinner while validating
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Render protected content if authenticated
  return (
    <React.Fragment>
      {props.children}
    </React.Fragment>
  );
};

export default Authmiddleware;