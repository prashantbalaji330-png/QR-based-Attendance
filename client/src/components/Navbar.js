import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaUser, FaSignOutAlt, FaCog } from 'react-icons/fa';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    return user?.role === 'teacher' ? '/teacher' : '/student';
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showDropdown]);

  return (
    <nav className="navbar navbar-expand-lg navbar-light">
      <div className="container">
        <Link className="navbar-brand" to="/">
          📱 QR Attendance System
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className="nav-link" to={getDashboardLink()}>
                Dashboard
              </Link>
            </li>
            {user?.role === 'teacher' && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/teacher/qr-generate">
                    Generate QR
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/teacher/attendance">
                    View Attendance
                  </Link>
                </li>
              </>
            )}
            {user?.role === 'student' && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/student/scan">
                    Scan QR
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/student/my-attendance">
                    My Attendance
                  </Link>
                </li>
              </>
            )}
          </ul>

          <div className="navbar-nav">
            {/* Mobile: Direct logout button */}
            <div className="d-lg-none nav-item">
              <button
                className="btn btn-outline-danger nav-link w-100 text-start"
                onClick={handleLogout}
                style={{ border: 'none', padding: '0.5rem 1rem' }}
              >
                <FaSignOutAlt className="me-2" />
                Logout
              </button>
            </div>

            {/* Desktop: Dropdown menu */}
            <div className="d-none d-lg-block nav-item dropdown" ref={dropdownRef}>
              <button
                className="btn btn-link nav-link dropdown-toggle"
                onClick={() => setShowDropdown(!showDropdown)}
                style={{ textDecoration: 'none' }}
              >
                <FaUser className="me-1" />
                {user?.name}
              </button>
              {showDropdown && (
                <div className="dropdown-menu show dropdown-menu-end" style={{ position: 'absolute', right: 0 }}>
                  <Link 
                    className="dropdown-item" 
                    to="/profile"
                    onClick={() => setShowDropdown(false)}
                  >
                    <FaCog className="me-2" />
                    Profile
                  </Link>
                  <button
                    className="dropdown-item"
                    onClick={handleLogout}
                  >
                    <FaSignOutAlt className="me-2" />
                    Logout
                  </button>
                </div>
              )}
            </div>

            {/* Mobile: Profile link */}
            <div className="d-lg-none nav-item">
              <Link 
                className="nav-link" 
                to="/profile"
                style={{ padding: '0.5rem 1rem' }}
              >
                <FaCog className="me-2" />
                Profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 