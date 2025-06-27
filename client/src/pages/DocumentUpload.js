import React, { useState, useEffect, useRef } from 'react';
import './DocumentUpload.css';

const DocumentUpload = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [analysis, setAnalysis] = useState('');
    const [error, setError] = useState('');
    const [uploadHistory, setUploadHistory] = useState([]);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef(null);
    const dragCounter = useRef(0);

    useEffect(() => {
        // Load upload history when component mounts
        fetchUploadHistory();
    }, []);

    const fetchUploadHistory = async () => {
        try {
            const response = await fetch('http://127.0.0.1:5000/documents');
            if (response.ok) {
                const data = await response.json();
                setUploadHistory(data);
            }
        } catch (err) {
            console.error('Failed to fetch upload history:', err);
        }
    };

    const validateFile = (file) => {
        const allowedTypes = ['application/pdf', 'text/plain', 'text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
        return allowedTypes.includes(file.type);
    };

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            if (validateFile(file)) {
                setSelectedFile(file);
                setError('');
            } else {
                setError('Please select a PDF, text file, CSV, or Excel file.');
                setSelectedFile(null);
            }
        }
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current++;
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            setIsDragOver(true);
        }
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current--;
        if (dragCounter.current === 0) {
            setIsDragOver(false);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        dragCounter.current = 0;

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (validateFile(file)) {
                setSelectedFile(file);
                setError('');
            } else {
                setError('Please select a PDF, text file, CSV, or Excel file.');
                setSelectedFile(null);
            }
            e.dataTransfer.clearData();
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setUploading(true);
        setError('');
        setAnalysis('');

        const formData = new FormData();
        formData.append('document', selectedFile);

        try {
            const response = await fetch('http://127.0.0.1:5000/documents/upload', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                setAnalysis(data.analysis || 'Document uploaded successfully!');
                setSelectedFile(null);
                // Reset file input
                if (fileInputRef.current) fileInputRef.current.value = '';
                // Refresh history
                fetchUploadHistory();
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to upload document');
            }
        } catch (err) {
            setError('Failed to upload document. Please try again.');
            console.error('Upload error:', err);
        } finally {
            setUploading(false);
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const deleteDocument = async (documentId) => {
        if (!window.confirm('Are you sure you want to delete this document?')) return;

        try {
            const response = await fetch(`http://127.0.0.1:5000/documents/${documentId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                fetchUploadHistory();
            } else {
                setError('Failed to delete document');
            }
        } catch (err) {
            setError('Failed to delete document');
            console.error('Delete error:', err);
        }
    };

    const handleBrowseClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="document-upload-container">
            <div className="header">
                <h2 className="title">Document Upload & AI Analysis</h2>
                <p className="subtitle">Upload your financial documents (PDF, text, CSV, Excel) and get intelligent insights.</p>
            </div>

            {/* Upload Section */}
            <div className="upload-section">
                <h3 className="section-title">Upload New Document</h3>

                {/* Drag and Drop Area */}
                <div
                    className={`drag-drop-area ${isDragOver ? 'drag-over' : ''} ${selectedFile ? 'file-selected' : ''} ${uploading ? 'uploading' : ''}`}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={!uploading ? handleBrowseClick : undefined}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileSelect}
                        accept=".pdf,.txt,.csv,.xls,.xlsx"
                        className="file-input-hidden"
                        disabled={uploading}
                    />

                    <div className="drop-area-content">
                        {isDragOver ? (
                            <div className="drag-over-content">
                                <div className="icon">📁</div>
                                <p className="drag-over-text">Drop your file here!</p>
                            </div>
                        ) : selectedFile ? (
                            <div className="file-selected-content">
                                <div className="icon">✅</div>
                                <p className="file-selected-text">File Selected!</p>
                                <div className="file-info">
                                    <p><strong>Name:</strong> {selectedFile.name}</p>
                                    <p><strong>Size:</strong> {formatFileSize(selectedFile.size)}</p>
                                    <p><strong>Type:</strong> {selectedFile.type}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="default-content">
                                <div className="icon">📤</div>
                                <p className="main-text">Drag & drop your file here</p>
                                <p className="sub-text">or click to browse</p>
                                <div className="browse-button">
                                    Browse Files
                                </div>
                                <p className="supported-formats">
                                    Supported formats: PDF, TXT, CSV, XLS, XLSX
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Upload Button */}
                <div className="upload-button-container">
                    <button
                        onClick={handleUpload}
                        disabled={!selectedFile || uploading}
                        className={`upload-btn ${!selectedFile || uploading ? 'disabled' : ''}`}
                    >
                        {uploading ? (
                            <div className="loading-content">
                                <div className="spinner"></div>
                                Uploading & Analyzing...
                            </div>
                        ) : (
                            'Upload & Analyze'
                        )}
                    </button>
                </div>

                {error && (
                    <div className="error-message">
                        <strong>Error:</strong> {error}
                    </div>
                )}

                {analysis && (
                    <div className="analysis-result">
                        <h4 className="analysis-title">📊 Analysis Result:</h4>
                        <div className="analysis-content">
                            {analysis.split('\n').map((line, index) => (
                                <p key={index}>{line}</p>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Upload History */}
            <div className="history-section">
                <h3 className="section-title">📚 Document History</h3>

                {uploadHistory.length === 0 ? (
                    <div className="empty-state">
                        <div className="icon">📋</div>
                        <p>No documents uploaded yet.</p>
                    </div>
                ) : (
                    <div className="documents-grid">
                        {uploadHistory.map((doc) => (
                            <div key={doc.id} className="document-card">
                                <div className="document-header">
                                    <h4 className="document-title">{doc.filename}</h4>
                                    <button
                                        onClick={() => deleteDocument(doc.id)}
                                        className="delete-button"
                                        title="Delete document"
                                    >
                                        🗑️
                                    </button>
                                </div>

                                <div className="document-meta">
                                    <p><strong>Type:</strong> {doc.file_type}</p>
                                    <p><strong>Size:</strong> {formatFileSize(doc.file_size)}</p>
                                    <p><strong>Uploaded:</strong> {new Date(doc.uploaded_at).toLocaleDateString()}</p>
                                </div>

                                {doc.analysis && (
                                    <div className="document-analysis">
                                        <h5 className="analysis-summary-title">Analysis Summary:</h5>
                                        <p className="analysis-summary">
                                            {doc.analysis.substring(0, 150)}
                                            {doc.analysis.length > 150 ? '...' : ''}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DocumentUpload;