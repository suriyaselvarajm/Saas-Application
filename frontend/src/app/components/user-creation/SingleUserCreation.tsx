import React, { useState } from 'react';

const SingleUserCreation = () => {
  const [template, setTemplate] = useState('');
  const [formData, setFormData] = useState<any>({});

  const handleTemplateChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTemplate = event.target.value;
    setTemplate(selectedTemplate);

    // Fetch template data (mocked for now)
    const templates: Record<string, any> = {
      default: {
        fullName: '',
        email: '',
        phone: '',
        department: '',
        role: '',
        manager: '',
        username: '',
        password: '',
        groupMemberships: [],
        licenses: [],
        mfaSettings: {}
      }
    };

    setFormData(templates[selectedTemplate] || {});
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log('Form submitted:', formData);
  };

  return (
    <div>
      <h1>Single User Creation</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Template:
          <select value={template} onChange={handleTemplateChange}>
            <option value="default">Default Template</option>
          </select>
        </label>

        <label>
          Full Name:
          <input
            type="text"
            name="fullName"
            value={formData.fullName || ''}
            onChange={handleInputChange}
          />
        </label>

        <label>
          Email:
          <input
            type="email"
            name="email"
            value={formData.email || ''}
            onChange={handleInputChange}
          />
        </label>

        {/* Add other fields similarly */}

        <button type="submit">Create User</button>
      </form>
    </div>
  );
};

export default SingleUserCreation;