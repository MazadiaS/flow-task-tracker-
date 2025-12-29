import { useState } from 'react';
import { sanitizeURL } from '../../utils/security';

interface Props {
  resources: string[];
  onUpdateResources: (resources: string[]) => void;
}

function HomeworkResourceManager({ resources, onUpdateResources }: Props) {
  const [newResource, setNewResource] = useState('');
  const [error, setError] = useState('');

  const handleAddResource = () => {
    if (!newResource.trim()) {
      setError('Please enter a URL');
      return;
    }

    // Validate and sanitize URL
    const sanitized = sanitizeURL(newResource);

    if (!sanitized) {
      setError('Invalid URL. Only http:// and https:// URLs are allowed.');
      return;
    }

    if (resources.length >= 20) {
      setError('Maximum 20 resources allowed');
      return;
    }

    if (resources.includes(sanitized)) {
      setError('This resource has already been added');
      return;
    }

    onUpdateResources([...resources, sanitized]);
    setNewResource('');
    setError('');
  };

  const handleRemoveResource = (index: number) => {
    const updated = resources.filter((_, i) => i !== index);
    onUpdateResources(updated);
  };

  return (
    <div className="homework-resources">
      <h4>Resources</h4>

      {resources.length > 0 && (
        <ul className="resource-list">
          {resources.map((resource, index) => (
            <li key={index}>
              <a
                href={resource}
                target="_blank"
                rel="noopener noreferrer"
                className="resource-link"
              >
                {resource.length > 50 ? resource.substring(0, 47) + '...' : resource}
              </a>
              <button
                onClick={() => handleRemoveResource(index)}
                className="btn-remove"
                title="Remove resource"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="add-resource">
        <input
          type="url"
          placeholder="Enter URL (https://...)"
          value={newResource}
          onChange={(e) => {
            setNewResource(e.target.value);
            setError('');
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleAddResource();
            }
          }}
        />
        <button onClick={handleAddResource} className="btn btn-secondary">
          Add
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <p className="resource-note">
        ℹ️ Only secure URLs (https://) are recommended. Max 20 resources.
      </p>
    </div>
  );
}

export default HomeworkResourceManager;
