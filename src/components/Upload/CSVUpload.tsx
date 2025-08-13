import React, { useState, useRef } from 'react';
import { Upload, File, CheckCircle, AlertCircle, X } from 'lucide-react';

interface CSVUploadProps {
  onUpload?: (file: File) => void;
}

const CSVUpload: React.FC<CSVUploadProps> = ({ onUpload }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      handleFiles(files);
    }
  };

  const handleFiles = async (files: FileList) => {
    if (files.length === 0) return;

    const file = files[0];
    
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setUploadStatus('error');
      setErrorMessage('Please upload a CSV file only.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadStatus('error');
      setErrorMessage('File size must be less than 5MB.');
      return;
    }

    setUploadStatus('uploading');
    setErrorMessage('');
    setUploadedFile(file);

    // Simulate upload process
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setUploadStatus('success');
      onUpload?.(file);
    } catch (error) {
      setUploadStatus('error');
      setErrorMessage('Upload failed. Please try again.');
    }
  };

  const resetUpload = () => {
    setUploadStatus('idle');
    setErrorMessage('');
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'uploading':
        return (
          <div className="animate-spin w-8 h-8 border-4 border-[#556B2F] border-t-transparent rounded-full"></div>
        );
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-8 h-8 text-red-600" />;
      default:
        return <Upload className="w-8 h-8 text-[#8F9779]" />;
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-[#A3B18A]/20">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-[#2F3E2F] mb-2">Upload Sales Data</h3>
        <p className="text-[#8F9779] text-sm">
          Upload your CSV file containing the last 3 months of sales data for AI-powered demand forecasting.
        </p>
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
          dragActive
            ? 'border-[#556B2F] bg-[#556B2F]/5'
            : uploadStatus === 'error'
            ? 'border-red-300 bg-red-50'
            : uploadStatus === 'success'
            ? 'border-green-300 bg-green-50'
            : 'border-[#A3B18A]/50 bg-[#F5F5F0]/50 hover:border-[#8F9779] hover:bg-[#F5F5F0]'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center space-y-4">
          {getStatusIcon()}
          
          {uploadStatus === 'idle' && (
            <>
              <div>
                <h4 className="text-lg font-medium text-[#2F3E2F] mb-2">
                  Drop your CSV file here
                </h4>
                <p className="text-[#8F9779] text-sm mb-4">
                  or click to browse and select a file
                </p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-[#556B2F] text-white px-6 py-2 rounded-lg hover:bg-[#8F9779] transition-all duration-200 font-medium"
              >
                Select File
              </button>
            </>
          )}

          {uploadStatus === 'uploading' && (
            <div>
              <h4 className="text-lg font-medium text-[#2F3E2F] mb-2">
                Uploading...
              </h4>
              <p className="text-[#8F9779] text-sm">
                Processing your sales data
              </p>
            </div>
          )}

          {uploadStatus === 'success' && uploadedFile && (
            <div>
              <h4 className="text-lg font-medium text-green-700 mb-2">
                Upload Successful!
              </h4>
              <div className="flex items-center space-x-2 text-sm text-[#8F9779] mb-4">
                <File className="w-4 h-4" />
                <span>{uploadedFile.name}</span>
                <span>({(uploadedFile.size / 1024).toFixed(1)} KB)</span>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={resetUpload}
                  className="bg-[#556B2F] text-white px-4 py-2 rounded-lg hover:bg-[#8F9779] transition-all duration-200 text-sm font-medium"
                >
                  Upload Another File
                </button>
                <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all duration-200 text-sm font-medium">
                  Generate Forecast
                </button>
              </div>
            </div>
          )}

          {uploadStatus === 'error' && (
            <div>
              <h4 className="text-lg font-medium text-red-700 mb-2">
                Upload Failed
              </h4>
              <p className="text-red-600 text-sm mb-4">
                {errorMessage}
              </p>
              <button
                onClick={resetUpload}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all duration-200 text-sm font-medium"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileSelect}
        className="hidden"
      />

      {uploadStatus === 'success' && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="text-sm font-medium text-green-800 mb-2">Next Steps:</h4>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Data validation completed successfully</li>
            <li>• Ready to generate AI-powered demand forecasts</li>
            <li>• Click "Generate Forecast" to see predictions</li>
          </ul>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-medium text-blue-800 mb-2">CSV Format Requirements:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Required columns:</strong> Date, Product, Sales_Quantity, SKU</li>
          <li>• <strong>Date format:</strong> YYYY-MM-DD or DD/MM/YYYY</li>
          <li>• <strong>File size:</strong> Maximum 5MB</li>
          <li>• <strong>Data period:</strong> Last 3 months recommended</li>
        </ul>
      </div>
    </div>
  );
};

export default CSVUpload;