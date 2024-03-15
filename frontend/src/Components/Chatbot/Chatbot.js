import React, { useState, useEffect } from 'react';
import { AiFillRobot } from 'react-icons/ai'; // Example icon for GPT-3.5
import { BsFillLightningFill } from 'react-icons/bs'; // Example icon for GPT-4
import GPTToggle from '../GPTToggle/GPTToggle'; // Adjust the path as necessary
import { FaStar } from 'react-icons/fa';
import { FiSend } from 'react-icons/fi';

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [gptVersion, setGptVersion] = useState("3.5"); // State to track GPT version
  const handleVersionChange = ({ version, isWolframActive }) => {
    // Concatenate "(WGPT-4)" to the version string if Wolfram is active
    const versionString = version === "4" && isWolframActive ? "WGPT-4" : version;
    setGptVersion(versionString);
  };
  // Moved stars state and generation to useEffect to prevent re-rendering on input
  const [stars, setStars] = useState([]);

  useEffect(() => {
    const generatedStars = Array.from({ length: 500 }).map(() => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      animationDuration: `${Math.random() * 3 + 2}s`,
    }));
    setStars(generatedStars);
  }, []);
  
// Later in sendMessage function
const sendMessage = (e) => {
  e.preventDefault();
  if (!input.trim()) return;

  const newUserMessage = { text: input, sender: 'user' };
  let newBotMessageText;

  // Use the adjusted gptVersion state to check for WGPT-4 or GPT-3.5
  if (gptVersion === "WGPT-4") {
    newBotMessageText = `WGPT-4 Echo: ${input}`;
  } else if (gptVersion === "3.5") {
    newBotMessageText = `GPT-3.5 Echo: ${input}`;
  } else {
    newBotMessageText = `GPT-4 Echo: ${input}`;
  }

  const newBotMessage = { text: newBotMessageText, sender: 'bot' };
  setMessages((currentMessages) => [...currentMessages, newUserMessage, newBotMessage]);
  setInput('');
};

  return (
    <div className={`background flex flex-col h-screen items-center justify-center p-4 ${darkMode ? 'dark' : ''}`}>
      {/* <button onClick={() => setDarkMode(!darkMode)} className="absolute top-5 right-5 bg-gray-200 dark:bg-gray-700 p-2 rounded-full">Toggle Dark Mode</button> */}
      <div className="text-4xl font-bold mb-0 flex items-center text-white">
        CalcWiz
      </div>
      <GPTToggle onVersionChange={handleVersionChange} />
      <div 
        className="flex flex-col w-3/4 max-w-2xl border-0 rounded-lg shadow-lg relative z-10"
        style={{
          backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(18, 22, 31, 0.8)',
        }}
      >        
      <div className="messages-container overflow-y-auto p-6" style={{ maxHeight: '65vh' }}>
          {messages.map((msg, index) => (
            <div key={index} className={`p-3 my-2 rounded-lg text-white ${msg.sender === 'user' ? 'ml-auto' : 'bg-gray-700 dark:bg-gray-600 mr-auto'}`}
                style={msg.sender === 'user' ? { background: 'linear-gradient(to right, #8111cb,#5211cb,#4311cb)'} : {}}>
              {msg.text}
            </div>

          ))}
        </div>
        <form onSubmit={sendMessage} className="flex p-3 border-t dark:border-gray-700">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message here..."
            className="flex-1 rounded p-2 mr-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 dark:bg-gray-700 dark:text-white"
          />
          <button
            type="submit"
            className="transform transition duration-150 ease-in-out hover:scale-110 bg-blue-500 hover:bg-blue-600 dark:bg-blue-700 dark:hover:bg-blue-800 text-white font-bold py-2 px-4 rounded flex items-center justify-center"
          >
            <FiSend className="h-6 w-6" />
          </button>
        </form>
      </div>
      {/* Render stars outside the chatbot container */}
      {stars.map((star, index) => (
        <div
          key={index}
          className="star"
          style={{
            top: star.top,
            left: star.left,
            animationDuration: star.animationDuration,
          }}
        ></div>
      ))}
    </div>
  );
};

export default Chatbot;