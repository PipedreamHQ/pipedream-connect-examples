"use client";

import React, { useEffect, useState } from "react";
import Prism from "prismjs";
import "prismjs/themes/prism-okaidia.css";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-python";
import "prismjs/components/prism-bash";

interface CodePanelProps {
  code: string;
  language: string;
}

const CodePanel = ({ code, language }: CodePanelProps) => {
  const [highlightedCode, setHighlightedCode] = useState("");

  useEffect(() => {
    // Use the correct language for highlighting, with fallback to typescript
    const languageGrammar = Prism.languages[language] || Prism.languages.typescript;
    const highlighted = Prism.highlight(
      code,
      languageGrammar,
      language,
    );
    const lines = highlighted.split("\n").map(
      (line, index) =>
        `<div class="flex">
        <span class="w-12 text-right text-gray-600 select-none pr-4 flex-none">${index + 1}</span>
        <span class="lg:whitespace-pre-wrap flex-auto">${line}</span>
      </div>`,
    );
    setHighlightedCode(lines.join(""));
  }, [code, language]);

  return (
    <div className="py-4 relative bg-gray-800 text-white font-mono text-sm rounded-md max-w-full shadow-lg pr-4">
      <div className="overflow-x-auto">
        <pre>
          <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
          <br />
        </pre>
      </div>
    </div>
  );
};

export default CodePanel;
