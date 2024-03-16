import React, { useState, useEffect } from 'react';
import { AiFillRobot } from 'react-icons/ai'; // Example icon for GPT-3.5
import { BsFillLightningFill } from 'react-icons/bs'; // Example icon for GPT-4
import GPTToggle from '../GPTToggle/GPTToggle'; // Adjust the path as necessary
import { FaStar } from 'react-icons/fa';
import { FiSend } from 'react-icons/fi';
import axios from 'axios';
import MathJax from '@matejmazur/react-mathjax';

// Utility function to double backslashes in LaTeX strings
function escapeLatexString(latexString) {
  return latexString.replace(/\\/g, '\\\\');
}

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
  
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
  
    const newUserMessage = { text: input, sender: 'user', type: 'text' };
    setMessages(currentMessages => [...currentMessages, newUserMessage]);
    
    if (gptVersion === "4") {
      try {
        const backendResponse = await axios.post(`/assist-query`, { input });
        // Expecting an array of responses now, instead of a single response string
        const responses = backendResponse.data.responses || [];
    
        responses.forEach(response => {
          let content = response.content;
          const type = response.type;
    
          // For image responses, construct the full URL to the image
          if (type === "image") {
            content = `/${content}`; // Adjust this if necessary for your deployment environment
          }
    
          const newBotMessage = { text: content, sender: 'bot', type };
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
        const backendResponse = await axios.post(`/wolframquery`, { input });
        
        // Use the 'response' field from your backend's JSON response as the bot's message
        const wolframResponse = backendResponse.data.response || "Sorry, I couldn't retrieve data from Wolfram.";
        const newBotMessage = { text: wolframResponse, sender: 'bot' };
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
  
    setInput(''); // Clear input after sending
  };

  const renderMessageContent = (msg) => {
    // Detects if the message contains simple LaTeX delimiters
    const containsLatex = (text) => {
      return text.includes('$$') || text.includes('\\(') || text.includes('\\)');
    };
  
    switch (msg.type) {
      case 'text':
        if (containsLatex(msg.text)) {
          // For simplicity, assuming your LaTeX is correctly escaped for HTML
          // WARNING: Only use this if you're sure the content is safe and sanitized
          const latexContent = { __html: msg.text };
          return (
            <MathJax.Context input='tex'>
              <div dangerouslySetInnerHTML={latexContent}></div>
            </MathJax.Context>
          );
        } else {
          return msg.text;
        }
      case 'latex':
        console.log("Original LaTeX:", msg.text);
        const escapedLatex = escapeLatexString(msg.text);
        console.log("Escaped LaTeX:", escapedLatex);
        return (
          <MathJax.Context input='tex'>
            <MathJax.Node>{escapedLatex}</MathJax.Node>
          </MathJax.Context>
        );
      case 'image':
        return <img src={msg.text} alt="Content" style={{ maxWidth: '100%', height: 'auto' }} />;
      default:
        return <span>Unsupported message type: {msg.type}</span>;
    }
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
          {renderMessageContent(msg)}
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