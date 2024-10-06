import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BASE_BACKEND_URL } from "@/services/baseUrl";
import axios from "axios";
import { useState } from "react";

export const PasswordForgot = () => {
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

  return (
    <div>
      <h1 className="text-4xl font-bold">Forgot Password</h1>
      <div className="mt-6 border rounded-lg p-8 flex flex-col gap-4">
        <div>
          <p className="font-semibold">Email</p>
          <Input
            value={userEmail}
            onChange={(event) => setUserEmail(event.target.value)}
          />
        </div>

        <Button onClick={onClickResetPassword}>Reset Password</Button>
      </div>
    </div>
  );
};
