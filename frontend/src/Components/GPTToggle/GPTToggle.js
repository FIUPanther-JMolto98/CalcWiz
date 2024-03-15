import React, { useState } from 'react';
import { AiFillRobot } from 'react-icons/ai';
import { BsFillLightningFill } from 'react-icons/bs';
import { FaWpexplorer } from 'react-icons/fa';
import { HiSparkles } from "react-icons/hi";
import { HiVariable } from "react-icons/hi";
import CIcon from '@coreui/icons-react';
import { cibWolfram } from '@coreui/icons'; // Ensure this is the correct path

const GPTToggle = ({ onVersionChange }) => {
  const [selectedVersion, setSelectedVersion] = useState("3.5");
  const [showWolframGPT4, setShowWolframGPT4] = useState(false);
  const [isWolframGPT4Active, setIsWolframGPT4Active] = useState(false);

  const handleVersionChange = (version) => {
    setSelectedVersion(version);
    if (version === "4") {
      setShowWolframGPT4(!showWolframGPT4);
    } else {
      setShowWolframGPT4(false);
      setIsWolframGPT4Active(false); // Ensure WolframGPT4 is deactivated when not on GPT-4
    }
    // Inform parent about the change with both version and Wolfram status
    onVersionChange({ version: version, isWolframActive: isWolframGPT4Active && version === "4" });
  };
  
  const toggleWolframGPT4 = () => {
    const newIsActive = !isWolframGPT4Active;
    setIsWolframGPT4Active(newIsActive);
    // Since this toggles Wolfram state, we always assume version is "4" here
    onVersionChange({ version: "4", isWolframActive: newIsActive });
  };
  
  return (
    <div className="flex flex-col items-center justify-center gap-2 p-4" style={{ zIndex: 10 }}>
      <div className="flex gap-2">
        <button
          style={{ padding: '8px', borderRadius: '8px', backgroundColor: selectedVersion === "3.5" ? '#68d391' : '#e2e8f0', color: selectedVersion === "3.5" ? 'white' : 'black', zIndex: 20 }}
          onClick={() => handleVersionChange("3.5")}
        >
          <BsFillLightningFill className="inline mr-2" /> GPT-3.5
        </button>
        <button
          style={{ padding: '8px', borderRadius: '8px', backgroundColor: selectedVersion === "4" ? '#9f7aea' : '#e2e8f0', color: selectedVersion === "4" ? 'white' : 'black', zIndex: 20 }}
          onClick={() => handleVersionChange("4")}
        >
          <HiSparkles className="inline mr-2" /> GPT-4
        </button>
      </div>
      {showWolframGPT4 && (
      <button
        style={{
          padding: '8px',
          borderRadius: '8px',
          backgroundColor: isWolframGPT4Active ? '#e53e3e' : '#feb2b2',
          color: 'white',
          marginTop: '5px',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
        }}
        onClick={toggleWolframGPT4}
      >
        {/* Adjusting the icon's vertical position */}
        <div style={{ marginTop: '4px' }}> {/* Adjust the '4px' as needed */}
          <CIcon icon={cibWolfram} size='xl' className="inline mr-2" />
        </div>
        WGPT-4
      </button>


      )}
    </div>
  );
};

export default GPTToggle;