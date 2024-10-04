export interface User {
  id: string;
  username: string;
  token: string;
}

export interface AuthContextType {
  user: User | null;
  login: (credentials: Credentials) => Promise<boolean>;
  logout: () => void;
}

export interface Credentials {
  email: string;
  password: string;
}
