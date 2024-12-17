import React, { useState } from "react";
import axios from "axios";
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState("process"); // Manage active tab
  const [folderPath, setFolderPath] = useState("");
  const [fetchPath, setFetchPath] = useState(""); // Path input for Find Metadata
  const [metadata, setMetadata] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Handle folder path input change for "Process Folder"
  const handleFolderPathChange = (e) => {
    setFolderPath(e.target.value);
  };

  // Handle folder path input change for "Find Metadata"
  const handleFetchPathChange = (e) => {
    setFetchPath(e.target.value);
  };

  // API call to process the folder
  const processFolder = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.post('http://localhost:8080/api/files/process', null, {
        params: { folderPath }
      });
      if (response.status === 200) {
        console.log("Folder processed successfully");
        setError("Folder processed successfully!");
      }
    } catch (err) {
      setError("Error processing folder.");
      console.error(err);
    }
    setLoading(false);
  };

  // API call to get metadata for the specified path
  const fetchMetadata = async () => {
    setLoading(true);
    setError("");
    setMetadata([]);
    try {
      if (!fetchPath) {
        setError("Please enter a folder path to fetch metadata.");
        setLoading(false);
        return;
      }
      const response = await axios.get('http://localhost:8080/api/files/metadata', {
        params: { folderPath: fetchPath }
      });
      if (response.data && response.data.length > 0) {
        setMetadata(response.data);
      } else {
        setError("No metadata found for the specified folder path.");
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
      
      {/* Tabs Navigation */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === "process" ? "active" : ""}`} 
          onClick={() => setActiveTab("process")}
        >
          Process Folder
        </button>
        <button 
          className={`tab ${activeTab === "metadata" ? "active" : ""}`} 
          onClick={() => setActiveTab("metadata")}
        >
          Find Metadata
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Process Folder Tab */}
        {activeTab === "process" && (
          <div>
            <h2>Process Folder</h2>
            <input
              type="text"
              value={folderPath}
              onChange={handleFolderPathChange}
              placeholder="Enter folder path"
            />
            <button onClick={processFolder} disabled={loading}>
              {loading ? "Processing..." : "Process Folder"}
            </button>
            {error && <div className="error">{error}</div>}
          </div>
        )}

        {/* Find Metadata Tab */}
        {activeTab === "metadata" && (
          <div>
            <h2>Find Metadata</h2>
            <input
              type="text"
              value={fetchPath}
              onChange={handleFetchPathChange}
              placeholder="Enter folder path to find metadata"
            />
            <button onClick={fetchMetadata} disabled={loading}>
              {loading ? "Fetching..." : "Find Metadata"}
            </button>
            {error && <div className="error">{error}</div>}
            {metadata.length > 0 && (
              <ul>
                {metadata.map((file, index) => (
                  <li key={index}>
                    <strong>{file.name}</strong> - Size: {file.size} bytes
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
