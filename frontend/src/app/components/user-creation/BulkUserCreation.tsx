import React, { useState } from 'react';

const BulkUserCreation = () => {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (file) {
      const formData = new FormData();
      formData.append('file', file);

      // Mock API call
      console.log('Uploading file:', file.name);
    } else {
      console.error('No file selected');
    }
  };

  return (
    <div>
      <h1>Bulk User Creation</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Upload File:
          <input type="file" onChange={handleFileChange} />
        </label>
        <button type="submit">Upload</button>
      </form>
    </div>
  );
};

export default BulkUserCreation;