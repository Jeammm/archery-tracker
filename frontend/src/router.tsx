import {
  createBrowserRouter,
  createRoutesFromElements,
  Outlet,
  Route,
  RouterProvider,
} from "react-router-dom";
import { Home } from "./pages/home/Home";
import { PageLayout } from "./components/pageLayout";
import { Dashboard } from "./pages/dashboard/Dashboard";
import Login from "./components/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import { NavBar } from "./components/header/NavBar";
import { SessionDetail } from "./pages/stats/SessionDetail";
import { SessionsList } from "./pages/stats/SessionsList";

// import { TrainingSession } from "./pages/trainingSession/TrainingSession";
// import { TargetFeed } from "./pages/trainingSession/TargetFeed";
import { TargetModelSelect } from "./pages/trainingSession/TargetModelSelect";
import { SessionInitiate } from "./pages/trainingSession/SessionInitiate";
import { JoinSession } from "./pages/trainingSession/JoinSession";
import { Profile } from "./pages/profile/Profile";
import { PasswordReset } from "./pages/profile/PasswordReset";
import { PasswordForgot } from "./pages/profile/PasswordForgot";
import { SignUp } from "./components/SignUp";
import { VerifyEmail } from "./components/VerifyEmail";

function RequireAuth() {
  return (
    <ProtectedRoute>
      <PageLayout>
        <Outlet />
      </PageLayout>
    </ProtectedRoute>
  );
}

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <>
            <NavBar />
            <Home />
          </>
        }
      />
      <Route path="/forgot-password" element={<PasswordForgot />} />
      <Route
        path="/reset-forgot-password"
        element={<PasswordReset isOldPasswordForgot />}
      />
      <Route path="/register" element={<SignUp />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      <Route path="/join" element={<JoinSession />} />
      <Route
        element={<RequireAuth />}
        errorElement={
          <div>
            <p>Error not found 404 Ja</p>
          </div>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/sessions">
          <Route path="" element={<SessionsList />} />
          <Route path=":sessionId" element={<SessionDetail />} />
        </Route>

        <Route path="/trainingSession">
          <Route path="" element={<TargetModelSelect />} />
          <Route path="live/:sessionId" element={<SessionInitiate />} />
        </Route>

        <Route path="/profile" element={<Profile />} />
        <Route path="/password-reset" element={<PasswordReset />} />
      </Route>
    </>
  )
);

export const Router = () => {
  return <RouterProvider router={router} />;
};
