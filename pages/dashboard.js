// pages/dashboard.js
import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [scans, setScans] = useState([]);
  const [selectedScan, setSelectedScan] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  // 1. Fetch History on Load
  useEffect(() => {
    fetch('/api/scans')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
            setScans(data);
        } else {
            console.error("Data is not an array:", data);
        }
      })
      .catch(err => console.error("History Error:", err));
  }, []);

  // 2. Load Report Detail
  const loadReport = async (scan) => {
    setSelectedScan(scan);
    setLoading(true);
    setReportData(null);

    const s3Key = scan.s3_key_file_report;

    if (!s3Key || s3Key === 'missing' || s3Key === 'error_uploading') {
        alert("No valid report file found for this scan.");
        setLoading(false);
        return;
    }

    try {
        // A. Get Signed URL
        const signRes = await fetch(`/api/get-report?key=${encodeURIComponent(s3Key)}`);
        if (!signRes.ok) throw new Error("Failed to sign URL");
        const signData = await signRes.json();

        // B. Fetch JSON
        const fileRes = await fetch(signData.url);
        if (!fileRes.ok) throw new Error("Failed to download file from S3");
        const jsonData = await fileRes.json();

        setReportData(jsonData);
    } catch (err) {
        console.error("Download Error:", err);
        alert("Failed to load secure report.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif', flexDirection: 'row' }}>

      {/* Sidebar */}
      <div style={{ 
        width: '300px', 
        minWidth: '300px',
        borderRight: '1px solid #ddd', 
        background: '#f9f9f9', 
        display: 'flex', 
        flexDirection: 'column',
        overflowY: 'auto' 
      }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #ddd', background: '#fff' }}>
            <h3 style={{ margin: 0 }}>PQ Scan History</h3>
        </div>

        {scans.length === 0 && <div style={{padding: '20px'}}>No scans found or loading...</div>}

        {scans.map(scan => (
          <div 
            key={scan.run_id} 
            onClick={() => loadReport(scan)}
            style={{ 
              padding: '15px', 
              borderBottom: '1px solid #eee', 
              cursor: 'pointer',
              background: selectedScan?.run_id === scan.run_id ? '#e3f2fd' : 'transparent',
              transition: 'background 0.2s'
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                {scan.commit_message ? scan.commit_message.substring(0,40) : "No Message"}...
            </div>
            <div style={{ fontSize: '0.8em', color: '#666' }}>
              {new Date(scan.timestamp).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.7em', color: '#999', marginTop: '4px' }}>
              Commit: {scan.commit_hash ? scan.commit_hash.substring(0,7) : "N/A"}
            </div>
          </div>
        ))}
      </div>

      {/* Main View */}
      <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        {!selectedScan ? (
           <div style={{ 
               height: '100%', 
               display: 'flex', 
               alignItems: 'center', 
               justifyContent: 'center', 
               color: '#888',
               fontSize: '1.2em'
           }}>
               Select a scan from the sidebar to view details
           </div>
        ) : (
           <div>
             <header style={{ borderBottom: '1px solid #eee', paddingBottom: '20px', marginBottom: '20px' }}>
                 <h2 style={{ margin: 0 }}>Scan Report</h2>
                 <span style={{ color: '#666' }}>Run ID: {selectedScan.run_id}</span>
             </header>

             {loading && <div style={{ fontSize: '1.2em', color: '#0070f3' }}>Loading secure report from S3...</div>}

             {reportData && (
               <div>
                  {/* Summary Cards */}
                  <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
                    <div style={{ 
                        background: '#ffebee', 
                        padding: '20px', 
                        borderRadius: '8px', 
                        border: '1px solid #ffcdd2',
                        minWidth: '200px'
                    }}>
                      <strong style={{ display:'block', color: '#c62828', marginBottom: '5px' }}>Violations Found</strong>
                      <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#b71c1c' }}>
                          {reportData.items?.length || 0}
                      </span>
                    </div>

                    <div style={{ 
                        background: '#e3f2fd', 
                        padding: '20px', 
                        borderRadius: '8px', 
                        border: '1px solid #bbdefb',
                        minWidth: '200px'
                    }}>
                      <strong style={{ display:'block', color: '#1565c0', marginBottom: '5px' }}>Files Scanned</strong>
                      <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#0d47a1' }}>
                          {new Set(reportData.items?.map(i => i.id)).size || 0}
                      </span>
                    </div>
                  </div>

                  {/* Table */}
                  <div style={{ border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' }}>
                        <thead>
                          <tr style={{ background: '#f5f5f5', textAlign: 'left', color: '#333' }}>
                            <th style={{ padding: '15px', borderBottom: '1px solid #ddd' }}>File Path</th>
                            <th style={{ padding: '15px', borderBottom: '1px solid #ddd' }}>Weak Algorithm</th>
                            <th style={{ padding: '15px', borderBottom: '1px solid #ddd' }}>Proposed Remediation</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.items?.map((item, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #eee', background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                              <td style={{ padding: '15px', fontWeight: '500' }}>
                                  {item.id.split('/').slice(-2).join('/')}
                              </td>
                              <td style={{ padding: '15px' }}>
                                 {item.algorithms.map(alg => (
                                     <span key={alg.base} style={{ 
                                         background: '#fff3e0', 
                                         color: '#e65100',
                                         padding: '2px 6px', 
                                         borderRadius: '4px', 
                                         fontSize: '0.85em',
                                         border: '1px solid #ffe0b2',
                                         marginRight: '5px'
                                     }}>
                                         {alg.base}
                                     </span>
                                 ))}
                              </td>
                              <td style={{ padding: '15px', color: '#555' }}>
                                {item.remediation_guidance?.split(';')[0]}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                  </div>
               </div>
             )}
           </div>
        )}
      </div>
    </div>
  );
}