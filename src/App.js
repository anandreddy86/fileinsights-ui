import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Pie, Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import "./App.css";

// Register necessary Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement, // Register ArcElement for pie charts
  Title,
  Tooltip,
  Legend
);

function App() {
  const [activeTab, setActiveTab] = useState("process");
  const [folderPath, setFolderPath] = useState("");
  const [fetchPath, setFetchPath] = useState("");
  const [deletePath, setDeletePath] = useState("");
  const [metadataType, setMetadataType] = useState("basic");
  const [metadata, setMetadata] = useState([]);
  const [fileAgeData, setFileAgeData] = useState({});
  const [fileTypeData, setFileTypeData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [expandedRows, setExpandedRows] = useState([]);

  // Data Sources State
  const [nfsHost, setNfsHost] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [sharePath, setSharePath] = useState('');
  const [savedCredentials, setSavedCredentials] = useState([]);

  const fetchAnalyticsData = useCallback(async () => {
    setLoading(true);
    resetStates();
    try {
      const ageResponse = await axios.get("http://localhost:8080/api/analytics/by-age");
      const typeResponse = await axios.get("http://localhost:8080/api/analytics/by-type");
      setFileAgeData(ageResponse.data);
      setFileTypeData(typeResponse.data);
    } catch (err) {
      setError("Error fetching analytics data.");
    } finally {
      setLoading(false);
    }
  }, []); 

  useEffect(() => {
    if (activeTab === "analytics") {
      fetchAnalyticsData();
    } else {
      resetStates();
    }
  }, [activeTab, fetchAnalyticsData]);

  const resetStates = () => {
    setMetadata([]);
    setError("");
    setSuccessMessage("");
    setFileAgeData({});
    setFileTypeData({});
  };

  const processFolder = async () => {
    setLoading(true);
    resetStates();
    try {
      const response = await axios.post("http://localhost:8080/api/files/process", null, {
        params: { folderPath },
      });
      setSuccessMessage(response.data.message || "Folder processed successfully!");
    } catch (err) {
      setError(err.response?.data?.message || "Error processing folder.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    setLoading(true);
    resetStates(); // Clear metadata and reset state
    try {
      if (!fetchPath) throw new Error("Path is required.");
      const response = await axios.get("http://localhost:8080/api/files/metadata", {
        params: { folderPath: fetchPath, type: metadataType },
      });
      setMetadata(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Error fetching metadata.");
    } finally {
      setLoading(false);
    }
  };

  const deleteMetadata = async () => {
    setLoading(true);
    resetStates();
    try {
      if (!deletePath) throw new Error("Path is required.");
      await axios.delete("http://localhost:8080/api/files/reset-index", {
        params: { folderPath: deletePath },
      });
      setSuccessMessage("Metadata deleted successfully!");
    } catch (err) {
      setError(err.response?.data?.message || "Error deleting metadata.");
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (index) => {
    setExpandedRows(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  // Handle Data Source Saving
  const handleSaveCredentials = () => {
    const newCredentials = { nfsHost, username, password, sharePath };
    setSavedCredentials([...savedCredentials, newCredentials]);
    // Optional: Persist these credentials in localStorage or send to backend
  };

  const handleRemoveCredential = (index) => {
    const updatedCredentials = savedCredentials.filter((_, i) => i !== index);
    setSavedCredentials(updatedCredentials);
  };

  // Tables for metadata
  const renderBasicMetadataTable = () => {
    return (
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>File Path</th>
            <th>File Name</th>
            <th>Size</th>
            <th>Created Time</th>
            <th>Modified Time</th>
            <th>Access Time</th>
          </tr>
        </thead>
        <tbody>
          {metadata.map((item, index) => (
            <tr key={index}>
              <td>{item.id}</td>
              <td>{item.path}</td>
              <td>{item.name}</td>
              <td>{item.size}</td>
              <td>{item.ctime}</td>
              <td>{item.mtime}</td>
              <td>{item.atime}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderAdvancedMetadataTable = () => {
    return (
      <table>
        <thead>
          <tr>
            <th>File Name</th>
            <th>Metadata</th>
          </tr>
        </thead>
        <tbody>
          {metadata.map((item, index) => (
            <React.Fragment key={index}>
              <tr>
                <td>{item.fileName}</td>
                <td>
                  <button onClick={() => toggleRow(index)}>
                    {expandedRows.includes(index) ? "Hide Metadata" : "View Metadata"}
                  </button>
                </td>
              </tr>
              {expandedRows.includes(index) && (
                <tr>
                  <td colSpan="2">
                    <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                      {Object.entries(item.metadataMap).map(([key, value]) => (
                        <div key={key}><strong>{key}:</strong> {value}</div>
                      ))}
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    );
  };

  // Render Pie and Bar charts
  const renderPieChart = (data, label) => (
    <Pie
      data={{
        labels: Object.keys(data),
        datasets: [
          {
            data: Object.values(data),
            backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"],
          },
        ],
      }}
      options={{
        responsive: true,
        plugins: {
          legend: {
            position: "top",
          },
        },
      }}
    />
  );

  const renderBarChart = (data, label) => (
    <Bar
      data={{
        labels: Object.keys(data),
        datasets: [
          {
            label,
            data: Object.values(data),
            backgroundColor: "#36A2EB",
          },
        ],
      }}
      options={{
        responsive: true,
        plugins: {
          legend: {
            display: false,
          },
        },
      }}
    />
  );

  return (
    <div className="App">
      <h1>File Insights</h1>
      <div className="tabs">
        {["process", "metadata", "delete", "analytics", "datasources"].map((tab) => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {/* Process Tab */}
        {activeTab === "process" && (
          <div>
            <h3>Process Folder</h3>
            <input
              type="text"
              placeholder="Enter folder path"
              value={folderPath}
              onChange={(e) => setFolderPath(e.target.value)}
            />
            <button onClick={processFolder} disabled={loading}>
              {loading ? "Processing..." : "Process Folder"}
            </button>
          </div>
        )}

        {/* Metadata Tab */}
        {activeTab === "metadata" && (
          <div>
            <h3>Find Metadata</h3>
            <input
              type="text"
              placeholder="Enter path to fetch metadata"
              value={fetchPath}
              onChange={(e) => setFetchPath(e.target.value)}
            />
            <div>
              <label>
                <input
                  type="radio"
                  name="metadataType"
                  value="basic"
                  checked={metadataType === "basic"}
                  onChange={() => setMetadataType("basic")}
                />
                Basic Metadata
              </label>
              <label>
                <input
                  type="radio"
                  name="metadataType"
                  value="advanced"
                  checked={metadataType === "advanced"}
                  onChange={() => setMetadataType("advanced")}
                />
                Advanced Metadata
              </label>
            </div>
            <button onClick={fetchMetadata} disabled={loading}>
              {loading ? "Fetching..." : "Find Metadata"}
            </button>
            {metadata.length > 0 ? (
              metadataType === "basic" ? renderBasicMetadataTable() : renderAdvancedMetadataTable()
            ) : (
              <p>No metadata available.</p>
            )}
          </div>
        )}

        {/* Delete Tab */}
        {activeTab === "delete" && (
          <div>
            <h3>Delete Metadata</h3>
            <input
              type="text"
              placeholder="Enter path to delete metadata"
              value={deletePath}
              onChange={(e) => setDeletePath(e.target.value)}
            />
            <button onClick={deleteMetadata} disabled={loading}>
              {loading ? "Deleting..." : "Delete Metadata"}
            </button>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div>
            <h3>File Age Distribution</h3>
            {Object.keys(fileAgeData).length > 0 ? (
              renderBarChart(fileAgeData, "File Age")
            ) : (
              <p>No data available for File Age</p>
            )}
            <h3>File Type Distribution</h3>
            {Object.keys(fileTypeData).length > 0 ? (
              renderPieChart(fileTypeData, "File Types")
            ) : (
              <p>No data available for File Types</p>
            )}
          </div>
        )}

        {/* DataSources Tab */}
        {activeTab === "datasources" && (
          <div>
            <h2>Data Sources</h2>
            <div>
              <label>
                NFS/SMB Host:
                <input
                  type="text"
                  value={nfsHost}
                  onChange={(e) => setNfsHost(e.target.value)}
                  placeholder="Enter NFS/SMB Host"
                />
              </label>
              <label>
                Username:
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter Username"
                />
              </label>
              <label>
                Password:
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Password"
                />
              </label>
              <label>
                Share Path:
                <input
                  type="text"
                  value={sharePath}
                  onChange={(e) => setSharePath(e.target.value)}
                  placeholder="Enter Share Path"
                />
              </label>
              <button onClick={handleSaveCredentials}>Save Credentials</button>
            </div>

            <div>
              <h3>Saved Credentials</h3>
              {savedCredentials.length > 0 ? (
                savedCredentials.map((cred, index) => (
                  <div key={index}>
                    <p>{cred.nfsHost}</p>
                    <button onClick={() => handleRemoveCredential(index)}>Remove</button>
                  </div>
                ))
              ) : (
                <p>No saved credentials.</p>
              )}
            </div>
          </div>
        )}

        {successMessage && <p className="success">{successMessage}</p>}
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}

export default App;
