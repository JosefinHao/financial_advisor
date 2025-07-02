import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import './MarkdownMessage.css';

const MarkdownMessage = ({ content }) => {
  console.log("MarkdownMessage received content:", JSON.stringify(content)); // Debug log
  
  const renderMath = (text) => {
    // Handle block math ($$...$$)
    text = text.replace(/\$\$(.*?)\$\$/g, (match, formula) => {
      try {
        return `<BLOCK_MATH>${formula}</BLOCK_MATH>`;
      } catch (error) {
        console.error('Error rendering block math:', error);
        return match;
      }
    });
    
    // Handle inline math ($...$)
    text = text.replace(/\$([^$\n]+?)\$/g, (match, formula) => {
      try {
        return `<INLINE_MATH>${formula}</INLINE_MATH>`;
      } catch (error) {
        console.error('Error rendering inline math:', error);
        return match;
      }
    });
    
    // Handle LaTeX block math (\[...\])
    text = text.replace(/\\\[(.*?)\\\]/g, (match, formula) => {
      try {
        return `<BLOCK_MATH>${formula}</BLOCK_MATH>`;
      } catch (error) {
        console.error('Error rendering LaTeX block math:', error);
        return match;
      }
    });
    
    // Handle LaTeX inline math (\(...\))
    text = text.replace(/\\\((.*?)\\\)/g, (match, formula) => {
      try {
        return `<INLINE_MATH>${formula}</INLINE_MATH>`;
      } catch (error) {
        console.error('Error rendering LaTeX inline math:', error);
        return match;
      }
    });
    
    return text;
  };
  
  // Helper to render bold text
  const renderBold = (text) => {
    // Replace **bold** with <strong>bold</strong>
    let parts = text.split(/(\*\*[^*]+\*\*)/g);
    parts = parts.map((part, i) => {
      if (/^\*\*[^*]+\*\*$/.test(part)) {
        return <strong key={`double-${i}`}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
    
    // Replace *bold* with <strong>bold</strong> (single asterisks)
    const finalParts = [];
    parts.forEach((part, i) => {
      if (typeof part === 'string') {
        const singleBoldParts = part.split(/(\*[^*]+\*)/g);
        singleBoldParts.forEach((singlePart, j) => {
          if (/^\*[^*]+\*$/.test(singlePart)) {
            finalParts.push(<strong key={`single-${i}-${j}`}>{singlePart.slice(1, -1)}</strong>);
          } else {
            finalParts.push(singlePart);
          }
        });
      } else {
        finalParts.push(part);
      }
    });
    
    return finalParts;
  };
  
  // Helper to render text with math and bold
  const renderTextWithMathAndBold = (text) => {
    const parts = text.trim().split(/(<BLOCK_MATH>.*?<\/BLOCK_MATH>|<INLINE_MATH>.*?<\/INLINE_MATH>)/);
    return parts.map((part, index) => {
      if (part.startsWith('<BLOCK_MATH>')) {
        const formula = part.replace('<BLOCK_MATH>', '').replace('</BLOCK_MATH>', '');
        return (
          <div key={index} className="ai-math-block">
            <BlockMath math={formula} />
          </div>
        );
      } else if (part.startsWith('<INLINE_MATH>')) {
        const formula = part.replace('<INLINE_MATH>', '').replace('</INLINE_MATH>', '');
        return <InlineMath key={index} math={formula} />;
      } else {
        // Don't trim non-math segments to preserve spacing around inline math
        return renderBold(part);
      }
    });
  };
  
  const renderContent = () => {
    if (!content) return null;
    
    const lines = content.split('\n');
    const elements = [];
    let currentList = [];
    let listType = null; // 'ol' or 'ul'
    
    lines.forEach((line, index) => {
      // Always trim whitespace before and after math processing
      const trimmedLine = line.trim();
      if (!trimmedLine) return; // Skip empty lines
      
      // Process math in the line, then trim again
      let processedLine = renderMath(trimmedLine).trim();
      
      // Debug: Check if this line contains only a math formula
      const hasBlockMath = processedLine.includes('<BLOCK_MATH>');
      console.log(`Line ${index}: "${trimmedLine}" -> "${processedLine}" (hasBlockMath: ${hasBlockMath})`);
      
      // Markdown headers: ###, ##, # (check this BEFORE numbered lists)
      const headerMatch = processedLine.match(/^(#{1,6})\s+(.+)$/);
      console.log(`Header match for "${processedLine}":`, headerMatch);
      if (headerMatch) {
        console.log(`Rendering header: level ${headerMatch[1].length}, text: "${headerMatch[2]}"`);
        // Close any open list
        if (currentList.length > 0) {
          elements.push(
            listType === 'ol' ? (
              <ol key={`ol-${index}`} className="ai-list">{currentList}</ol>
            ) : (
              <ul key={`ul-${index}`} className="ai-list">{currentList}</ul>
            )
          );
          currentList = [];
          listType = null;
        }
        
        const headerLevel = headerMatch[1].length;
        const headerText = headerMatch[2].trim(); // Ensure no extra whitespace
        
        // Render different header levels
        if (headerLevel === 1) {
          elements.push(
            <h1 key={index} className="ai-header ai-header-1">
              {renderTextWithMathAndBold(headerText)}
            </h1>
          );
        } else if (headerLevel === 2) {
          elements.push(
            <h2 key={index} className="ai-header ai-header-2">
              {renderTextWithMathAndBold(headerText)}
            </h2>
          );
        } else if (headerLevel === 3) {
          elements.push(
            <h3 key={index} className="ai-header ai-header-3">
              {renderTextWithMathAndBold(headerText)}
            </h3>
          );
        } else if (headerLevel === 4) {
          elements.push(
            <h4 key={index} className="ai-header ai-header-4">
              {renderTextWithMathAndBold(headerText)}
            </h4>
          );
        } else if (headerLevel === 5) {
          elements.push(
            <h5 key={index} className="ai-header ai-header-5">
              {renderTextWithMathAndBold(headerText)}
            </h5>
          );
        } else {
          elements.push(
            <h6 key={index} className="ai-header ai-header-6">
              {renderTextWithMathAndBold(headerText)}
            </h6>
          );
        }
        return;
      }
      
      // Section header: 1. **Title:** or 2. **Title:**
      const sectionHeaderMatch = processedLine.match(/^\d+\.\s+\*\*(.+?)\*\*:?$/);
      if (sectionHeaderMatch) {
        // Close any open list
        if (currentList.length > 0) {
          elements.push(
            listType === 'ol' ? (
              <ol key={`ol-${index}`} className="ai-list">{currentList}</ol>
            ) : (
              <ul key={`ul-${index}`} className="ai-list">{currentList}</ul>
            )
          );
          currentList = [];
          listType = null;
        }
        elements.push(
          <div key={index} className="ai-section-header">
            <strong>{renderTextWithMathAndBold(sectionHeaderMatch[1])}</strong>
          </div>
        );
        return;
      }
      
      // Numbered list item (not bold header)
      const numberedMatch = processedLine.match(/^\d+\.\s+(.+)$/);
      if (numberedMatch) {
        if (listType !== 'ol') {
          if (currentList.length > 0) {
            elements.push(
              listType === 'ul' ? (
                <ul key={`ul-${index}`} className="ai-list">{currentList}</ul>
              ) : null
            );
            currentList = [];
          }
          listType = 'ol';
        }
        currentList.push(
          <li key={index} className="ai-list-item">
            {renderTextWithMathAndBold(numberedMatch[1])}
          </li>
        );
        return;
      }
      
      // Bullet point
      const bulletMatch = processedLine.match(/^[-*+]\s+(.+)$/);
      if (bulletMatch) {
        if (listType !== 'ul') {
          if (currentList.length > 0) {
            elements.push(
              listType === 'ol' ? (
                <ol key={`ol-${index}`} className="ai-list">{currentList}</ol>
              ) : null
            );
            currentList = [];
          }
          listType = 'ul';
        }
        currentList.push(
          <li key={index} className="ai-list-item">
            {renderTextWithMathAndBold(bulletMatch[1])}
          </li>
        );
        return;
      }
      
      // If we were in a list and now we're not, close the list
      if (currentList.length > 0) {
        elements.push(
          listType === 'ol' ? (
            <ol key={`ol-${index}`} className="ai-list">{currentList}</ol>
          ) : (
            <ul key={`ul-${index}`} className="ai-list">{currentList}</ul>
          )
        );
        currentList = [];
        listType = null;
      }
      
      // Bold header (standalone)
      const boldMatch = processedLine.match(/^\*\*(.+)\*\*$/);
      if (boldMatch) {
        elements.push(
          <p key={index} className="ai-paragraph">
            <strong>{renderTextWithMathAndBold(boldMatch[1])}</strong>
          </p>
        );
        return;
      }
      
      // Check if this line contains only a block math formula
      const onlyBlockMath = processedLine.match(/^<BLOCK_MATH>.*<\/BLOCK_MATH>$/);
      if (onlyBlockMath) {
        // Render as a math block only
        const formula = processedLine.replace('<BLOCK_MATH>', '').replace('</BLOCK_MATH>', '');
        elements.push(
          <div key={index} className="ai-math-block">
            <BlockMath math={formula} />
  </div>
);
        return;
      }
      
      // Regular paragraph
      elements.push(
        <p key={index} className="ai-paragraph">
          {renderTextWithMathAndBold(processedLine)}
        </p>
      );
    });
    
    // Close any remaining list
    if (currentList.length > 0) {
      elements.push(
        listType === 'ol' ? (
          <ol key={`ol-final`} className="ai-list">{currentList}</ol>
        ) : (
          <ul key={`ul-final`} className="ai-list">{currentList}</ul>
        )
      );
    }
    
    return elements;
  };
  
  return (
    <div className="markdown-message">
      {renderContent()}
    </div>
  );
};

export default MarkdownMessage; 