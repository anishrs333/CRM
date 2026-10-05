import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { MainLayout } from '../components/layouts/MainLayout';

import { LoginPage } from '../pages/auth/LoginPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { StudentListPage } from '../pages/students/StudentListPage';
import { OngoingTraineesPage } from '../pages/students/OngoingTraineesPage';
import { CompletedStudentsPage } from '../pages/students/CompletedStudentsPage';
import { PlacedStudentsPage } from '../pages/students/PlacedStudentsPage';
import { StudentPaymentsPage } from '../pages/students/StudentPaymentsPage';
import { CourseCatalogPage } from '../pages/courses/CourseCatalogPage';
import { HiringPartnersPage } from '../pages/companies/HiringPartnersPage';
import { UserListPage } from '../pages/users/UserListPage';
import { ReportsPage } from '../pages/reports/ReportsPage';
import { SettingsPage } from '../pages/settings/SettingsPage';
import { CertificatesPage } from '../pages/certificates/CertificatesPage';
import { VerifyCertificatePage } from '../pages/certificates/VerifyCertificatePage';

// Institute Learning & Placement Pages
import { LearningPathsPage } from '../pages/learning/LearningPathsPage';
import { StudentPerformancePage } from '../pages/learning/StudentPerformancePage';
import { LiveClassesPage } from '../pages/learning/LiveClassesPage';
import { JobsAndPlacementsPage } from '../pages/learning/JobsAndPlacementsPage';

// School Management Workspace Pages
import { SchoolDashboardPage } from '../pages/school/SchoolDashboardPage';
import { SchoolStudentsPage } from '../pages/school/SchoolStudentsPage';
import { SchoolAdmissionsPage } from '../pages/school/SchoolAdmissionsPage';
import { SchoolAcademicsPage } from '../pages/school/SchoolAcademicsPage';

import { SchoolAssignmentsPage } from '../pages/school/SchoolAssignmentsPage';
import { SchoolExamsPage } from '../pages/school/SchoolExamsPage';
import { SchoolParentsPage } from '../pages/school/SchoolParentsPage';
import { SchoolFeesPage } from '../pages/school/SchoolFeesPage';
import { AuditLogsPage } from '../pages/school/AuditLogsPage';

import { NotFoundPage } from '../pages/common/NotFoundPage';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Root Path defaults to Login page */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Public Certificate Verification Routes */}
      <Route path="/verify-certificate" element={<VerifyCertificatePage />} />
      <Route path="/verify-certificate/:certificateId" element={<VerifyCertificatePage />} />

      {/* Protected Routes inside Main CRM Layout */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        {/* Institute Workspace Routes */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/certificates" element={<CertificatesPage />} />
        <Route path="/students" element={<StudentListPage />} />
        <Route path="/students/:id" element={<StudentListPage />} />
        <Route path="/ongoing-students" element={<OngoingTraineesPage />} />
        <Route path="/completed-students" element={<CompletedStudentsPage />} />
        <Route path="/placed-students" element={<PlacedStudentsPage />} />
        <Route path="/student-payments" element={<StudentPaymentsPage />} />
        <Route path="/courses" element={<CourseCatalogPage />} />
        <Route path="/companies" element={<HiringPartnersPage />} />
        <Route path="/learning-paths" element={<LearningPathsPage />} />
        <Route path="/student-performance" element={<StudentPerformancePage />} />
        <Route path="/live-classes" element={<LiveClassesPage />} />
        <Route path="/jobs-and-internships" element={<JobsAndPlacementsPage />} />

        {/* School Workspace Routes */}
        <Route path="/school/dashboard" element={<SchoolDashboardPage />} />
        <Route path="/school/students" element={<SchoolStudentsPage />} />
        <Route path="/school/admissions" element={<SchoolAdmissionsPage />} />
        <Route path="/school/academic-years" element={<SchoolAcademicsPage />} />
        <Route path="/school/classes" element={<SchoolAcademicsPage />} />
        <Route path="/school/subjects" element={<SchoolAcademicsPage />} />
        <Route path="/school/timetable" element={<SchoolAcademicsPage />} />


        <Route path="/school/assignments" element={<SchoolAssignmentsPage />} />
        <Route path="/school/exams" element={<SchoolExamsPage />} />
        <Route path="/school/parents" element={<SchoolParentsPage />} />
        <Route path="/school/fees" element={<SchoolFeesPage />} />
        <Route path="/school/audit-logs" element={<AuditLogsPage />} />

        {/* Administration */}
        <Route path="/reports" element={<Navigate to="/dashboard" replace />} />
        <Route path="/users" element={<Navigate to="/dashboard" replace />} />
        <Route path="/permissions" element={<Navigate to="/dashboard" replace />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;