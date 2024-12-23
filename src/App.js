import React, { useState, useEffect } from "react";
import axios from "axios";
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState("process");
  const [folderPath, setFolderPath] = useState("");
  const [fetchPath, setFetchPath] = useState(""); // Path input for Find Metadata
  const [deletePath, setDeletePath] = useState(""); // Path input for Delete Metadata
  const [metadataType, setMetadataType] = useState("basic");
  const [metadata, setMetadata] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Handle folder path input change for "Process Folder"
  const handleFolderPathChange = (e) => setFolderPath(e.target.value);

  // Handle folder path input change for "Find Metadata"
  const handleFetchPathChange = (e) => setFetchPath(e.target.value);

  // Handle folder path input change for "Delete Metadata"
  const handleDeletePathChange = (e) => setDeletePath(e.target.value);

  // Reset metadata when changing between Basic and Advanced metadata types
  useEffect(() => {
    setMetadata([]); // Clear metadata when changing tab
  }, [metadataType]);

  // API call to process the folder
  const processFolder = async () => {
    setLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      const response = await axios.post('http://localhost:8080/api/files/process', null, {
        params: { folderPath }
      });
      if (response.status === 200) {
        setSuccessMessage("Folder processed successfully!");
      }
    } catch (err) {
      setError("Error processing folder.");
    }
    setLoading(false);
  };

  // API call to get metadata for the specified path and type
  const fetchMetadata = async () => {
    setLoading(true);
    setError("");
    setSuccessMessage("");
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

      console.log("Raw Backend Response:", response.data);

      // Handling Basic Metadata
      if (metadataType === "basic") {
        if (response.data && response.data.length > 0) {
          const mappedMetadata = response.data.map((file) => ({
            fileName: file.name || "Unknown File",
            filePath: file.path || "Unknown Path",
            size: file.size ? `${file.size} bytes` : "Unknown Size",
            ctime: file.ctime ? new Date(file.ctime).toLocaleString() : "N/A",
            mtime: file.mtime ? new Date(file.mtime).toLocaleString() : "N/A",
            atime: file.atime ? new Date(file.atime).toLocaleString() : "N/A",
          }));
          setMetadata(mappedMetadata);
        } else {
          setError("No basic metadata found for the specified folder path.");
        }
      }

      // Handling Advanced Metadata
      if (metadataType === "advanced") {
        if (response.data && response.data.length > 0) {
          const mappedMetadata = response.data.map((file) => ({
            fileName: file.fileName || "Unknown File",
            filePath: file.filePath || "Unknown Path",
            metadataMap: file.metadataMap || {}, // Include metadata map for advanced metadata
          }));
          setMetadata(mappedMetadata);
        } else {
          setError("No advanced metadata found for the specified folder path.");
        }
      }
    } catch (err) {
      setError("Error fetching metadata.");
    }
    setLoading(false);
  };

  // API call to delete metadata for the specified folder
  const deleteMetadata = async () => {
    setLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      if (!deletePath) {
        setError("Please enter a folder path to delete metadata.");
        setLoading(false);
        return;
      }
      const response = await axios.delete('http://localhost:8080/api/files/reset-index', {
        params: { folderPath: deletePath }
      });
      if (response.status === 200) {
        setSuccessMessage("Metadata deleted successfully!");
      }
    } catch (err) {
      console.error("Error deleting metadata:", err.response || err);
      if (err.response && err.response.status === 500) {
        setError(
          `Error deleting metadata. Server responded with: ${
            err.response.data || "Internal Server Error"
          }`
        );
      } else {
        setError("Error deleting metadata. Please check the folder path and try again.");
      }
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
        <button
          className={`tab ${activeTab === "delete" ? "active" : ""}`}
          onClick={() => setActiveTab("delete")}
        >
          Delete Metadata
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
            {successMessage && <div className="success">{successMessage}</div>}
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
            {successMessage && <div className="success">{successMessage}</div>}

            {/* Render Metadata Table */}
            {metadata.length > 0 && (
              <div>
                <h3>{metadataType === "basic" ? "Basic Metadata" : "Advanced Metadata"}</h3>
                <table className="metadata-table">
                  <thead>
                    <tr>
                      <th>File Name</th>
                      <th>File Path</th>
                      {metadataType === "basic" && (
                        <>
                          <th>Size</th>
                          <th>Created</th>
                          <th>Modified</th>
                          <th>Accessed</th>
                        </>
                      )}
                      {metadataType === "advanced" && <th>Metadata</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {metadata.map((file, index) => (
                      <tr key={index}>
                        <td>{file.fileName || file.name || "Unknown File"}</td>
                        <td>{file.filePath || file.path || "Unknown Path"}</td>
                        {metadataType === "basic" && (
                          <>
                            <td>{file.size}</td>
                            <td>{file.ctime}</td>
                            <td>{file.mtime}</td>
                            <td>{file.atime}</td>
                          </>
                        )}
                        {metadataType === "advanced" && (
                          <td>
                            {file.metadataMap && Object.keys(file.metadataMap).length > 0 ? (
                              <ul>
                                {Object.entries(file.metadataMap).map(([key, value], idx) => (
                                  <li key={idx}>
                                    <strong>{key}:</strong> {value || "N/A"}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              "No metadata available"
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Delete Metadata Tab */}
        {activeTab === "delete" && (
          <div>
            <h2>Delete Metadata</h2>
            <input
              type="text"
              value={deletePath}
              onChange={handleDeletePathChange}
              placeholder="Enter folder path to delete metadata"
            />
            <button onClick={deleteMetadata} disabled={loading}>
              {loading ? "Deleting..." : "Delete Metadata"}
            </button>
            {successMessage && <div className="success">{successMessage}</div>}
            {error && <div className="error">{error}</div>}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
