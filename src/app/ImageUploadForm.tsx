'use client'

import React, { useState } from 'react';

export default function ImageUploadForm() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [altText, setAltText] = useState<string>('');
  const [uploadedImage, setUploadedImage] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const handleAltTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAltText(event.target.value);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!selectedFile) {
      setError('Vui lòng chọn file ảnh');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      // Luôn thêm altText, ngay cả khi là chuỗi rỗng
      formData.append('altText', altText);
      
      console.log('Sending altText:', altText);

      // Gọi API media mới
      const response = await fetch('/api/media', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Lỗi khi tải lên ảnh');
      }

      // Lưu thông tin ảnh đã upload
      setUploadedImage(result.data[0]);
      setLoading(false);
      
      // Reset form sau khi upload thành công
      setSelectedFile(null);
      setPreview(null);
      setAltText('');
      
      console.log('Upload thành công:', result);
    } catch (error) {
      console.error('Lỗi:', error);
      setError(error instanceof Error ? error.message : 'Đã xảy ra lỗi khi tải lên ảnh');
      setLoading(false);
    }
  };

  return (
    <div className="image-upload-container">
      <h2>Upload Ảnh</h2>
      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-group">
          <label htmlFor="file-upload">Chọn ảnh:</label>
          <input 
            id="file-upload"
            type="file" 
            accept="image/*"
            onChange={handleFileChange} 
            disabled={loading}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="alt-text">Mô tả ảnh (Alt text):</label>
          <input 
            id="alt-text"
            type="text" 
            value={altText} 
            onChange={handleAltTextChange}
            placeholder="Nhập mô tả cho ảnh" 
            disabled={loading}
          />
        </div>
        
        <button 
          type="submit" 
          disabled={!selectedFile || loading}
          className="upload-button"
        >
          {loading ? 'Đang tải lên...' : 'Tải lên'}
        </button>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
      </form>
      
      {preview && (
        <div className="preview-container">
          <h3>Ảnh đã chọn:</h3>
          <img 
            src={preview} 
            alt="Preview" 
            className="preview-image"
          />
        </div>
      )}
      
      {uploadedImage && (
        <div className="uploaded-container">
          <h3>Ảnh đã tải lên:</h3>
          <div className="uploaded-image-info">
            <img 
              src={uploadedImage.path} 
              alt={uploadedImage.altText || uploadedImage.name}
              className="uploaded-image"
            />
            <div className="image-details">
              <p><strong>ID:</strong> {uploadedImage.id}</p>
              <p><strong>Tên:</strong> {uploadedImage.name}</p>
              <p><strong>Đường dẫn:</strong> {uploadedImage.path}</p>
              <p><strong>Mô tả:</strong> {uploadedImage.altText || '(không có)'}</p>
            </div>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .image-upload-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-family: sans-serif;
        }
        
        .upload-form {
          display: flex;
          flex-direction: column;
          gap: 15px;
          margin-bottom: 20px;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 5px;
          background-color: #f9f9f9;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        
        .form-group label {
          font-weight: bold;
        }
        
        .form-group input[type="text"] {
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        .upload-button {
          padding: 10px;
          background-color: #0070f3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
        }
        
        .upload-button:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }
        
        .error-message {
          color: #d32f2f;
          margin-top: 10px;
          padding: 10px;
          background-color: #ffebee;
          border-radius: 4px;
        }
        
        .preview-container,
        .uploaded-container {
          margin-top: 20px;
        }
        
        .preview-image,
        .uploaded-image {
          max-width: 300px;
          max-height: 300px;
          object-fit: contain;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        .uploaded-image-info {
          display: flex;
          gap: 20px;
          margin-top: 10px;
        }
        
        .image-details {
          flex: 1;
        }
        
        .image-details p {
          margin: 5px 0;
        }
      `}</style>
    </div>
  );
}