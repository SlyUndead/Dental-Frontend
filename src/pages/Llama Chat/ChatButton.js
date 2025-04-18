import React from 'react';

const ChatButton = ({ onClick }) => {
  return (
    <button
      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full shadow-lg flex items-center"
      onClick={onClick}
    >
      Chat with Dental Assistant
    </button>
  );
};

export default ChatButton;