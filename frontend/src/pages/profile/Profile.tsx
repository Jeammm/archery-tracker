import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { BASE_BACKEND_URL } from "@/services/baseUrl";
import axios from "axios";
import { AlertTriangle, Verified } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

export const Profile = () => {
  const { user, setUser } = useAuth();

  const [userData, setUserData] = useState<{ name: string; email: string }>({
    name: user?.name || "",
    email: user?.email || "",
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const onClickSave = async () => {
    if (!user) {
      return;
    }

    try {
      setIsLoading(true);
      await axios.patch(`${BASE_BACKEND_URL}/profile/${user?.id}`, userData, {
        headers: {
          Authorization: `Bearer ${user?.token || ""}`,
        },
      });
      setUser({ ...user, ...userData });
      alert("Save Changes Successfully!");
    } catch (error) {
      alert("Save Failed!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-4xl font-bold">Profile</h1>
      <p className="mt-2 text-muted-foreground">Manage you profile here</p>
      <div className="mt-6 border rounded-lg p-6 flex flex-col">
        <div className="flex gap-4 md:flex-row flex-col-reverse">
          <div className="flex flex-col gap-6 flex-1">
            <div className="flex flex-col gap-1.5">
              <p className="font-bold">Name</p>
              <Input
                value={userData.name}
                onChange={(event) =>
                  setUserData((prev) => ({ ...prev, name: event.target.value }))
                }
              />
              <p className="text-muted-foreground text-xs leading-none">
                This will be displayed as your profile name
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <p className="font-bold">Email</p>
              <div className="flex gap-2">
                <Input
                  value={userData.email}
                  onChange={(event) =>
                    setUserData((prev) => ({
                      ...prev,
                      email: event.target.value,
                    }))
                  }
                  readOnly
                />
                <div
                  className={cn([
                    "flex gap-2 w-fit justify-center border-2 font-semibold rounded-md h-full px-4 items-center",
                    user?.isVerified
                      ? "bg-[#42A5F5]/30 border-[#42A5F5] text-[#42A5F5]"
                      : "bg-amber-100 border-amber-500 text-amber-500",
                  ])}
                >
                  {user?.isVerified ? (
                    <>
                      <Verified className="text-[#42A5F5]" strokeWidth={2.5} />
                      <p>Verified</p>
                    </>
                  ) : (
                    <>
                      <AlertTriangle
                        className="text-amber-500"
                        strokeWidth={2.5}
                      />
                      <p className="whitespace-nowrap">Not Verify</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <p className="font-bold">Password</p>
              <Link
                to="/password-reset"
                className={buttonVariants({
                  variant: "secondary",
                  className: "w-fit",
                })}
              >
                Reset Password
              </Link>
            </div>
          </div>
          <div className="w-[150px] self-center md:self-start">
            <div className="rounded-full border bg-primary aspect-square w-full flex justify-center items-center">
              <p className="text-primary-foreground text-5xl">
                {user?.name?.[0].toUpperCase() || "A"}
              </p>
            </div>
          </div>
        </div>
        <Button className="ml-auto mt-8" onClick={onClickSave}>
          {isLoading ? (
            <Loader>
              <></>
            </Loader>
          ) : (
            <p>Save Changes</p>
          )}
        </Button>
      </div>
    </div>
  );
};
