import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { BASE_BACKEND_URL } from "@/services/baseUrl";
import axios from "axios";
import { useEffect, useState } from "react";

export const PasswordForgot = () => {
  const { user } = useAuth();
  const { lightOrDark } = useTheme();
  const [userEmail, setUserEmail] = useState<string>("");

  const onClickResetPassword = async () => {
    try {
      await axios.post(`${BASE_BACKEND_URL}/request-reset-password`, {
        email: userEmail,
      });
      alert("Email for password reset sent!");
    } catch (error) {
      alert("Password Reset Request Failed!");
    }
  };

  useEffect(() => {
    setUserEmail(user?.email || "");
  }, [user]);

  return (
    <div
      className={cn([
        "flex items-center justify-center min-h-screen",
        lightOrDark === "dark" ? "bg-grid-pattern" : "bg-grid-pattern-light",
      ])}
    >
      <div className="flex w-full max-w-lg overflow-hidden bg-background rounded-lg shadow-lg">
        <div className="p-8 border rounded-lg">
          <h2 className="mb-6 text-3xl font-bold text-center">
            Reset your password
          </h2>
          <p className="text-center text-muted-foreground mb-6">
            Enter your user account's verified email address and we will send
            you a password reset link.
          </p>
          <div className="space-y-4">
            <Input
              placeholder="Email"
              value={userEmail}
              onChange={(event) => setUserEmail(event.target.value)}
            />
          </div>
          <Button className="w-full mt-6" onClick={onClickResetPassword}>
            Reset Password
          </Button>
        </div>
      </div>
    </div>
  );
};
