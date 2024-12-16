import React, { useState } from "react";
import axios from "axios";
import './App.css';

function App() {
  const [folderPath, setFolderPath] = useState("");
  const [metadata, setMetadata] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [metadataVisible, setMetadataVisible] = useState(false);  // To control visibility

  const handleFolderPathChange = (e) => {
    setFolderPath(e.target.value);
  };

  const processFolder = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.post('http://localhost:8080/api/files/process', null, {
        params: { folderPath }
      });
      if (response.status === 200) {
        console.log("Folder processed successfully");
        fetchMetadata(); // Fetch metadata after processing folder
      }
    } catch (err) {
      setError("Error processing folder.");
      console.error(err);
    }
    setLoading(false);
  };

  const fetchMetadata = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get('http://localhost:8080/api/files/metadata', {
        params: { folderPath }
      });
      if (response.data) {
        setMetadata(response.data); // Set metadata to state
        setMetadataVisible(true);  // Show metadata once fetched
      }
    } catch (err) {
      setError("Error fetching metadata.");
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="App">
      <h1>File Insights</h1>

      <div>
        <input
          type="text"
          value={folderPath}
          onChange={handleFolderPathChange}
          placeholder="Enter folder path"
        />
      </div>

      <div>
        <button onClick={processFolder} disabled={loading}>
          {loading ? "Processing..." : "Process Folder"}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {/* Button or Tab for Finding Metadata */}
      <div>
        {metadataVisible && (
          <button onClick={() => setMetadataVisible(false)}>
            Hide Metadata
          </button>
        )}
        {!metadataVisible && (
          <button onClick={fetchMetadata}>
            Find Metadata
          </button>
        )}
      </div>

      {/* Display Metadata */}
      {metadataVisible && (
        <div>
          <h2>Metadata for Folder: {folderPath}</h2>
          {metadata.length > 0 ? (
            <ul>
              {metadata.map((file, index) => (
                <li key={index}>
                  <strong>{file.name}</strong> - Size: {file.size} bytes
                </li>
              ))}
            </ul>
          ) : (
            <p>No metadata found.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
