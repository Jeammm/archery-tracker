import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import { User, AuthContextType, Credentials, RegisterData } from "@/types/auth";
import { BASE_BACKEND_URL } from "@/services/baseUrl";
import { toast } from "@/hooks/use-toast";
import { isNil } from "lodash";

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [doNotShowTutorialModal, setDoNotShowTutorialModal] =
    useState<boolean>(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    const storedDoNotShowTutorialModal = localStorage.getItem(
      "doNotShowTutorialModal"
    );
    if (storedDoNotShowTutorialModal) {
      const { doNotShow } = JSON.parse(storedDoNotShowTutorialModal);
      if (isNil(doNotShow)) {
        return;
      }
      setDoNotShowTutorialModal(doNotShow);
    }
  }, []);

  const onClickDoNotShowTutorialModal = async (doNotShow: boolean) => {
    setDoNotShowTutorialModal(doNotShow);
    localStorage.setItem(
      "doNotShowTutorialModal",
      JSON.stringify({ doNotShow })
    );
  };

  const login = async (credentials: Credentials): Promise<boolean> => {
    try {
      const response = await fetch(`${BASE_BACKEND_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (response.ok) {
        const userData: User = await response.json();
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        toast({
          title: `Welcome ${userData.name}!`,
          description: "Glad to have you here. Ready to dive in?",
          variant: "success",
        });
        return true;
      }
      return false;
    } catch (error) {
      toast({
        title: "Sign in Failed",
        description: `Error: ${error}`,
        variant: "destructive",
      });
      console.error("Login error:", error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("doNotShowTutorialModal");
  };

  const signup = async (registerData: RegisterData): Promise<boolean> => {
    try {
      const response = await fetch(`${BASE_BACKEND_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerData),
      });

      if (response.ok) {
        return true;
      }
      return false;
    } catch (error) {
      console.error("Sign up error:", error);
      return false;
    }
  };

  const refreshUserToken = async (oldToken: string) => {
    try {
      const response = await fetch(`${BASE_BACKEND_URL}/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: oldToken }),
      });

      if (response.ok) {
        const userData: User = await response.json();
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        setUser,
        signup,
        doNotShowTutorialModal,
        onClickDoNotShowTutorialModal,
        refreshUserToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
