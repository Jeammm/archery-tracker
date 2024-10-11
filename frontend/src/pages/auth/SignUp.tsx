import { useEffect, useState } from "react";
import { Input } from "../../components/ui/input";
import { Button, buttonVariants } from "../../components/ui/button";
import { RegisterData } from "@/types/auth";
import { useAuth } from "@/context/AuthContext";
import { Link, useLocation, useNavigate } from "react-router-dom";

export const SignUp = () => {
  const { user, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [userData, setUserData] = useState<RegisterData>({
    email: "",
    name: "",
    password: "",
    confirmPassword: "",
  });

  const onClickSignUp = async () => {
    if (userData.password !== userData.confirmPassword) {
      return alert("Password do not match!");
    }

    const success = await signup(userData);
    if (success) {
      alert(
        "Sign up successfull, Please check your email for confirmation link."
      );
      navigate("/login");
    } else {
      alert("Sign up failed");
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
        <div className="flex items-center justify-center w-1/2 bg-white">
          <div className="text-center">
            <h2 className="mb-4 text-3xl font-bold text-primary-foreground">
              Already have and account?
            </h2>
            <p className="mb-6 text-primary-foreground">
              Login with your registered email and password
            </p>
            <Link
              to="/login"
              className={buttonVariants({ variant: "secondary" })}
            >
              LOGIN
            </Link>
          </div>
        </div>
        <div className="w-1/2 p-8 border-y border-l rounded-l-lg">
          <h2 className="mb-6 text-3xl font-bold text-center">Sign up</h2>
          <p className="text-center text-muted-foreground mb-6">
            with your email password
          </p>
          <div className="space-y-4">
            <Input
              placeholder="Email"
              value={userData.email}
              onChange={(event) =>
                setUserData({ ...userData, email: event.target.value })
              }
            />
            <Input
              placeholder="Name"
              value={userData.name}
              onChange={(event) =>
                setUserData({ ...userData, name: event.target.value })
              }
            />
            <Input
              type="password"
              placeholder="Password"
              value={userData.password}
              onChange={(event) =>
                setUserData({
                  ...userData,
                  password: event.target.value,
                })
              }
            />
            <Input
              type="password"
              placeholder="Re-enter Password"
              value={userData.confirmPassword}
              onChange={(event) =>
                setUserData({
                  ...userData,
                  confirmPassword: event.target.value,
                })
              }
            />
          </div>
          <Button className="w-full mt-6" onClick={onClickSignUp}>
            SIGN UP
          </Button>
        </div>
      </div>
    </div>
  );
};
