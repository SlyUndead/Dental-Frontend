import React, { useState, useRef, useEffect } from 'react';
import { Popover, PopoverBody } from 'reactstrap';
import sessionManager from "utils/sessionManager"

const DentalChatPopup = ({ isOpen, toggle, target }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [promptTemplate, setPromptTemplate] = useState("");
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const apiUrl = process.env.REACT_APP_NODEAPIURL;

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    setPromptTemplate(`${localStorage.getItem('promptTemplate') || "You are an expert in dentistry"}`);
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Use setTimeout to ensure DOM is updated before scrolling
      setTimeout(scrollToBottom, 0);
    }
  }, [messages, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMessage = { text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Call backend API with the custom prompt template
      const response = await fetch(`${apiUrl}/chat-with-rag`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: sessionManager.getItem('token')
        },
        body: JSON.stringify({
          query: input,
          promptTemplate: promptTemplate
        }),
      });

      const data = await response.json();

      // Add bot message
      setMessages(prev => [...prev, { text: data.answer, sender: 'bot' }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        text: 'Sorry, I encountered an error. Please try again.',
        sender: 'bot',
        isError: true
      }]);
    } finally {
      setIsLoading(false);
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
      style={{ width: '100%' }}
    >
      <div
        className="bg-white rounded-lg shadow-xl"
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '500px',
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
          <button
            onClick={toggle}
            className="text-black hover:text-black bg-primary border-0"
            aria-label="Close"
          >
            X
          </button>
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
          {messages.length === 0 ? (
            <div className="text-center text-black mt-3 mb-auto">
              Ask me anything about dental terms and procedures!
            </div>
          ) : (
            <>
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`mb-3 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}
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
        <form
          onSubmit={handleSubmit}
          className="border-t"
          style={{
            padding: '12px',
            flexShrink: 0
          }}
        >
          <div className="flex">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a dental question..."
              className="flex-1 border rounded-l-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="bg-primary hover:bg-primary text-black px-3 py-2 rounded-r-lg"
              disabled={isLoading}
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </Popover>
  );
};

export default DentalChatPopup;