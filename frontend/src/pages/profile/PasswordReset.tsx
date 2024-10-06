import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import { useAuth } from "@/context/AuthContext";
import { BASE_BACKEND_URL } from "@/services/baseUrl";
import axios from "axios";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

interface PasswordResetProps {
  isOldPasswordForgot?: boolean;
}

export const PasswordReset = (props: PasswordResetProps) => {
  const { user } = useAuth();
  const { isOldPasswordForgot } = props;
  const [searchParams] = useSearchParams();

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
    <div>
      <h1 className="text-4xl font-bold">Reset Password</h1>

      <div className="mt-6 border rounded-lg p-8 flex flex-col gap-4">
        {!isOldPasswordForgot && (
          <div>
            <p className="font-semibold">Old Password</p>
            <Input
              value={oldPassword}
              onChange={(event) => setOldPassword(event.target.value)}
            />
          </div>
        )}

        <div>
          <p className="font-semibold">New Password</p>
          <Input
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
        </div>
        <div>
          <p className="font-semibold">Confirm New Password</p>
          <Input
            value={confirmNewPassword}
            onChange={(event) => setConfirmNewPassword(event.target.value)}
          />
        </div>

        <Button
          onClick={onClickConfirm}
          disabled={isPasswordNotMatch || isMissingData}
        >
          {isLoading ? (
            <Loader>
              <></>
            </Loader>
          ) : (
            "Confirm"
          )}
        </Button>
      </div>
    </div>
  );
};
