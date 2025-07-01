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
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (/^\*\*[^*]+\*\*$/.test(part)) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
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