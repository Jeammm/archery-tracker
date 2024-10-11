import { BASE_BACKEND_URL } from "@/services/baseUrl";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Loader } from "../../components/ui/loader";

export const VerifyEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [isVerifySuccess, setIsVerifySuccess] = useState<boolean>(false);

  useEffect(() => {
    const verifyRegisterToken = async () => {
      if (!token) {
        return;
      }

      const response = await fetch(
        `${BASE_BACKEND_URL}/verify-email?token=${token}`
      );

      if (response.ok) {
        setIsVerified(true);
        setIsVerifySuccess(true);
        setTimeout(() => {
          navigate("/dashboard");
        }, 300);
      } else {
        setIsVerified(true);
        setIsVerifySuccess(false);
      }
    };

    verifyRegisterToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div>
      <p>Verify Email</p>
      {isVerified && isVerifySuccess && (
        <>
          <p className="text-green-600 text-sm">
            Verify Successfull, redirecting in 3 seconds
          </p>
          <Button onClick={() => navigate("/dashboard")} variant="outline">
            Go to Dashboard
          </Button>
        </>
      )}
      {isVerified && !isVerifySuccess && (
        <Button onClick={() => navigate(0)} variant="outline">
          Try Again
        </Button>
      )}
      {!isVerified && (
        <Button disabled variant="outline">
          <Loader />
        </Button>
      )}
    </div>
  );
};
