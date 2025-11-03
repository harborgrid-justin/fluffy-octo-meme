import React from 'react';

function Header({ user, onLogout }) {
  return (
    <header className="header">
      <div className="header-content">
        <div>
          <h1>Federal PPBE Management System</h1>
          <p className="header-subtitle">Planning, Programming, Budgeting & Execution</p>
        </div>
        <div className="user-info">
          <div>
            <div className="user-name">{user?.username}</div>
            <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>{user?.department}</div>
          </div>
          <button className="btn-logout" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
