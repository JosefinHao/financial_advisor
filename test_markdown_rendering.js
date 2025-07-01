// Simple test to see how ReactMarkdown renders block math
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

const testContent = `Here's a formula:
$$
C = S_0 N(d_1) - Xe^{-rt} N(d_2)
$$
That's it.

And inline math: $x + y = z$ should stay inline.`;

function TestMarkdown() {
  return (
    <div className="markdown-message">
      <ReactMarkdown
        children={testContent}
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
      />
    </div>
  );
}

export default TestMarkdown; 