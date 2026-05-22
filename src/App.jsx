import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

import AdminDashboard from "./pages/admin/AdminDashboard";
import ProfessorDashboard from "./pages/professor/ProfessorDashboard";
import StudentDashboard from "./pages/student/StudentDashboard";
import DeanDashboard from "./pages/dean/DeanDashboard";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import ProfessorsPage from "./pages/admin/ProfessorsPage";
import CoursesPage from "./pages/admin/CoursesPage";
import CreateDeanPage from "./pages/admin/CreateDeanPage";
import ManageAccountsPage from "./pages/admin/ManageAccountsPage";
import ExamsPage from "./pages/professor/ExamsPage";
import CreateExamPage from "./pages/professor/CreateExamPage";
import MonitoringCenterPage from "./pages/professor/MonitoringCenterPage";
import JoinCoursePage from "./pages/student/JoinCoursePage";
import TakeExamPage from "./pages/student/TakeExamPage";
import EnvironmentScanPage from "./pages/student/EnvironmentScanPage";
import GradesPage from "./pages/student/GradesPage";
import ExamApprovalsPage from "./pages/dean/ExamApprovalsPage";
import ReportsPage from "./pages/dean/ReportsPage";
import ViolationsPage from "./pages/dean/ViolationsPage";
import ScoresPage from "./pages/professor/ScoresPage";
import StudentCoursesPage from "./pages/student/StudentCoursePage";
import AvailableExamsPage from "./pages/student/AvailableExamsPage";
import ProfileSettingsPage from "./pages/Profile/ProfileSettingsPage";
import NotificationSettingsPage from "./pages/Profile/NotificationSettingsPage";
import PrivacyPasswordPage from "./pages/Profile/PrivacyPasswordPage";
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleProtectedRoute from "./routes/RoleProtectedRoute";
import ProfessorCoursesPage from "./pages/professor/ProfessorCoursesPage";
import CreateProfessorPage from "./pages/admin/CreateProfessorPage";
import AttemptDetailsPage from "./pages/professor/AttemptDetailsPage";
import SuspiciousActivityPage from "./pages/professor/SuspiciousActivityPage";
import ResourcesPage from "./pages/student/ResourcesPage";
import StudentCoursePage from "./pages/student/StudentCoursePage";
import AdminReportsPage from "./pages/admin/AdminReportsPage";
import DeanStudentHistoryPage from "./pages/dean/DeanStudentHistoryPage";
import MessagesPage from "./pages/messages/MessagesPage";
import UpdatePassword from "./pages/auth/UpdatePassword";


function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route
  path="/update-password"
  element={<UpdatePassword />}
/>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/professor/dashboard" element={<ProfessorDashboard />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/dean/dashboard" element={<DeanDashboard />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/admin/professors" element={<ProfessorsPage />} />
        <Route path="/admin/courses" element={<CoursesPage />} />
        <Route path="/admin/create-dean" element={<CreateDeanPage />} />
        <Route path="/admin/accounts" element={<ManageAccountsPage />} />
        <Route path="/professor/exams" element={<ExamsPage />} />
        <Route path="/professor/exams/create" element={<CreateExamPage />} />
        <Route path="/professor/monitoring" element={<MonitoringCenterPage />}/>
        <Route path="/student/join-course" element={<JoinCoursePage />} />
        <Route path="/student/take-exam" element={<TakeExamPage />} />
        <Route path="/student/environment-scan" element={<EnvironmentScanPage />} />
        <Route path="/student/grades" element={<GradesPage />} />
        <Route path="/dean/approvals" element={<ExamApprovalsPage />} />
        <Route path="/dean/reports" element={<ReportsPage />} />
        <Route path="/dean/violations" element={<ViolationsPage />} />
        <Route path="/professor/scores" element={<ScoresPage />} />
        <Route path="/student/courses" element={<StudentCoursesPage />} />
        
        <Route path="/student/exams" element={<AvailableExamsPage />} />
        <Route path="/profile/settings" element={<ProfileSettingsPage />} />
        <Route path="/profile/notifications"element={<NotificationSettingsPage />}/>
        <Route path="/profile/password"element={<PrivacyPasswordPage />}/>
        <Route path="/student/dashboard"element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>}/>
        <Route path="/professor/dashboard"element={<ProtectedRoute><ProfessorDashboard /></ProtectedRoute>}/>
        <Route path="/dean/dashboard"element={<ProtectedRoute><DeanDashboard /></ProtectedRoute>}/>
        <Route path="/profile/settings"element={<ProtectedRoute><ProfileSettingsPage /></ProtectedRoute>}/>
        <Route path="/admin/dashboard"element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>}/>
        <Route path="/profile/notifications"element={<ProtectedRoute><NotificationSettingsPage /></ProtectedRoute>}/>
        <Route path="/profile/password"element={<ProtectedRoute><PrivacyPasswordPage /></ProtectedRoute>}/>
        <Route path="/admin/dashboard"element={<RoleProtectedRoute allowedRole="admin"><AdminDashboard /></RoleProtectedRoute>}/>
        <Route path="/professor/dashboard"element={<RoleProtectedRoute allowedRole="professor"><ProfessorDashboard /></RoleProtectedRoute>}/>
        <Route path="/student/dashboard"element={<RoleProtectedRoute allowedRole="student"><StudentDashboard /></RoleProtectedRoute>}/>
        <Route path="/dean/dashboard"element={<RoleProtectedRoute allowedRole="dean"><DeanDashboard /></RoleProtectedRoute>}/>
        <Route path="/professor/courses"element={<RoleProtectedRoute allowedRole="professor"><ProfessorCoursesPage /></RoleProtectedRoute>}/>
        <Route path="/admin/professors/create"element={<RoleProtectedRoute allowedRole="admin"><CreateProfessorPage /></RoleProtectedRoute>}/>
        <Route path="/student/exams"element={<RoleProtectedRoute allowedRole="student"><AvailableExamsPage /></RoleProtectedRoute>}/>
        <Route path="/student/exam/:examId"element={<RoleProtectedRoute allowedRole="student"><TakeExamPage /></RoleProtectedRoute>}/>
        <Route path="/professor/attempt/:attemptId"element={<RoleProtectedRoute allowedRole="professor"><AttemptDetailsPage /></RoleProtectedRoute>}/>
        <Route path="/professor/suspicious/:studentId"element={<RoleProtectedRoute allowedRole="professor"><SuspiciousActivityPage /></RoleProtectedRoute>}/>
        <Route path="/student/resources"element={<RoleProtectedRoute allowedRole="student"><ResourcesPage /></RoleProtectedRoute>}/>
        <Route
  path="/student/course/:courseId"
  element={
    <RoleProtectedRoute allowedRole="student">
      <StudentCoursePage />
    </RoleProtectedRoute>
  }
/>
<Route path="/profile/settings" element={<ProfileSettingsPage />} />
<Route path="/admin/reports" element={<AdminReportsPage />} />
<Route path="/dean/reports/student/:id"element={<DeanStudentHistoryPage />}
/>
<Route path="/messages" element={<MessagesPage />} />
<Route
  path="/messages"
  element={<MessagesPage />}
/>
        </Routes></BrowserRouter>
        
        
);
}

export default App;