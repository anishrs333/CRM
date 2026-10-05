import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import './Breadcrumbs.css';

const routeNameMap = {
  dashboard: 'Executive Dashboard',
  certificates: 'Certificates Roster',
  students: 'All Students Registry',
  'ongoing-students': 'Ongoing Trainee Tracker',
  'completed-students': 'Course Completed Students',
  'placed-students': 'Placed Students & Drives',
  'student-payments': 'Fee Receipts & Statements',
  courses: 'Courses & Curriculum',
  companies: 'Corporate Hiring Partners',
  'learning-paths': 'Learning Paths',
  'student-performance': 'Student Performance',
  'live-classes': 'Live Classes',
  'jobs-and-internships': 'Jobs & Internships',
  school: 'School Workspace',
  admissions: 'School Admissions',
  'academic-years': 'Academic Years',
  classes: 'Classes & Sections',
  subjects: 'School Subjects',
  timetable: 'Timetable Scheduler',

  assignments: 'Homework & Assignments',
  exams: 'Exams & Results',
  parents: 'Parents & Guardians',
  fees: 'School Fee Management',
  'audit-logs': 'Audit & Security Logs',
  settings: 'Institute Settings',
};

export const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(Boolean);

  if (pathnames.length === 0 || (pathnames.length === 1 && pathnames[0] === 'dashboard')) {
    return null; // Keep dashboard view ultra-clean
  }

  return (
    <nav className="crm-breadcrumbs" aria-label="Breadcrumb">
      <div className="breadcrumb-item">
        <Link to="/dashboard" className="breadcrumb-link" title="Dashboard">
          <Home size={15} />
        </Link>
      </div>

      {pathnames.map((segment, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const displayName = routeNameMap[segment] || segment;

        return (
          <div key={to} className="breadcrumb-item">
            <ChevronRight size={14} className="breadcrumb-separator" />
            {isLast ? (
              <span className="breadcrumb-current" aria-current="page">
                {displayName}
              </span>
            ) : (
              <Link to={to} className="breadcrumb-link">
                {displayName}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
};
