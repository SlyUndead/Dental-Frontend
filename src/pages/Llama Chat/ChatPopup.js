import React, { useState, useRef, useEffect } from 'react';
import { Button, Form, Input, Popover, PopoverBody } from 'reactstrap';
import sessionManager from "utils/sessionManager"
import axios from 'axios';

const DentalChatPopup = ({ isOpen, toggle, target }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const apiUrl = process.env.REACT_APP_NODEAPIURL;
  const patientId = sessionManager.getItem('patientId')

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Use setTimeout to ensure DOM is updated before scrolling
      setTimeout(scrollToBottom, 0);
    }
  }, [messages, isOpen]);

  // Load chat history when popup opens and patientId is available
  useEffect(() => {
    if (isOpen && patientId) {
      loadChatHistory();
    }
  }, [isOpen, patientId]);

  const loadChatHistory = async () => {
    if (!patientId) return;
    
    setIsLoadingHistory(true);
    try {
      const response = await axios.get(`${apiUrl}/get-chat-history`, {
        params: { patientId },
        headers: {
          Authorization: sessionManager.getItem("token")
        }
      });

      if (response.data.success) {
        // Convert timestamp to match existing message format
        const formattedMessages = response.data.messages.map(msg => ({
          text: msg.text,
          sender: msg.sender,
          isError: msg.isError || false,
          timestamp: msg.timestamp
        }));
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const saveChatMessage = async (message) => {
    if (!patientId) return;
    
    try {
      await axios.post(`${apiUrl}/save-chat-message`, {
        patientId,
        message
      }, {
        headers: {
          Authorization: sessionManager.getItem("token")
        }
      });
    } catch (error) {
      console.error('Error saving chat message:', error);
    }
  };

  const startRagJob = async (query) => {
    const response = await axios.post(`${apiUrl}/start-chat-job`, {
      query: query,
    }, {
      headers: {
        Authorization: sessionManager.getItem("token")
      }
    });
    return response.data.jobId;
  };

  const pollRagJob = async (jobId, maxRetries = 120, interval = 10000) => {
    for (let i = 0; i < maxRetries; i++) {
      const response = await axios.get(`${apiUrl}/chat-job-status/${jobId}`, {
        headers: {
          Authorization: sessionManager.getItem("token")
        }
      });

      const { status, result, error } = response.data;
      if (status === 'completed') return result;
      if (status === 'failed') throw new Error(error);

      await new Promise(resolve => setTimeout(resolve, interval));
    }

    throw new Error("Job timeout");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMessage = { text: input, sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    
    // Save user message to database
    await saveChatMessage(userMessage);
    
    setInput('');
    setIsLoading(true);

    try {
      // Call backend API with the custom prompt template
      const jobId = await startRagJob(input);
      const ragText = await pollRagJob(jobId);

      // Add bot message
      const botMessage = { 
        text: ragText.answer, 
        sender: 'bot', 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, botMessage]);
      
      // Save bot message to database
      await saveChatMessage(botMessage);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        text: 'Sorry, I encountered an error. Please try again.',
        sender: 'bot',
        isError: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      
      // Save error message to database
      await saveChatMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChatHistory = async () => {
    if (!patientId) return;
    
    try {
      await axios.delete(`${apiUrl}/clear-chat-history`, {
        data: { patientId },
        headers: {
          Authorization: sessionManager.getItem("token")
        }
      });
      setMessages([]);
    } catch (error) {
      console.error('Error clearing chat history:', error);
    }
  };

  return (
    <Popover
      isOpen={isOpen}
      toggle={toggle}
      target={target}
      trigger="click"
      placement="bottom"
      className="dental-chat-popover"
      style={{ width: '60vw', marginLeft:'-30vw' }}
    >
      <div
        className="bg-white rounded-lg shadow-xl"
        style={{
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '80vh'
        }}
      >
        {/* Header */}
        <div
          className="flex justify-between items-center border-b"
          style={{
            padding: '12px',
            flexShrink: 0
          }}
        >
          <h5 className="m-0 font-semibold">Dental Assistant</h5>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <Button
                onClick={clearChatHistory}
                className="text-red-600 hover:text-red-800 bg-transparent border-0 p-1"
                title="Clear chat history"
                style={{ fontSize: '12px' }}
              >
                Clear
              </Button>
            )}
            <Button
              onClick={toggle}
              className="text-black hover:text-black bg-primary border-0"
              aria-label="Close"
            >
              X
            </Button>
          </div>
        </div>

        {/* Messages Container - This is the scrollable area */}
        <div
          ref={messagesContainerRef}
          style={{
            flex: '1 1 auto',
            overflowY: 'auto',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {isLoadingHistory ? (
            <div className="text-center text-black mt-3" style={{fontSize:'16px'}}>
              Loading chat history...
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-black mt-3 mb-auto" style={{fontSize:'20px'}}>
              Ask me anything about dental terms and procedures!
            </div>
          ) : (
            <>
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`mb-3 rounded-lg ${msg.sender === 'user' ? 'text-right bg-primary' : 'text-left bg-secondary'}`}
                  style={{fontSize:'16px'}}
                >
                  <div
                    className={`inline-block px-3 py-2 rounded-lg ${msg.sender === 'user'
                      ? 'bg-blue-600 text-black'
                      : msg.isError
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-black'
                      }`}
                    style={{
                      maxWidth: '85%',
                      wordBreak: 'break-word'
                    }}
                  >
                    {msg.sender === 'user' ? "You:    " + msg.text : "Dental AI:    " + msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="text-left mb-3">
                  <div className="inline-block px-3 py-2 rounded-lg bg-gray-100">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Form */}
        <Form
          onSubmit={handleSubmit}
          className="border-t"
          style={{
            padding: '12px',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', width: '100%', gap: '8px' }}>
            <Input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a dental question..."
              disabled={isLoading || isLoadingHistory}
              style={{
                flex: '1',
                border: '1px solid #ccc',
                borderRadius: '4px',
                padding: '8px 12px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#007bff'}
              onBlur={(e) => e.target.style.borderColor = '#ccc'}
            />
            <Button
              type="submit"
              disabled={isLoading || isLoadingHistory}
              style={{
                backgroundColor: 'var(--bs-primary, #007bff)',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 16px',
                color: 'white',
                fontSize: '14px',
                cursor: (isLoading || isLoadingHistory) ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              Send
            </Button>
          </div>
        </Form>
      </div>
    </Popover>
  );
};

export default DentalChatPopup;