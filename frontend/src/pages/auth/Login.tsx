import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Credentials } from "@/types/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { jwtDecode } from "jwt-decode";
import { Loader } from "@/components/ui/loader";

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
    <div className="flex items-center justify-center min-h-screen bg-grid-pattern">
      <div className="flex w-full max-w-4xl overflow-hidden bg-background rounded-lg shadow-lg">
        <div className="w-1/2 p-8 border-y border-l rounded-l-lg">
          <h2 className="mb-6 text-3xl font-bold text-center">Sign in</h2>
          <p className="text-center text-muted-foreground mb-6">
            with your email password
          </p>
          <div className="space-y-4">
            <form onSubmit={handleSubmit}></form>
            <Input
              placeholder="Email"
              value={credentials.email}
              onChange={(event) =>
                setCredentials({ ...credentials, email: event.target.value })
              }
            />
            <Input
              type="password"
              placeholder="Password"
              value={credentials.password}
              onChange={(event) =>
                setCredentials({
                  ...credentials,
                  password: event.target.value,
                })
              }
            />
          </div>
          <div className="mt-4 text-right">
            <Link
              to="/forgot-password"
              className="text-sm text-muted-foreground"
            >
              Forgot your password?
            </Link>
          </div>
          <Button className="w-full mt-6" onClick={handleSubmit}>
            SIGN IN
          </Button>
        </div>
        <div className="flex items-center justify-center w-1/2 bg-white">
          <div className="text-center">
            <h2 className="mb-4 text-3xl font-bold text-primary-foreground">
              Hello, Friend!
            </h2>
            <p className="mb-6 text-primary-foreground">
              Register your personal details and start journey with us
            </p>
            <Link
              to="/register"
              className={buttonVariants({ variant: "secondary" })}
            >
              SIGN UP
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
