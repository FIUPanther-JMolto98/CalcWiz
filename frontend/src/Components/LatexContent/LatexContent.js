import React from 'react';
import { MathJax, MathJaxContext } from 'better-react-mathjax';

const config = {
  loader: {
    load: ["input/tex", "output/chtml"],
  },
  tex: {
    inlineMath: [['\\(', '\\)']],
    displayMath: [['\\[', '\\]']],
    processEscapes: true,
  },
};

const LatexContent = ({ latexString, inline }) => {
  const content = inline ? `\\(${latexString}\\)` : `\\[${latexString}\\]`;

  // Debugging: Output the processed content
  console.log("Rendering LaTeX:", content);

  return (
    <MathJaxContext config={config}>
      {/* Apply the inline prop to MathJax to render LaTeX as inline when needed */}
      <MathJax inline={inline}>
        <span style={{ display: inline ? 'inline' : 'block' }}>{content}</span>
      </MathJax>
    </MathJaxContext>
  );
};

export default LatexContent;