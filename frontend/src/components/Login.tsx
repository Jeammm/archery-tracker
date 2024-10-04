import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Credentials } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Login = () => {
  const [credentials, setCredentials] = useState<Credentials>({
    email: "",
    password: "",
  });
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async () => {
    const success = await login(credentials);
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
    if (user) {
      const origin =
        (location.state as { from: { pathname: string } })?.from?.pathname ||
        "/dashboard";
      navigate(origin);
    }
  }, [location.state, navigate, user]);

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
            <a
              href="mailto:archery_tracker@dev.com"
              className="text-sm text-muted-foreground"
            >
              Forgot your password?
            </a>
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
            <Button variant="secondary">SIGN UP</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
