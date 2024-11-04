import React, { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { isTokenExpired } from "@/utils/auth";
import { Loader } from "./ui/loader";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const location = useLocation();

  const [loading, setLoading] = useState<boolean>(true);
  const [userTokenExpired, setUserTokenExpired] = useState<boolean>(false);

  useEffect(() => {
    if (user && user.token) {
      if (isTokenExpired(user.token)) {
        setLoading(false);
        setUserTokenExpired(true);
      } else {
        const origin =
          (location.state as { from: { pathname: string } })?.from?.pathname ||
          "/dashboard";
        const searchParams = location.search;
        navigate(`${origin}${searchParams}`);
      }
    }
    setLoading(false);
  }, [location.search, location.state, navigate, user]);

  if (loading) {
    return <Loader />;
  }

  if (!user || userTokenExpired) {
    return (
      <Navigate
        to={`/login${location.search}`}
        state={{ from: location, tokenExpired: userTokenExpired }}
        replace
      />
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
