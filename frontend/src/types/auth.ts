export interface User {
  id: string;
  name: string;
  email: string;
  token: string;
  is_verified: boolean;
}

export interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  login: (credentials: Credentials) => Promise<boolean>;
  logout: () => void;
  signup: (registerData: RegisterData) => Promise<boolean>;
  doNotShowTutorialModal: boolean;
  onClickDoNotShowTutorialModal: (doNotShow: boolean) => void;
  refreshUserToken: (oldToken: string) => void;
}

export interface Credentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  name: string;
  password: string;
  confirmPassword: string;
}

export const initialRegisterData = {
  email: "",
  name: "",
  password: "",
  confirmPassword: "",
};
