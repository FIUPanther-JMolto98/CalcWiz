import React, { useState, useEffect, useRef } from 'react';
import { AiFillRobot } from 'react-icons/ai'; // Example icon for GPT-3.5
import { BsFillLightningFill } from 'react-icons/bs'; // Example icon for GPT-4
import GPTToggle from '../GPTToggle/GPTToggle'; // Adjust the path as necessary
import { FaStar, FaMicrophone, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
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

const AudioVisualizer = () => {
  const canvasRef = useRef(null);
  const [barHeights, setBarHeights] = useState([]);
  const maxBarHeight = 100; // Adjust this value to set the maximum bar height

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#8111cb';

    const numBars = 20;
    const barWidth = width / numBars;

    if (barHeights.length === 0) {
      // Generate initial random bar heights
      const initialHeights = Array.from({ length: numBars }, () => Math.random() * maxBarHeight);
      setBarHeights(initialHeights);
    } else {
      // Update bar heights with slight variations and clamp them within the max height
      const updatedHeights = barHeights.map(height => {
        const newHeight = height + (Math.random() - 0.5) * 2;
        return Math.min(Math.max(newHeight, 0), maxBarHeight);
      });
      setBarHeights(updatedHeights);
    }

    barHeights.forEach((barHeight, index) => {
      const x = index * barWidth;
      ctx.fillRect(x, height - barHeight, barWidth - 2, barHeight);
    });
  }, [barHeights]);

  useEffect(() => {
    const animationInterval = setInterval(() => {
      setBarHeights(prevHeights => prevHeights.map(height => {
        const newHeight = height + (Math.random() - 0.5) * 2;
        return Math.min(Math.max(newHeight, 0), maxBarHeight);
      }));
    }, 500);

    return () => {
      clearInterval(animationInterval);
    };
  }, []);

  return <canvas ref={canvasRef} className="audio-visualizer" style={{ border: '0px solid #303030', borderRadius: '0px' }} />;
};

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [gptVersion, setGptVersion] = useState("3.5"); // State to track GPT version
  const [isBotTyping, setIsBotTyping] = useState(false); // State to track bot typing status
  const [isTTSEnabled, setIsTTSEnabled] = useState(false); // State to track TTS toggle
  const audioRefs = useRef({}); // Ref to store audio elements
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);
  const [audioData, setAudioData] = useState([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);

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
        const backendResponse = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/gpt4assist-query`, {
          input,
          enable_tts: isTTSEnabled, // Pass the TTS toggle state to the backend
        });
        // Expecting an array of responses now, instead of a single response string
        const responses = backendResponse.data.responses || [];

        responses.forEach(response => {
          let content = response.content;
          const type = response.type;
          const audio = response.audio;

          // For image responses, construct the full URL to the image
          if (type === "image") {
            content = `${process.env.REACT_APP_API_BASE_URL}${content}`; // Adjust this if necessary for your deployment environment
          }

          const newBotMessage = { text: content, sender: 'bot', type: type, audio: audio };
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
        const backendResponse = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/wgpt4assist-query`, { input });

        // Use the 'response' field from your backend's JSON response as the bot's message
        const wolframResponse = backendResponse.data.response || "Sorry, I couldn't retrieve data from Wolfram.";
        const imageUrl = backendResponse.data.image_url; // Get the image URL from the response
        const newBotMessage = { text: wolframResponse, sender: 'bot', type: 'text', imageUrl: imageUrl };
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

  const playAudio = (audioSrc) => {
    const audio = new Audio(`${process.env.REACT_APP_API_BASE_URL}${audioSrc}`);
    audio.play();
  };

  const renderMessageContent = (msg) => {
    switch (msg.type) {
      case 'text':
        // Check if the message contains LaTeX delimiters
        if (msg.text.includes('\\[') || msg.text.includes('\\(') || msg.text.includes('\\)')) {
          // Split the message into LaTeX and non-LaTeX parts
          const parts = msg.text.split(/((?:\\\[.*?\\\])|(?:\\\(.*?\\\)))/);  
          // Process each part separately
          const processedParts = parts.map((part, index) => {
            if (part.startsWith('\\[')) {
              // Block math (\[...\])
              const latexContent = part.slice(2, -2);
              return <LatexContent key={index} latexString={latexContent} inline={false} />;
            } else if (part.startsWith('\\(')) {
              // Inline math (\(...\))
              const latexContent = part.slice(2, -2);
              return <LatexContent key={index} latexString={latexContent} inline={true} />;
            } else {
              // Return the non-LaTeX part as is
              return <span key={index} dangerouslySetInnerHTML={{ __html: part }} />;
            }
          });
          return (
            <div className="relative">
              {processedParts}
              {msg.audio && (
                <div className="absolute top-0 right-0 mt-2 mr-2">
                  <FaVolumeUp
                    className="text-white text-xl cursor-pointer"
                    onClick={() => playAudio(msg.audio)}
                  />
                </div>
              )}
            </div>
          );
        } else {
          return (
            <div className="relative">
              <div dangerouslySetInnerHTML={{ __html: msg.text }} />
              {msg.audio && (
                <div className="absolute top-0 right-0 mt-2 mr-2">
                  <FaVolumeUp
                    className="text-white text-xl cursor-pointer"
                    onClick={() => playAudio(msg.audio)}
                  />
                </div>
              )}
              {msg.imageUrl && (
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                  <img
                    src={msg.imageUrl}
                    alt="Wolfram Alpha Image"
                    style={{ maxWidth: '75%', height: '75%', marginTop: '10px' }}
                  />
                </div>
              )}
            </div>
          );
        }
          case 'image':
          return <img src={msg.text} alt="Content" style={{ maxWidth: '100%', height: 'auto' }} />;
        default:
          return (
            <div>
              <div dangerouslySetInnerHTML={{ __html: msg.text }} />
              {msg.imageUrl && (
                <img src={msg.imageUrl} alt="Wolfram Alpha Image" style={{ maxWidth: '100%', height: 'auto', marginTop: '10px' }} />
              )}
            </div>
          );
      }
    };
    const startRecording = () => {
    if (isRecording) {
      stopRecording();
      return;
    }

    setIsRecording(true);

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join('');
      setInput(transcript);
    };

    recognition.onend = () => {
      if (isRecording) {
        recognition.start();
      }
    };

    recognition.start();

    recognitionRef.current = recognition;

    try {
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;

      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          const source = audioContextRef.current.createMediaStreamSource(stream);
          source.connect(analyserRef.current);
          console.log('Analyser connected:', analyserRef.current);
        })
        .catch((error) => {
          console.error('Error accessing microphone:', error);
          console.error('Error accessing microphone:', error);
        });
    } catch (error) {
      console.error('Error creating AudioContext:', error);
    }

    let animationFrameId;

    const visualize = () => {
      if (!isRecording) {
        cancelAnimationFrame(animationFrameId);
        return;
      }
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current.getByteFrequencyData(dataArray);
    
      const visualizationData = Array.from(dataArray);
      console.log('Visualization Data:', visualizationData);
      setAudioData(visualizationData);
      animationFrameId = requestAnimationFrame(visualize);
    };
    console.log('Starting Visualization');
    visualize();
  };

  const stopRecording = () => {
    setIsRecording(false);

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    // Close the AudioContext
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  const sendRecording = () => {
    stopRecording();
    sendMessage({ preventDefault: () => {} });
  };

  return (
    <div className={`background flex flex-col h-screen items-center justify-center p-4 ${darkMode ? 'dark' : ''}`}>
      <div className="text-4xl font-bold mb-0 flex items-center text-white">
        CalcWiz 🧙‍♂️
      </div>
      <GPTToggle onVersionChange={handleVersionChange} />
      <div className="absolute top-4 right-4">
        {isTTSEnabled ? (
          <FaVolumeUp
            className="text-white text-2xl cursor-pointer"
            onClick={() => setIsTTSEnabled(false)}
          />
        ) : (
          <FaVolumeMute
            className="text-white text-2xl cursor-pointer"
            onClick={() => setIsTTSEnabled(true)}
          />
        )}
      </div>
      <div
        className="flex flex-col w-3/4 max-w-2xl border-0 rounded-lg shadow-lg relative z-10"
        style={{
          backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(18, 22, 31, 0.8)',
        }}
      >
        <div className="messages-container overflow-y-auto p-6" style={{ maxHeight: '65vh' }}>
          {messages.map((msg, index) => (
            <div key={index} className={`p-3 my-2 rounded-lg text-white ${msg.sender === 'user' ? 'ml-auto' : 'bg-gray-800 dark:bg-gray-800 mr-auto'}`}
              style={msg.sender === 'user' ? { background: 'linear-gradient(to right, #8111cb,#5211cb,#4311cb)' } : {}}>
              {renderMessageContent(msg)}
            </div>
          ))}
          {isBotTyping && <BotResponsePlaceholder />}
        </div>
        <form onSubmit={sendMessage} className="flex p-3 border-t dark:border-gray-800">
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message here...✨"
              className="w-full rounded p-2 pr-10 text-white bg-gray-800 dark:border-gray-600 dark:bg-gray-800 dark:text-white purple-gradient-border"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <FaMicrophone
                className={`text-white text-xl cursor-pointer ${isRecording ? 'text-purple-500' : ''}`}
                onClick={startRecording}
              />
            </div>
          </div>
          <button
            type="submit"
            className="transform transition duration-150 ease-in-out hover:scale-110 text-white font-bold py-2 px-4 rounded flex items-center justify-center purple-gradient-button ml-2"
          >
            <FiSend className="h-6 w-6" />
          </button>
        </form>
      </div>
      {isRecording && (
        <div className="voice-activity-overlay">
          <div className="voice-activity-container">
            <AudioVisualizer audioData={audioData} />
            <button
              className="send-recording-button"  
              onClick={sendRecording}
            >
              Send Recording
            </button>
          </div>
        </div>
      )}
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