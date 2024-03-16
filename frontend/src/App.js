import React, { useState } from 'react';
import MathJax from '@matejmazur/react-mathjax';
import Chatbot from './Components/Chatbot/Chatbot.js';
import GPTToggle from './Components/GPTToggle/GPTToggle.js'; // Import the toggle component
import './index.css';
import '@coreui/coreui/dist/css/coreui.min.css';

function App() {

  return (
    <div className="App">
        <Chatbot />
      </div>
  );
}

export default App;