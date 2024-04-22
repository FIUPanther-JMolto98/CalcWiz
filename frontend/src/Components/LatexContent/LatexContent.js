import React from 'react';
import { MathJax, MathJaxContext } from 'better-react-mathjax';

const config = {
  loader: { load: ["input/tex", "output/chtml"] },
  tex: {
    inlineMath: [['\\(', '\\)']], // Defines delimiters for inline math
    displayMath: [['\\[', '\\]']], // Defines delimiters for block (display) math
  },
};

const LatexContent = ({ latexString, inline }) => {
  // Wraps the LaTeX string with the appropriate delimiters based on whether it's inline or block math
  const content = inline ? `\\(${latexString}\\)` : `\\[${latexString}\\]`;

  return (
    <MathJaxContext config={config}>
      <MathJax>{content}</MathJax>
    </MathJaxContext>
  );
};

export default LatexContent;