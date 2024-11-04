import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Credentials } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";

import StatBanner from "@/assets/stat_banner.png";
import StatBannerLight from "@/assets/stat_banner_light.png";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { isTokenExpired } from "@/utils/auth";

const Login = () => {
  const { lightOrDark } = useTheme();
  const [credentials, setCredentials] = useState<Credentials>({
    email: "",
    password: "",
  });
  const { login, user } = useAuth();
  const [loading, setLoading] = useState(true); // Add loading state
  const navigate = useNavigate();
  const location = useLocation();

  const [isLoginFailed, setIsLoginFailed] = useState<boolean>(false);

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
      setIsLoginFailed(true);
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
    <div
      className={cn([
        "flex items-center justify-center min-h-screen px-4 flex-col",
        lightOrDark === "dark" ? "bg-grid-pattern" : "bg-grid-pattern-light",
      ])}
    >
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
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <p className="mb-2">Email address</p>
                  <Input
                    value={credentials.email}
                    onChange={(event) => {
                      setIsLoginFailed(false);
                      setCredentials({
                        ...credentials,
                        email: event.target.value,
                      });
                    }}
                    className={cn([
                      isLoginFailed && "border-red-500 text-red-500",
                    ])}
                    tabIndex={1}
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
                    onChange={(event) => {
                      setIsLoginFailed(false);
                      setCredentials({
                        ...credentials,
                        password: event.target.value,
                      });
                    }}
                    tabIndex={2}
                    className={cn([
                      isLoginFailed && "border-red-500 text-red-500",
                    ])}
                  />
                </div>
              </div>
              {isLoginFailed && (
                <p className="text-red-500">
                  Incorrect email address or password, please try again
                </p>
              )}

              <Button className="w-full mt-6" onClick={handleSubmit}>
                SIGN IN
              </Button>
            </form>
          </div>
        </div>
        <div className="hidden md:block w-1/2 p-4 bg-background">
          <div className="w-full h-[420px]">
            <img
              src={StatBanner}
              alt="Sign up"
              className={cn([
                "w-full h-full object-cover",
                lightOrDark === "light" && "hidden",
              ])}
            />
            <img
              src={StatBannerLight}
              alt="Sign up"
              className={cn([
                "w-full h-full object-cover",
                lightOrDark === "dark" && "hidden",
              ])}
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
