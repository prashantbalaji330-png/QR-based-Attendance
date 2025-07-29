import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaQrcode, FaCheck, FaTimes, FaCamera } from 'react-icons/fa';

const QRScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, []);

  const handleScan = async (decodedText) => {
    if (decodedText) {
      setScanning(false);
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
      setResult(decodedText);
      await validateAndMarkAttendance(decodedText);
    }
  };

  const handleError = (err) => {
    console.error(err);
    toast.error('Error scanning QR code');
  };

  const validateAndMarkAttendance = async (qrCode) => {
    setLoading(true);
    
    try {
      // First validate the QR code
      const validateResponse = await axios.post('/api/qr/validate', {
        code: qrCode
      });

      if (validateResponse.data.success) {
        // Mark attendance
        const attendanceResponse = await axios.post('/api/attendance/mark', {
          qrCodeId: validateResponse.data.data._id
        });

        if (attendanceResponse.data.success) {
          toast.success(attendanceResponse.data.message);
          setResult({
            success: true,
            message: attendanceResponse.data.message,
            data: attendanceResponse.data.data
          });
        }
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to mark attendance';
      toast.error(message);
      setResult({
        success: false,
        message: message
      });
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setScanning(true);
    setResult(null);
  };

  const startScanner = () => {
    setScanning(true);
    setResult(null);
    
    setTimeout(() => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
      
      scannerRef.current = new Html5QrcodeScanner(
        "qr-reader",
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        false
      );
      
      scannerRef.current.render(handleScan, handleError);
    }, 100);
  };

  return (
    <div>
      <div className="row mb-4">
        <div className="col-12">
          <h2 className="fw-bold text-white">Scan QR Code</h2>
          <p className="text-white-50">Scan the QR code to mark your attendance</p>
        </div>
      </div>

      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title mb-3 text-center">QR Code Scanner</h5>
              
              {!scanning && !result && (
                <div className="text-center">
                  <FaQrcode size={100} className="text-muted mb-3" />
                  <p className="text-muted">Click the button below to start scanning</p>
                  <button
                    className="btn btn-primary"
                    onClick={startScanner}
                  >
                    <FaCamera className="me-2" />
                    Start Scanning
                  </button>
                </div>
              )}

              {scanning && (
                <div className="text-center">
                  <div className="scanner-container mb-3">
                    <div id="qr-reader"></div>
                  </div>
                  <p className="text-muted">Point your camera at the QR code</p>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setScanning(false);
                      if (scannerRef.current) {
                        scannerRef.current.clear();
                      }
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}

              {result && (
                <div className="text-center">
                  {result.success ? (
                    <div className="alert alert-success">
                      <FaCheck className="me-2" />
                      {result.message}
                    </div>
                  ) : (
                    <div className="alert alert-danger">
                      <FaTimes className="me-2" />
                      {result.message}
                    </div>
                  )}
                  
                  <div className="mt-3">
                    <button
                      className="btn btn-primary me-2"
                      onClick={resetScanner}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <FaQrcode className="me-2" />
                          Scan Another
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title mb-3">Instructions</h5>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <strong>1.</strong> Click "Start Scanning" to activate your camera
                </li>
                <li className="mb-2">
                  <strong>2.</strong> Point your camera at the QR code displayed by your teacher
                </li>
                <li className="mb-2">
                  <strong>3.</strong> Hold steady until the QR code is detected
                </li>
                <li className="mb-2">
                  <strong>4.</strong> Your attendance will be automatically marked
                </li>
                <li className="mb-2">
                  <strong>5.</strong> You can only mark attendance once per QR code
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScanner; 