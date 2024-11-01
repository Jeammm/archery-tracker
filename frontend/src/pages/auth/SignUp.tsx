import { useEffect, useState } from "react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { initialRegisterData, RegisterData } from "@/types/auth";
import { useAuth } from "@/context/AuthContext";
import { Link, useLocation, useNavigate } from "react-router-dom";

import StatBanner from "@/assets/stat_banner.png";
import StatBannerLight from "@/assets/stat_banner_light.png";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import { isValidEmail, isValidPassword } from "@/utils/auth";
import { Loader } from "@/components/ui/loader";

export const SignUp = () => {
  const { lightOrDark } = useTheme();
  const { user, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [userData, setUserData] = useState<RegisterData>(initialRegisterData);
  const [userDataError, setUserDataError] =
    useState<RegisterData>(initialRegisterData);

  const onClickSignUp = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    setUserDataError({
      email: userData.email ? "" : "This field is required",
      name: userData.name ? "" : "This field is required",
      password: userData.password ? "" : "This field is required",
      confirmPassword: userData.confirmPassword ? "" : "This field is required",
    });

    if (
      !userData.email ||
      !userData.name ||
      !userData.password ||
      !userData.confirmPassword
    ) {
      return;
    }

    if (!isValidEmail(userData.email)) {
      setUserDataError({
        ...userDataError,
        email: "Invalid email address",
      });
      return;
    }

    if (!isValidPassword(userData.password)) {
      setUserDataError({
        ...userDataError,
        password: "Password must be at least 8 characters",
      });
      return;
    }

    if (userData.password !== userData.confirmPassword) {
      setUserDataError({
        ...userDataError,
        confirmPassword: "Password do not match!",
      });
      return;
    }
    setIsLoading(true);
    const success = await signup(userData);
    if (success) {
      alert(
        "Sign up successfull, Please check your email for confirmation link."
      );
      navigate("/login");
    } else {
      alert("Sign up failed");
    }
    setIsLoading(false);
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
    <div
      className={cn([
        "flex items-center justify-center min-h-screen px-4 flex-col",
        lightOrDark === "dark" ? "bg-grid-pattern" : "bg-grid-pattern-light",
      ])}
    >
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
          <form onSubmit={onClickSignUp}>
            <div className="space-y-4">
              <div>
                <p className="mb-2">Email address</p>
                <Input
                  value={userData.email}
                  onChange={(event) => {
                    setUserDataError({ ...userDataError, email: "" });
                    setUserData({ ...userData, email: event.target.value });
                  }}
                  required
                  tabIndex={1}
                  className={
                    userDataError.email ? "text-red-500 border-red-500" : ""
                  }
                />
                {userDataError.email && (
                  <p className="text-red-500">{userDataError.email}</p>
                )}
              </div>
              <div>
                <p className="mb-2">Name</p>
                <Input
                  value={userData.name}
                  onChange={(event) => {
                    setUserDataError({ ...userDataError, name: "" });
                    setUserData({ ...userData, name: event.target.value });
                  }}
                  required
                  tabIndex={2}
                  className={
                    userDataError.name ? "text-red-500 border-red-500" : ""
                  }
                />
                {userDataError.name && (
                  <p className="text-red-500">{userDataError.name}</p>
                )}
              </div>
              <div>
                <p className="mb-2">Password</p>
                <Input
                  type="password"
                  value={userData.password}
                  onChange={(event) => {
                    setUserDataError({ ...userDataError, password: "" });
                    setUserData({
                      ...userData,
                      password: event.target.value,
                    });
                  }}
                  required
                  tabIndex={3}
                  className={
                    userDataError.password ? "text-red-500 border-red-500" : ""
                  }
                />
                {userDataError.password && (
                  <p className="text-red-500">{userDataError.password}</p>
                )}
              </div>
              <div>
                <p className="mb-2">Confirm Password</p>
                <Input
                  type="password"
                  value={userData.confirmPassword}
                  onChange={(event) => {
                    setUserDataError({ ...userDataError, confirmPassword: "" });
                    setUserData({
                      ...userData,
                      confirmPassword: event.target.value,
                    });
                  }}
                  tabIndex={4}
                  required
                  className={
                    userDataError.confirmPassword
                      ? "text-red-500 border-red-500"
                      : ""
                  }
                />
                {userDataError.confirmPassword && (
                  <p className="text-red-500">
                    {userDataError.confirmPassword}
                  </p>
                )}
              </div>
            </div>
            <Button
              className="w-full mt-6"
              onClick={onClickSignUp}
              disabled={isLoading}
            >
              {isLoading ? <Loader /> : "SIGN UP"}
            </Button>
          </form>
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
