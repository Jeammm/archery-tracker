import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { BASE_BACKEND_URL } from "@/services/baseUrl";
import axios from "axios";
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

interface PasswordResetProps {
  isOldPasswordForgot?: boolean;
}

export const PasswordReset = (props: PasswordResetProps) => {
  const { user } = useAuth();
  const { isOldPasswordForgot } = props;
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [oldPassword, setOldPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const token = searchParams.get("token");

  const isPasswordNotMatch = useMemo(() => {
    if (
      newPassword &&
      confirmNewPassword &&
      newPassword != confirmNewPassword
    ) {
      return true;
    }
  }, [confirmNewPassword, newPassword]);

  const isMissingData = useMemo(() => {
    if (isOldPasswordForgot) {
      return !newPassword || !confirmNewPassword;
    }
    return !newPassword || !confirmNewPassword || !oldPassword;
  }, [confirmNewPassword, isOldPasswordForgot, newPassword, oldPassword]);

  const onClickConfirm = async () => {
    if (isOldPasswordForgot) {
      try {
        setIsLoading(true);
        await axios.post(
          `${BASE_BACKEND_URL}/setup-new-password`,
          { token: token, new_password: newPassword },
          {
            headers: {
              Authorization: `Bearer ${user?.token || ""}`,
            },
          }
        );
        alert("Reset Password Successfully!");
        navigate("/login");
      } catch (error) {
        alert("Reset Password Failed!");
      } finally {
        setIsLoading(false);
      }
    } else {
      try {
        setIsLoading(true);
        await axios.post(
          `${BASE_BACKEND_URL}/change-password`,
          { old_password: oldPassword, new_password: newPassword },
          {
            headers: {
              Authorization: `Bearer ${user?.token || ""}`,
            },
          }
        );
        alert("Reset Password Successfully!");
      } catch (error) {
        alert("Reset Password Failed!");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div
      className={cn([
        "flex items-center justify-center",
        isOldPasswordForgot && "min-h-screen bg-grid-pattern",
      ])}
    >
      <div className="flex w-full max-w-xl overflow-hidden bg-background rounded-lg shadow-lg">
        <div className="p-8 border rounded-lg w-full">
          <h2 className="mb-6 text-3xl font-bold text-center">
            Reset your password
          </h2>
          <p className="text-center text-muted-foreground mb-6">
            Setup your new password
          </p>
          <div className="space-y-4">
            {!isOldPasswordForgot && (
              <div>
                <p className="font-semibold">Old Password</p>
                <Input
                  value={oldPassword}
                  onChange={(event) => setOldPassword(event.target.value)}
                  type="password"
                  placeholder="Old Password"
                />
              </div>
            )}

            <div>
              <p className="font-semibold">New Password</p>
              <Input
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                type="password"
                placeholder="New Password"
              />
            </div>
            <div>
              <p className="font-semibold">Confirm New Password</p>
              <Input
                value={confirmNewPassword}
                onChange={(event) => setConfirmNewPassword(event.target.value)}
                type="password"
                placeholder="Confirm New Password"
              />
            </div>
          </div>
          <Button
            onClick={onClickConfirm}
            disabled={isPasswordNotMatch || isMissingData}
            className="w-full mt-6"
          >
            {isLoading ? (
              <Loader>
                <></>
              </Loader>
            ) : (
              "Reset Password"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
