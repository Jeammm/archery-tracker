import { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { RegisterData } from "@/types/auth";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

export const SignUp = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
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

  return (
    <div>
      <p>Sign Up</p>
      <div>
        <p className="space-y-1.5 text-bold">Email</p>
        <Input
          value={userData.email}
          onChange={(event) =>
            setUserData({ ...userData, email: event.target.value })
          }
        />
      </div>
      <div>
        <p className="space-y-1.5 text-bold">Name</p>
        <Input
          value={userData.name}
          onChange={(event) =>
            setUserData({ ...userData, name: event.target.value })
          }
        />
      </div>
      <div>
        <p className="space-y-1.5 text-bold">Password</p>
        <Input
          type="password"
          value={userData.password}
          onChange={(event) =>
            setUserData({ ...userData, password: event.target.value })
          }
        />
      </div>
      <div>
        <p className="space-y-1.5 text-bold">Confirm Password</p>
        <Input
          type="password"
          value={userData.confirmPassword}
          onChange={(event) =>
            setUserData({ ...userData, confirmPassword: event.target.value })
          }
        />
      </div>

      <Button onClick={onClickSignUp}>Sign Up</Button>
    </div>
  );
};
