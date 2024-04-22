import React, { useState, useEffect } from 'react';
import { AiFillRobot } from 'react-icons/ai'; // Example icon for GPT-3.5
import { BsFillLightningFill } from 'react-icons/bs'; // Example icon for GPT-4
import GPTToggle from '../GPTToggle/GPTToggle'; // Adjust the path as necessary
import { FaStar } from 'react-icons/fa';
import { FiSend } from 'react-icons/fi';
import axios from 'axios';
import LatexContent from '../LatexContent/LatexContent'; // Adjust the path as necessary
import './Chatbot.css';

const BotResponsePlaceholder = () => (
  <div className="p-3 my-2 rounded-lg bg-gray-800 dark:bg-gray-800 mr-auto">
    <TypingIndicator />
  </div>
);

const TypingIndicator = () => (
  <div className="flex items-center space-x-2">
    <div className="typing-dot"></div>
    <div className="typing-dot"></div>
    <div className="typing-dot"></div>
  </div>
);

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [gptVersion, setGptVersion] = useState("3.5"); // State to track GPT version
  const [isBotTyping, setIsBotTyping] = useState(false); // State to track bot typing status

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

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newUserMessage = { text: input, sender: 'user', type: 'text' };
    setMessages(currentMessages => [...currentMessages, newUserMessage]);
    setInput(''); // Clear input field after sending the message

    setIsBotTyping(true); // Set bot typing status to true

    if (gptVersion === "4") {
      try {
        const backendResponse = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/assist-query`, { input });
        // Expecting an array of responses now, instead of a single response string
        const responses = backendResponse.data.responses || [];

        responses.forEach(response => {
          let content = response.content;
          const type = response.type;

          // For image responses, construct the full URL to the image
          if (type === "image") {
            content = `${process.env.REACT_APP_API_BASE_URL}${content}`; // Adjust this if necessary for your deployment environment
          }

          const newBotMessage = { text: content, sender: 'bot', type: type };
          setMessages(currentMessages => [...currentMessages, newBotMessage]);
        });
      } catch (error) {
        console.error('Backend API error:', error);
        setMessages(currentMessages => [...currentMessages, { text: 'Error accessing backend API for GPT-4.', sender: 'bot', type: 'text' }]);
      }
    } 
    else if (gptVersion === "WGPT-4") {
      try {
        // Adjust the URL to where your Flask app is hosted, if not localhost or if on a different port
        const backendResponse = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/wgpt4-query`, { input });
        
        // Use the 'response' field from your backend's JSON response as the bot's message
        const wolframResponse = backendResponse.data.response || "Sorry, I couldn't retrieve data from Wolfram.";
        const newBotMessage = { text: wolframResponse, sender: 'bot', type: 'text' };
        setMessages(currentMessages => [...currentMessages, newBotMessage]);
      } catch (error) {
        console.error('Backend API error:', error);
        setMessages(currentMessages => [...currentMessages, { text: 'Error accessing backend API.', sender: 'bot' }]);
      }
    } else {
      // For GPT-3.5 or GPT-4 without Wolfram, handle as before or integrate similar backend logic
      let responseText = `Echo: ${input}`;
      if (gptVersion.includes("3.5")) {
        responseText = `GPT-3.5 Echo: ${input}`;
      }
      const newBotMessage = { text: responseText, sender: 'bot' };
      setMessages(currentMessages => [...currentMessages, newBotMessage]);
    }

    setIsBotTyping(false); // Set bot typing status to false after receiving the response
  };

  const renderMessageContent = (msg) => {
    if (msg.type === 'text') {
      // Split text into parts, keeping LaTeX content separate
      const regex = /(\\\[.*?\\\]|\\\..*?\\\])/g; // Match both inline (\(...\)) and block (\[...\]) LaTeX
      const parts = msg.text.split(regex);
  
      return parts.map((part, index) => {
        if (part.startsWith('\\(') || part.startsWith('\\[')) {
          // Detected LaTeX content, render with LatexContent
          const inline = part.startsWith('\\(');
          const latexString = part.substring(2, part.length - 2); // Remove the delimiters
          return <LatexContent key={index} latexString={latexString} inline={inline} />;
        } else {
          // Regular text, render directly
          return <span key={index}>{part}</span>;
        }
      });
    } else if (msg.type === 'image') {
      return <img src={msg.text} alt="Content" style={{ maxWidth: '100%', height: 'auto' }} />;
    } else {
      return <span>Unsupported message type: {msg.type}</span>;
    }
  };

  return (
    <div className={`background flex flex-col h-screen items-center justify-center p-4 ${darkMode ? 'dark' : ''}`}>
      <div className="text-4xl font-bold mb-0 flex items-center text-white">
        CalcWiz 🧙‍♂️
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
            <div key={index} className={`p-3 my-2 rounded-lg text-white ${msg.sender === 'user' ? 'ml-auto' : 'bg-gray-800 dark:bg-gray-800 mr-auto'}`}
                style={msg.sender === 'user' ? { background: 'linear-gradient(to right, #8111cb,#5211cb,#4311cb)'} : {}}>
              {renderMessageContent(msg)}
            </div>
          ))}
          {isBotTyping && <BotResponsePlaceholder />}
        </div>
        <form onSubmit={sendMessage} className="flex p-3 border-t dark:border-gray-800">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message here...✨"
            className="flex-1 rounded p-2 mr-2 bg-gray-800 dark:border-gray-600 dark:bg-gray-800 dark:text-white purple-gradient-border"
          />
        <button
          type="submit"
          className="transform transition duration-150 ease-in-out hover:scale-110 text-white font-bold py-2 px-4 rounded flex items-center justify-center purple-gradient-button"
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