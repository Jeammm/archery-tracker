import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Credentials } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { jwtDecode } from "jwt-decode";
import { Loader } from "@/components/ui/loader";

import StatBanner from "@/assets/stat_banner.png";

interface JwtPayload {
  exp: number;
}

const Login = () => {
  const [credentials, setCredentials] = useState<Credentials>({
    email: "",
    password: "",
  });
  const { login, user } = useAuth();
  const [loading, setLoading] = useState(true); // Add loading state
  const navigate = useNavigate();
  const location = useLocation();

  const isTokenExpired = (token: string): boolean => {
    try {
      const decoded: JwtPayload = jwtDecode(token);
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  };

  const handleSubmit = async () => {
    setLoading(true); // Set loading state while processing login
    const success = await login(credentials);
    setLoading(false); // Stop loading after login is processed
    if (success) {
      const origin =
        (location.state as { from: { pathname: string } })?.from?.pathname ||
        "/dashboard";
      navigate(origin);
    } else {
      alert("Login failed");
    }
  };

  useEffect(() => {
    if (user && user.token) {
      if (isTokenExpired(user.token)) {
        alert("Session expired. Please log in again.");
        setLoading(false); // Stop loading if session is expired
      } else {
        const origin =
          (location.state as { from: { pathname: string } })?.from?.pathname ||
          "/dashboard";
        const searchParams = location.search;
        navigate(`${origin}${searchParams}`);
      }
    }
    setLoading(false); // Stop loading if no user token is found
  }, [location.search, location.state, navigate, user]);

  if (loading) {
    return (
      <div className="w-screen h-screen fixed top-0 left-0 flex items-center justify-center">
        <Loader />;
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-grid-pattern px-4 flex-col">
      <div className="flex w-full max-w-[80%] md:max-w-4xl overflow-hidden bg-background rounded-lg drop-shadow-lg">
        <div className="w-full md:w-1/2 p-6 flex items-center border rounded-lg md:rounded-r-none">
          <div className="w-full">
            <Link to="/">
              <h3 className="font-bold text-3xl mb-2 text-center">
                Archery Tracker
              </h3>
            </Link>
            <h2 className="mb-10 text-lg text-center font-light">
              Sign in with your email address
            </h2>
            <div className="space-y-4">
              <form onSubmit={handleSubmit}></form>
              <div>
                <p className="mb-2">Email address</p>
                <Input
                  value={credentials.email}
                  onChange={(event) =>
                    setCredentials({
                      ...credentials,
                      email: event.target.value,
                    })
                  }
                />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <p>Password</p>
                  <Link
                    to="/forgot-password"
                    className="text-sm text-muted-foreground"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <Input
                  type="password"
                  value={credentials.password}
                  onChange={(event) =>
                    setCredentials({
                      ...credentials,
                      password: event.target.value,
                    })
                  }
                />
              </div>
            </div>
            <Button className="w-full mt-6" onClick={handleSubmit}>
              SIGN IN
            </Button>
          </div>
        </div>
        <div className="hidden md:block w-1/2 p-4 bg-background">
          <div className="w-full h-[450px]">
            <img
              src={StatBanner}
              alt="Sign up"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
      <div className="w-full max-w-[80%] md:max-w-4xl bg-background flex border rounded-lg p-4 justify-center gap-1.5 mt-4">
        <p>New to Archery Tracker?</p>
        <Link to="/register" className="text-[#4493f8]">
          SIGN UP
        </Link>
      </div>
    </div>
  );
};

export default Login;
