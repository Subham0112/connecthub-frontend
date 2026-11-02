import api from "../lib/axiosInstance";
import { createContext, useEffect, useState } from "react";
import {registerLogout} from "../lib/axiosInstance";

interface UsersData {
  id: number;
  email: string;
  role: "user" | null;
  user_name: string;
  profile_url: string | null;
}

interface UserContextData {
  user: UsersData;
  setUser: React.Dispatch<React.SetStateAction<UsersData>>;
  loading: boolean;
  refreshUser: () => Promise<void>;
  sessionExpire: () => void;
}

export const UserDataContext = createContext<UserContextData | null>(null);

const emptyUser: UsersData = {
  id: 0,
  email: "",
  role: null,
  user_name: "",
  profile_url: null,
};

const UserContext = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UsersData>(emptyUser);
  const [loading, setLoading] = useState(true);

  const fetchFromProfile = async () => {
    const res = await api.get("/profile");
    setUser(res.data.user);
  };

  const refreshUser = async () => {
    await fetchFromProfile();
  };

  const sessionExpire = () => {
    setUser(emptyUser);
  };

  useEffect(() => {

    registerLogout(()=>{
      sessionExpire();
    });
    const fetchUser = async () => {
      try {
        await fetchFromProfile();
      } catch {
        sessionExpire();
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return (
    <UserDataContext.Provider
      value={{
        user,
        setUser,
        loading,
        refreshUser,
        sessionExpire,
      }}
    >
      {children}
    </UserDataContext.Provider>
  );
};

export default UserContext;