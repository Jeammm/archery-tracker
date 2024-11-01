import { useEffect, useState } from "react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { RegisterData } from "@/types/auth";
import { useAuth } from "@/context/AuthContext";
import { Link, useLocation, useNavigate } from "react-router-dom";

import StatBanner from "@/assets/stat_banner.png";
import StatBannerLight from "@/assets/stat_banner_light.png";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";

export const SignUp = () => {
  const { lightOrDark } = useTheme();
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
    <div className="flex items-center justify-center min-h-screen bg-grid-pattern px-4 flex-col">
      <Link to="/">
        <h3 className="font-bold text-4xl mb-2">Archery Tracker</h3>
      </Link>
      <h2 className="mb-8 text-lg text-center font-light">
        Create new account with your email address
      </h2>
      <div className="flex w-full max-w-[80%] md:max-w-4xl overflow-hidden bg-background rounded-lg drop-shadow-lg">
        <div className="hidden md:block w-1/2 p-4 ">
          <div className="w-full h-full">
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
        <div className="w-full md:w-1/2 p-8 border rounded-lg md:rounded-l-none flex flex-col justify-center">
          <div className="space-y-4">
            <div>
              <p className="mb-2">Email address</p>
              <Input
                value={userData.email}
                onChange={(event) =>
                  setUserData({ ...userData, email: event.target.value })
                }
                required
              />
            </div>
            <div>
              <p className="mb-2">Name</p>
              <Input
                value={userData.name}
                onChange={(event) =>
                  setUserData({ ...userData, name: event.target.value })
                }
                required
              />
            </div>
            <div>
              <p className="mb-2">Password</p>
              <Input
                type="password"
                value={userData.password}
                onChange={(event) =>
                  setUserData({
                    ...userData,
                    password: event.target.value,
                  })
                }
                required
              />
            </div>
            <div>
              <p className="mb-2">Confirm Password</p>
              <Input
                type="password"
                value={userData.confirmPassword}
                onChange={(event) =>
                  setUserData({
                    ...userData,
                    confirmPassword: event.target.value,
                  })
                }
                required
              />
            </div>
          </div>
          <Button className="w-full mt-6" onClick={onClickSignUp}>
            SIGN UP
          </Button>
        </div>
      </div>
      <div className="w-full max-w-[80%] md:max-w-4xl bg-background flex border rounded-lg p-4 justify-center gap-1.5 mt-4">
        <p>Already have an account?</p>
        <Link to="/login" className="text-[#4493f8]">
          SIGN IN
        </Link>
      </div>
    </div>
  );
};
