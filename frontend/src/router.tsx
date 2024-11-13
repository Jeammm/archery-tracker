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
import Login from "./pages/auth/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import { NavBar } from "./components/header/NavBar";
import { SessionDetail } from "./pages/stats/SessionDetail";
import { SessionsList } from "./pages/stats/SessionsList";

import { TargetModelSelect } from "./pages/trainingSession/TargetModelSelect";
import { SessionInitiate } from "./pages/trainingSession/SessionInitiate";
import { JoinSession } from "./pages/trainingSession/JoinSession";
import { Profile } from "./pages/profile/Profile";
import { PasswordReset } from "./pages/auth/PasswordReset";
import { PasswordForgot } from "./pages/auth/PasswordForgot";
import { SignUp } from "./pages/auth/SignUp";
import { VerifyEmail } from "./pages/auth/VerifyEmail";
import { ModelCreate } from "./pages/models/ModelCreate";
import { ModelDetail } from "./pages/models/ModelDetail";
import { ModelEdit } from "./pages/models/ModelEdit";

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

        <Route path="/models">
          <Route path="create" element={<ModelCreate />} />
          <Route path=":modelName">
            <Route path="" element={<ModelDetail />} />
            <Route path="edit" element={<ModelEdit />} />
          </Route>
        </Route>
      </Route>
    </>
  )
);

export const Router = () => {
  return <RouterProvider router={router} />;
};
