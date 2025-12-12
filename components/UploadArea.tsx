import React, { useRef, useState } from 'react';

interface UploadAreaProps {
  onFileSelect: (files: File[]) => void;
}

const UploadArea: React.FC<UploadAreaProps> = ({ onFileSelect }) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndPass(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndPass(Array.from(e.target.files));
    }
  };

  const validateAndPass = (files: File[]) => {
    const validFiles = files.filter(file => 
      file.type.startsWith('image/') || file.type === 'application/pdf'
    );
    if (validFiles.length > 0) {
      onFileSelect(validFiles);
    } else {
      alert('Please upload image or PDF files.');
    }
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative group cursor-pointer flex flex-col items-center justify-center 
        w-full h-80 rounded-2xl border-2 border-dashed transition-all duration-300 ease-in-out
        ${isDragging 
          ? 'border-brand-500 bg-brand-900/20' 
          : 'border-gray-700 bg-comic-card hover:border-gray-500 hover:bg-gray-800'
        }
      `}
    >
      <input
        type="file"
        ref={inputRef}
        onChange={handleChange}
        accept="image/*,application/pdf"
        multiple
        className="hidden"
      />
      
      <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
        <div className={`
          p-4 rounded-full mb-4 transition-colors duration-300
          ${isDragging ? 'bg-brand-500/20 text-brand-400' : 'bg-gray-800 text-gray-400 group-hover:bg-gray-700 group-hover:text-gray-300'}
        `}>
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
        </div>
        <p className="mb-2 text-xl font-semibold text-white">
          Click to upload or drag and drop
        </p>
        <p className="text-sm text-gray-400">
          Supports PDF, JPG, PNG, WEBP (Max 100MB)
        </p>
      </div>
    </div>
  );
};

export default UploadArea;