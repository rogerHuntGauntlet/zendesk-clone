'use client';

import { useEffect, useRef } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
}

export default function CodeEditor({ value, onChange, language = 'typescript' }: CodeEditorProps) {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  return (
    <Editor
      height="300px"
      defaultLanguage={language}
      value={value}
      onChange={(value) => onChange(value || '')}
      theme="vs-dark"
      options={{
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        fontSize: 14,
        tabSize: 2,
      }}
      onMount={(editor) => {
        editorRef.current = editor;
      }}
    />
  );
} 