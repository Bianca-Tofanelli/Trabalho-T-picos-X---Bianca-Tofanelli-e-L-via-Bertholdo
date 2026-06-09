import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import ProfessorDashboard from "../pages/ProfessorDashboard";
import StudentDashboard from "../pages/StudentDashboard";

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<HomePage />}
        />

        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/professor"
          element={
            <ProfessorDashboard />
          }
        />

        <Route
          path="/aluno"
          element={
            <StudentDashboard />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}