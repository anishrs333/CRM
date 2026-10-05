import React from 'react';
import { NavLink, useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useWorkspace } from '../../context/WorkspaceContext';
import { 
  Building2, 
  LayoutDashboard, 
  GraduationCap,
  Users, 
  Briefcase, 
  Package, 
  Settings,
  Clock,
  Award,
  IndianRupee,
  School,
  BookOpen,
  Calendar,
  FileText,
  ShieldCheck,
  Layers,
  Sparkles,
  ClipboardList,
  Cpu,
  Laptop
} from 'lucide-react';
import './Sidebar.css';

export const Sidebar = ({ 
  isCollapsed, 
  isMobileOpen, 
  onCloseMobile 
}) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { workspace, setWorkspace } = useWorkspace();

  const techAcademySections = [
    {
      title: 'TECH ACADEMY COMMAND',
      items: [
        {
          label: 'Executive Dashboard',
          path: '/dashboard',
          icon: LayoutDashboard,
          exact: true,
        },
        {
          label: 'Ongoing Trainee Tracker',
          path: '/ongoing-students',
          icon: Clock,
          badge: 'Active',
          badgeClass: 'badge-primary',
        },
        {
          label: 'Course Completed List',
          path: '/completed-students',
          icon: Award,
          badge: 'Completed',
          badgeClass: 'badge-success',
        },
        {
          label: 'Placed Students & Drives',
          path: '/placed-students',
          icon: Briefcase,
          badge: 'Placed',
          badgeClass: 'badge-warning',
        },
        {
          label: 'Fee Receipts & Statements',
          path: '/student-payments',
          icon: IndianRupee,
          badge: 'PDF',
          badgeClass: 'badge-primary',
        },
        {
          label: 'Trainee Registry',
          path: '/students',
          icon: GraduationCap,
        },
      ],
    },
    {
      title: 'LEARNING & PLACEMENTS',
      items: [
        {
          label: 'Learning Paths',
          path: '/learning-paths',
          icon: Layers,
        },
        {
          label: 'Student Performance',
          path: '/student-performance',
          icon: Sparkles,
        },
        {
          label: 'Live Classes & Sessions',
          path: '/live-classes',
          icon: BookOpen,
        },
        {
          label: 'Jobs & Internships',
          path: '/jobs-and-internships',
          icon: Briefcase,
        },
      ],
    },
    {
      title: 'CURRICULUM & RECRUITERS',
      items: [
        {
          label: 'Certificates Roster',
          path: '/certificates',
          icon: Award,
          badge: 'Verified',
          badgeClass: 'badge-success',
        },
        {
          label: 'Courses & Curriculum',
          path: '/courses',
          icon: Package,
        },
        {
          label: 'Hiring Partner Companies',
          path: '/companies',
          icon: Building2,
        },
      ],
    },
    {
      title: 'ADMINISTRATION',
      items: [
        {
          label: 'Academy Settings',
          path: '/settings',
          icon: Settings,
        },
      ],
    },
  ];

  const techCampusSections = [
    {
      title: 'TECH CAMPUS DASHBOARD',
      items: [
        {
          label: 'Campus Command Center',
          path: '/school/dashboard',
          icon: School,
          exact: true,
        },
      ],
    },
    {
      title: 'STUDENTS & PARENTS',
      items: [
        {
          label: 'Campus Students Roster',
          path: '/school/students',
          icon: GraduationCap,
        },
        {
          label: 'Admissions Workflow',
          path: '/school/admissions',
          icon: ClipboardList,
          badge: 'Pipeline',
          badgeClass: 'badge-primary',
        },
        {
          label: 'Parents & Guardians',
          path: '/school/parents',
          icon: Users,
        },
      ],
    },
    {
      title: 'ACADEMICS & TIMETABLE',
      items: [
        {
          label: 'Academic Years',
          path: '/school/academic-years',
          icon: Calendar,
        },
        {
          label: 'Classes & Sections',
          path: '/school/classes',
          icon: Layers,
        },
        {
          label: 'Campus Subjects',
          path: '/school/subjects',
          icon: BookOpen,
        },
        {
          label: 'Timetable Scheduler',
          path: '/school/timetable',
          icon: Clock,
        },
      ],
    },
    {
      title: 'ASSIGNMENTS & EVALUATIONS',
      items: [


        {
          label: 'Labs & Assignments',
          path: '/school/assignments',
          icon: FileText,
        },
        {
          label: 'Exams & Evaluations',
          path: '/school/exams',
          icon: Award,
        },
      ],
    },
    {
      title: 'FINANCE & AUDIT',
      items: [
        {
          label: 'Campus Fee Management',
          path: '/school/fees',
          icon: IndianRupee,
        },
        {
          label: 'Audit & Security Logs',
          path: '/school/audit-logs',
          icon: ShieldCheck,
        },
        {
          label: 'Campus Settings',
          path: '/settings',
          icon: Settings,
        },
      ],
    },
  ];

  const navigationSections = workspace === 'school' ? techCampusSections : techAcademySections;

  const isRouteActive = (item) => {
    const current = location.pathname;
    if (item.exact) {
      return current === item.path;
    }
    return current.startsWith(item.path);
  };

  const handleWorkspaceToggle = (targetWorkspace) => {
    setWorkspace(targetWorkspace);
    if (targetWorkspace === 'school') {
      navigate('/school/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`crm-sidebar ${isCollapsed ? 'collapsed' : ''} ${
          isMobileOpen ? 'mobile-open' : ''
        }`}
        aria-label="Sidebar Navigation"
      >
        {/* Brand Header */}
        <div className="sidebar-header">
          <Link to={workspace === 'school' ? "/school/dashboard" : "/dashboard"} className="sidebar-brand-link" onClick={onCloseMobile}>
            <div className="sidebar-logo">
              {workspace === 'school' ? <Cpu size={22} /> : <Laptop size={22} />}
            </div>
            {!isCollapsed && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="sidebar-brand-name">
                  APEX TECHED
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {workspace === 'school' ? 'Tech Campus' : 'Tech Academy'}
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Workspace Switcher Selector */}
        {!isCollapsed && (
          <div className="workspace-switcher-wrap">
            <div className="workspace-title">Active Workspace</div>
            <div className="workspace-grid">
              <button
                type="button"
                className={`workspace-btn workspace-btn-institute ${workspace === 'institute' ? 'active' : ''}`}
                onClick={() => handleWorkspaceToggle('institute')}
              >
                <Laptop size={13} />
                <span>Academy</span>
              </button>
              <button
                type="button"
                className={`workspace-btn workspace-btn-school ${workspace === 'school' ? 'active' : ''}`}
                onClick={() => handleWorkspaceToggle('school')}
              >
                <Cpu size={13} />
                <span>Campus</span>
              </button>
            </div>
          </div>
        )}

        {/* Navigation Content */}
        <div className="sidebar-scrollable">
          {navigationSections.map((section, idx) => (
            <div key={section.title || idx} className="sidebar-section">
              {!isCollapsed && section.title && (
                <div className="sidebar-section-title">{section.title}</div>
              )}
              <ul className="sidebar-menu">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isRouteActive(item);

                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        className={`sidebar-link ${active ? 'active' : ''}`}
                        onClick={onCloseMobile}
                        title={isCollapsed ? item.label : undefined}
                      >
                        <Icon size={18} className="sidebar-icon" />
                        {!isCollapsed && (
                          <>
                            <span className="sidebar-label">{item.label}</span>
                            {item.badge && (
                              <span className={`sidebar-badge ${item.badgeClass || ''}`}>
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
