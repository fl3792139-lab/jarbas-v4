import React from 'react';
import ReactMarkdown from 'react-markdown';

interface TerminalOutputProps {
  content: string;
}

export const TerminalOutput: React.FC<TerminalOutputProps> = ({ content }) => {
  return (
    <div className="prose prose-invert prose-p:text-jarbas-primary prose-pre:bg-gray-900 prose-pre:border prose-pre:border-jarbas-secondary/30 max-w-none text-sm md:text-base font-mono">
      <ReactMarkdown
        components={{
          code({ node, inline, className, children, ...props }: any) {
            return !inline ? (
              <div className="relative group">
                <div className="absolute -top-3 right-2 text-xs text-jarbas-secondary/50 font-orbitron">CODE_BLOCK</div>
                <code className={`${className} block bg-black/50 p-4 rounded-lg border-l-2 border-jarbas-accent my-2 overflow-x-auto`} {...props}>
                  {children}
                </code>
              </div>
            ) : (
              <code className="bg-jarbas-secondary/20 text-jarbas-accent px-1 py-0.5 rounded" {...props}>
                {children}
              </code>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};