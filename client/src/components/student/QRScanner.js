import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaQrcode, FaCheck, FaTimes, FaCamera, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';

const QRScanner = () => {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(true);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.stop().then(() => {
            scannerRef.current.clear();
          }).catch(() => {});
        } catch (e) {}
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
    // html5-qrcode emits frequent non-fatal scan errors; throttle and only surface fatal cases
    const errString = typeof err === 'string' ? err : (err?.message || '');
    const fatalHints = [
      'NotAllowedError', // permissions denied
      'NotFoundError',   // no camera
      'NotReadableError',
      'OverconstrainedError',
      'StreamApiNotSupportedError',
      'InsecureContextError'
    ];

    if (fatalHints.some(h => errString.includes(h))) {
      toast.error('Camera error: ' + (errString || 'permission or device issue'));
      setScanning(false);
      try {
        scannerRef.current?.stop();
      } catch (_) {}
      return;
    }

    // Ignore non-fatal decode errors to avoid spamming the UI
  };

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        resolve({ latitude: null, longitude: null });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Location access denied or unavailable:', error);
          resolve({ latitude: null, longitude: null });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  };

  const validateAndMarkAttendance = async (qrCode) => {
    setLoading(true);
    
    try {
      // Get current location coordinates
      const coordinates = await getCurrentLocation();
      
      const token = localStorage.getItem('token');
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

      // First validate the QR code
      const validateResponse = await axios.post(
        `${API_BASE_URL}/api/qr/validate`,
        { code: qrCode },
        { headers: authHeaders }
      );

      if (validateResponse.data.success) {
        // Mark attendance with coordinates
        const attendanceResponse = await axios.post(
          `${API_BASE_URL}/api/attendance/mark`,
          {
            qrCodeId: validateResponse.data.data._id,
            coordinates
          },
          { headers: authHeaders }
        );

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
      try {
        if (scannerRef.current) {
          scannerRef.current.stop().then(() => scannerRef.current.clear()).catch(() => {});
        }
        // Instantiate and start immediately on the back camera (environment)
        scannerRef.current = new Html5Qrcode('qr-reader');
        scannerRef.current.start(
          { facingMode: { exact: 'environment' } },
          { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
          handleScan,
          handleError
        );
      } catch (e) {
        // Fallback to any available camera if exact environment is not available
        try {
          scannerRef.current = new Html5Qrcode('qr-reader');
          scannerRef.current.start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
            handleScan,
            handleError
          );
        } catch (err) {
          toast.error('Unable to access camera');
          setScanning(false);
        }
      }
    }, 100);
  };

  // Auto-start scanning when the page loads
  useEffect(() => {
    startScanner();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
                    {result.success ? (
                      <button className="btn btn-success" onClick={() => navigate('/student')}>
                        <FaArrowLeft className="me-2" />
                        Back to Dashboard
                      </button>
                    ) : (
                      <button className="btn btn-primary" onClick={resetScanner} disabled={loading}>
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
                    )}
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