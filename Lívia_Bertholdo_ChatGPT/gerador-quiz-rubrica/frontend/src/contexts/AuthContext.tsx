import {
  createContext,
  useContext,
  useState,
} from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextData {
  user: User | null;

  signIn: (
    email: string,
    password: string
  ) => Promise<void>;

  signOut: () => void;
}

const AuthContext =
  createContext(
    {} as AuthContextData
  );

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] =
    useState<User | null>(
      null
    );

  async function signIn(
    email: string,
    password: string
  ) {
    console.log(
      "login será implementado"
    );
  }

  function signOut() {
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(
    AuthContext
  );
}