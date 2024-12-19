import React, { useState, useEffect } from "react";
import axios from "axios";
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState("process");
  const [folderPath, setFolderPath] = useState("");
  const [fetchPath, setFetchPath] = useState(""); // Path input for Find Metadata
  const [metadataType, setMetadataType] = useState("basic");
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

  // Reset metadata when changing between Basic and Advanced metadata types
  useEffect(() => {
    setMetadata([]); // Clear metadata when changing tab
  }, [metadataType]);

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

  // API call to get metadata for the specified path and type
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
        params: { folderPath: fetchPath, type: metadataType }
      });

      console.log("Raw Backend Response:", response.data); // Log the response to inspect the data structure

      // Handling Basic Metadata
      if (metadataType === "basic") {
        if (response.data && response.data.length > 0) {
          // Mapping backend response to frontend structure
          const mappedMetadata = response.data.map((file) => ({
            fileName: file.name || 'Unknown File',
            filePath: file.path || 'Unknown Path',
            size: file.size || 'Unknown Size',
            ctime: new Date(file.ctime).toLocaleString(),
            mtime: new Date(file.mtime).toLocaleString(),
            atime: new Date(file.atime).toLocaleString(),
          }));
          setMetadata(mappedMetadata); // Only set metadata if valid data
          console.log("Mapped Basic Metadata:", mappedMetadata);
        } else {
          setError("No basic metadata found for the specified folder path.");
        }
      }

      // Handling Advanced Metadata
      if (metadataType === "advanced") {
        if (response.data && response.data.length > 0) {
          setMetadata(response.data); // Only set metadata if valid data
          console.log("Advanced Metadata Response:", response.data);
        } else {
          setError("No advanced metadata found for the specified folder path.");
        }
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
            <div>
              <label>
                <input
                  type="radio"
                  value="basic"
                  checked={metadataType === "basic"}
                  onChange={() => setMetadataType("basic")}
                />
                Basic Metadata (MySQL)
              </label>
              <label>
                <input
                  type="radio"
                  value="advanced"
                  checked={metadataType === "advanced"}
                  onChange={() => setMetadataType("advanced")}
                />
                Advanced Metadata (Elasticsearch)
              </label>
            </div>
            <button onClick={fetchMetadata} disabled={loading}>
              {loading ? "Fetching..." : "Find Metadata"}
            </button>
            {error && <div className="error">{error}</div>}

            {/* Render Basic Metadata Table */}
            {metadataType === "basic" && metadata.length > 0 && (
              <div>
                <h3>Basic Metadata for Files:</h3>
                <table className="metadata-table">
                  <thead>
                    <tr>
                      <th>File Name</th>
                      <th>File Path</th>
                      <th>Size</th>
                      <th>Created</th>
                      <th>Modified</th>
                      <th>Accessed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metadata.map((file, index) => (
                      <tr key={index}>
                        <td>{file.fileName || 'Unknown File'}</td>
                        <td>{file.filePath || 'Unknown Path'}</td>
                        <td>{file.size || 'Unknown Size'}</td>
                        <td>{file.ctime || 'N/A'}</td>
                        <td>{file.mtime || 'N/A'}</td>
                        <td>{file.atime || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Render Advanced Metadata Table */}
            {metadataType === "advanced" && metadata.length > 0 && (
              <div>
                <h3>Advanced Metadata for Files:</h3>
                <table className="metadata-table">
                  <thead>
                    <tr>
                      <th>File Name</th>
                      <th>File Path</th>
                      <th>Metadata</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metadata.map((file, index) => (
                      <tr key={index}>
                        <td>{file.fileName || 'Unknown File'}</td>
                        <td>{file.filePath || 'Unknown Path'}</td>
                        <td>
                          {/* Check if metadataMap exists */}
                          {file.metadataMap && Object.keys(file.metadataMap).length > 0 ? (
                            <div>
                              {Object.entries(file.metadataMap).map(([key, value], idx) => (
                                <div key={idx} className="metadata-item">
                                  <strong>{key}:</strong> {value || 'N/A'}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p>No advanced metadata available</p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
