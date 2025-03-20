import { Editor } from "@tinymce/tinymce-react";
import React, { useEffect } from 'react';

// ✅ Define props interface for better type safety
interface MyEditorProps {
  value: string;
  onChange: (content: string) => void;
}

const MyEditor: React.FC<MyEditorProps> = ({ value, onChange }) => {
    // ✅ Log value changes for debugging purposes
    useEffect(() => {
        console.log("Editor Value Updated:", value);
      }, [value]); 
    
  return (
    <Editor
      apiKey="bxbikvl8n8v10gg09cu8arqlvgmt46nb8wuai3lq0epiysti"  // ✅ TinyMCE API key
      value={value} // ✅ Controlled component: value is managed externally
      onEditorChange={onChange} // ✅ Call parent function when content changes
      init={{
        height: 300,
        menubar: false, // ✅ Hide the top menu bar for a cleaner UI
        plugins: ["lists", "link", "image", "table"], //✅ Enable specific plugins
        toolbar: "undo redo | bold italic | bullist numlist",  // ✅ Define toolbar options
      }}
    />
  );
};

export default MyEditor;