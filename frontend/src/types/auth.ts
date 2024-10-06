export interface User {
  id: string;
  name: string;
  email: string;
  token: string;
}

export interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  login: (credentials: Credentials) => Promise<boolean>;
  logout: () => void;
}

export interface Credentials {
  email: string;
  password: string;
}
