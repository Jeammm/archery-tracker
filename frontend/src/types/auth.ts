export interface User {
  id: string;
  name: string;
  email: string;
  token: string;
  isVerified: boolean;
}

export interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  login: (credentials: Credentials) => Promise<boolean>;
  logout: () => void;
  signup: (registerData: RegisterData) => Promise<boolean>;
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
