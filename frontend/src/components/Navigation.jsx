import React from 'react';
import { NavLink } from 'react-router-dom';

function Navigation() {
  return (
    <nav className="nav">
      <div className="nav-content">
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Dashboard
        </NavLink>
        <NavLink to="/budgets" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Budget Management
        </NavLink>
        <NavLink to="/programs" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Program Planning
        </NavLink>
        <NavLink to="/execution" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Execution Tracking
        </NavLink>
        <NavLink to="/applications" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          My Applications
        </NavLink>
        <NavLink to="/application-management" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Application Management
        </NavLink>
      </div>
    </nav>
  );
}

export default Navigation;
