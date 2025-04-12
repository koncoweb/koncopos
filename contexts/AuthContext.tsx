import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import firebaseService from "../services/firebaseService";
import { getData, storeData } from "../services/storage";

interface AuthUser {
  uid?: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  isAuthenticated: boolean;
  role?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<AuthUser>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  updateUserProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check for existing auth state on mount
  useEffect(() => {
    const loadAuthState = async () => {
      try {
        setIsLoading(true);

        // Try to get saved auth state from local storage
        const savedAuthState = await getData<{
          isAuthenticated: boolean;
          userName: string;
          userId?: string;
          email?: string;
          photoURL?: string;
        }>("auth_state", {
          isAuthenticated: false,
          userName: "",
        });

        // Check if Firebase is initialized and has a current user
        if (firebaseService.isInitialized()) {
          const currentUser = firebaseService.getCurrentUser();

          if (currentUser) {
            // If Firebase has a current user, use that
            const userRole = currentUser.uid
              ? await firebaseService.getUserRole(currentUser.uid)
              : null;

            setUser({
              uid: currentUser.uid,
              email: currentUser.email || undefined,
              displayName: currentUser.displayName || savedAuthState.userName,
              photoURL: currentUser.photoURL || undefined,
              isAuthenticated: true,
              role: userRole || undefined,
            });
          } else if (savedAuthState.isAuthenticated) {
            // If no Firebase user but we have saved auth state, use that
            setUser({
              uid: savedAuthState.userId,
              email: savedAuthState.email,
              displayName: savedAuthState.userName,
              photoURL: savedAuthState.photoURL,
              isAuthenticated: true,
            });
          } else {
            setUser(null);
          }
        } else if (savedAuthState.isAuthenticated) {
          // If Firebase not initialized but we have saved auth state
          setUser({
            displayName: savedAuthState.userName,
            isAuthenticated: true,
          });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error loading auth state:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadAuthState();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);

      // Check if it's the demo account
      if (email === "demo" && password === "password") {
        const demoUser = {
          displayName: "Demo User",
          isAuthenticated: true,
        };

        await storeData("auth_state", {
          isAuthenticated: true,
          userName: demoUser.displayName,
        });

        setUser(demoUser);
        return;
      }

      // Check if Firebase is initialized
      if (firebaseService.isInitialized()) {
        // Try to sign in with Firebase
        const isEmail = email.includes("@");
        let userCredential;

        if (isEmail) {
          userCredential = await firebaseService.signIn(email, password);
        } else {
          try {
            // First try with the username directly (for existing accounts)
            userCredential = await firebaseService.signIn(email, password);
          } catch (directLoginError) {
            console.log(
              "Direct login failed in AuthContext, trying with email format",
            );
            // If direct login fails, try with email format
            userCredential = await firebaseService.signIn(
              email + "@example.com",
              password,
            );
          }
        }

        const firebaseUser = userCredential.user;

        // Get user role from Firestore
        const userRole = await firebaseService.getUserRole(firebaseUser.uid);

        const authUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || undefined,
          displayName: firebaseUser.displayName || email.split("@")[0],
          photoURL: firebaseUser.photoURL || undefined,
          isAuthenticated: true,
          role: userRole || undefined,
        };

        await storeData("auth_state", {
          isAuthenticated: true,
          userName: authUser.displayName || "",
          userId: authUser.uid,
          email: authUser.email,
          photoURL: authUser.photoURL,
        });

        setUser(authUser);
      } else {
        // Fall back to local authentication
        const accounts = await getData<Record<string, string>>(
          "user_accounts",
          {},
        );

        if (accounts[email] === password) {
          const localUser = {
            displayName: email,
            isAuthenticated: true,
          };

          await storeData("auth_state", {
            isAuthenticated: true,
            userName: localUser.displayName,
          });

          setUser(localUser);
        } else {
          throw new Error("Invalid username or password");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setIsLoading(true);

      // Sign out from Firebase if initialized
      if (firebaseService.isInitialized()) {
        await firebaseService.logOut();
      }

      // Clear local auth state
      await storeData("auth_state", {
        isAuthenticated: false,
        userName: "",
      });

      setUser(null);

      // Navigate to login screen
      router.replace("/login");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update user profile
  const updateUserProfile = async (data: Partial<AuthUser>) => {
    try {
      if (!user) return;

      const updatedUser = { ...user, ...data };

      // Update in Firebase if initialized and we have a uid
      if (firebaseService.isInitialized() && user.uid) {
        // This would need to be implemented in firebaseService
        // await firebaseService.updateUserProfile(data);
      }

      // Update local storage
      await storeData("auth_state", {
        isAuthenticated: true,
        userName: updatedUser.displayName || "",
        userId: updatedUser.uid,
        email: updatedUser.email,
        photoURL: updatedUser.photoURL,
      });

      setUser(updatedUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
