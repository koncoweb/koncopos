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
    console.log("AuthContext: useEffect for loading auth state triggered");
    const loadAuthState = async () => {
      console.log("AuthContext: loadAuthState function called");
      try {
        console.log("AuthContext: Setting isLoading to true for initial load");
        setIsLoading(true);

        // Try to get saved auth state from local storage
        console.log("AuthContext: Retrieving saved auth state from storage");
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
        console.log("AuthContext: Retrieved saved auth state", savedAuthState);

        // Check if Firebase is initialized and has a current user
        if (firebaseService.isInitialized()) {
          console.log(
            "AuthContext: Firebase is initialized, checking for current user",
          );
          const currentUser = firebaseService.getCurrentUser();
          console.log(
            "AuthContext: Firebase current user",
            currentUser
              ? { uid: currentUser.uid, email: currentUser.email }
              : "null",
          );

          if (currentUser) {
            console.log(
              "AuthContext: Firebase has current user, using Firebase user",
            );
            // If Firebase has a current user, use that
            console.log("AuthContext: Getting user role for Firebase user");
            const userRole = currentUser.uid
              ? await firebaseService.getUserRole(currentUser.uid)
              : null;
            console.log("AuthContext: User role retrieved", { userRole });

            const firebaseUser = {
              uid: currentUser.uid,
              email: currentUser.email || undefined,
              displayName: currentUser.displayName || savedAuthState.userName,
              photoURL: currentUser.photoURL || undefined,
              isAuthenticated: true,
              role: userRole || undefined,
            };
            console.log(
              "AuthContext: Setting user from Firebase",
              firebaseUser,
            );
            setUser(firebaseUser);
            console.log("AuthContext: User set from Firebase successfully");
          } else if (savedAuthState.isAuthenticated) {
            console.log(
              "AuthContext: No Firebase user but saved auth state exists, using saved state",
            );
            // If no Firebase user but we have saved auth state, use that
            const savedUser = {
              uid: savedAuthState.userId,
              email: savedAuthState.email,
              displayName: savedAuthState.userName,
              photoURL: savedAuthState.photoURL,
              isAuthenticated: true,
            };
            console.log(
              "AuthContext: Setting user from saved state",
              savedUser,
            );
            setUser(savedUser);
            console.log("AuthContext: User set from saved state successfully");
          } else {
            console.log(
              "AuthContext: No Firebase user and no saved auth state, setting user to null",
            );
            setUser(null);
          }
        } else if (savedAuthState.isAuthenticated) {
          console.log(
            "AuthContext: Firebase not initialized but saved auth state exists",
          );
          // If Firebase not initialized but we have saved auth state
          const localUser = {
            displayName: savedAuthState.userName,
            isAuthenticated: true,
          };
          console.log(
            "AuthContext: Setting user from local auth state",
            localUser,
          );
          setUser(localUser);
          console.log(
            "AuthContext: User set from local auth state successfully",
          );
        } else {
          console.log(
            "AuthContext: No Firebase and no saved auth state, setting user to null",
          );
          setUser(null);
        }
      } catch (error) {
        console.error("AuthContext: Error loading auth state:", error);
        console.log("AuthContext: Setting user to null due to error");
        setUser(null);
      } finally {
        console.log(
          "AuthContext: Setting isLoading to false after initial load",
        );
        setIsLoading(false);
        console.log("AuthContext: Initial auth state load completed", {
          user: user ? "authenticated" : "null",
          isLoading: false,
        });
      }
    };

    console.log("AuthContext: Calling loadAuthState");
    loadAuthState();
    console.log("AuthContext: loadAuthState called");
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    console.log("Login function called in AuthContext", { email });
    try {
      setIsLoading(true);
      console.log("AuthContext: Setting isLoading to true");

      // Check if it's the demo account
      if (email === "demo" && password === "password") {
        console.log("AuthContext: Demo login successful");
        const demoUser = {
          displayName: "Demo User",
          isAuthenticated: true,
        };

        console.log("AuthContext: Storing demo user auth state");
        await storeData("auth_state", {
          isAuthenticated: true,
          userName: demoUser.displayName,
        });
        console.log("AuthContext: Demo user auth state stored successfully");

        console.log("AuthContext: Setting demo user state");
        setUser(demoUser);
        console.log("AuthContext: Demo user state set", demoUser);
        return;
      }

      // Check if Firebase is initialized
      if (firebaseService.isInitialized()) {
        console.log("AuthContext: Firebase initialized, attempting login");
        // Try to sign in with Firebase
        const isEmail = email.includes("@");
        let userCredential;

        console.log("AuthContext: Login attempt with", { isEmail });
        if (isEmail) {
          console.log("AuthContext: Attempting email login");
          userCredential = await firebaseService.signIn(email, password);
          console.log("AuthContext: Email login successful");
        } else {
          try {
            console.log("AuthContext: Attempting direct username login");
            // First try with the username directly (for existing accounts)
            userCredential = await firebaseService.signIn(email, password);
            console.log("AuthContext: Direct username login successful");
          } catch (directLoginError) {
            console.log(
              "Direct login failed in AuthContext, trying with email format",
              directLoginError,
            );
            // If direct login fails, try with email format
            console.log("AuthContext: Attempting login with email format", {
              emailFormat: email + "@example.com",
            });
            userCredential = await firebaseService.signIn(
              email + "@example.com",
              password,
            );
            console.log("AuthContext: Login with email format successful");
          }
        }

        const firebaseUser = userCredential.user;
        console.log("AuthContext: Firebase login successful", {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
        });

        // Get user role from Firestore
        console.log("AuthContext: Getting user role from Firestore");
        const userRole = await firebaseService.getUserRole(firebaseUser.uid);
        console.log("AuthContext: User role retrieved", { userRole });

        const authUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || undefined,
          displayName: firebaseUser.displayName || email.split("@")[0],
          photoURL: firebaseUser.photoURL || undefined,
          isAuthenticated: true,
          role: userRole || undefined,
        };
        console.log("AuthContext: Created auth user object", authUser);

        console.log("AuthContext: Storing auth state in AsyncStorage");
        await storeData("auth_state", {
          isAuthenticated: true,
          userName: authUser.displayName || "",
          userId: authUser.uid,
          email: authUser.email,
          photoURL: authUser.photoURL,
        });
        console.log("AuthContext: Auth state stored successfully");

        console.log("AuthContext: Setting user state", authUser);
        // Use a callback to ensure we have the latest state
        setUser((prevUser) => {
          console.log("AuthContext: Setting user with callback", {
            prevUser,
            newUser: authUser,
          });
          return authUser;
        });
        console.log("AuthContext: User state set successfully");
      } else {
        // Fall back to local authentication
        console.log(
          "AuthContext: Firebase not initialized, falling back to local authentication",
        );
        const accounts = await getData<Record<string, string>>(
          "user_accounts",
          {},
        );
        console.log("AuthContext: Retrieved user accounts from storage", {
          accountsFound: Object.keys(accounts).length,
        });

        if (accounts[email] === password) {
          console.log("AuthContext: Local authentication successful for user", {
            username: email,
          });
          const localUser = {
            displayName: email,
            isAuthenticated: true,
          };
          console.log("AuthContext: Created local user object", localUser);

          console.log("AuthContext: Storing local auth state");
          await storeData("auth_state", {
            isAuthenticated: true,
            userName: localUser.displayName,
          });
          console.log("AuthContext: Local auth state stored successfully");

          console.log("AuthContext: Setting local user state", localUser);
          // Use a callback to ensure we have the latest state
          setUser((prevUser) => {
            console.log("AuthContext: Setting user with callback", {
              prevUser,
              newUser: localUser,
            });
            return localUser;
          });
          console.log("AuthContext: Local user state set successfully");
        } else {
          console.log("AuthContext: Local authentication failed for user", {
            username: email,
          });
          throw new Error("Invalid username or password");
        }
      }
    } catch (error) {
      console.error("AuthContext: Login error:", error);
      throw error;
    } finally {
      console.log("AuthContext: Setting isLoading to false");
      setIsLoading(false);
      console.log("AuthContext: Current user state after login attempt", {
        user: user ? "authenticated" : "null",
        isLoading: false,
      });
    }
  };

  // Logout function
  const logout = async () => {
    console.log("AuthContext: Logout function called");
    try {
      console.log("AuthContext: Setting isLoading to true for logout");
      setIsLoading(true);

      // Sign out from Firebase if initialized
      if (firebaseService.isInitialized()) {
        console.log("AuthContext: Firebase initialized, signing out");
        await firebaseService.logOut();
        console.log("AuthContext: Firebase sign out successful");
      } else {
        console.log(
          "AuthContext: Firebase not initialized, skipping Firebase logout",
        );
      }

      // Clear local auth state
      console.log("AuthContext: Clearing local auth state");
      await storeData("auth_state", {
        isAuthenticated: false,
        userName: "",
      });
      console.log("AuthContext: Local auth state cleared successfully");

      console.log("AuthContext: Setting user to null");
      setUser(null);
      console.log("AuthContext: User set to null successfully");

      // Navigate to login screen
      console.log("AuthContext: Navigating to login screen");
      router.replace("/login");
    } catch (error) {
      console.error("AuthContext: Logout error:", error);
    } finally {
      console.log("AuthContext: Setting isLoading to false after logout");
      setIsLoading(false);
      console.log("AuthContext: Logout process completed");
    }
  };

  // Update user profile
  const updateUserProfile = async (data: Partial<AuthUser>) => {
    console.log("AuthContext: updateUserProfile called with data", data);
    try {
      if (!user) {
        console.log("AuthContext: No user found, cannot update profile");
        return;
      }

      console.log("AuthContext: Creating updated user object");
      const updatedUser = { ...user, ...data };
      console.log("AuthContext: Updated user object created", updatedUser);

      // Update in Firebase if initialized and we have a uid
      if (firebaseService.isInitialized() && user.uid) {
        console.log(
          "AuthContext: Firebase initialized and user has UID, would update profile in Firebase",
        );
        // This would need to be implemented in firebaseService
        // await firebaseService.updateUserProfile(data);
      } else {
        console.log("AuthContext: Skipping Firebase profile update", {
          firebaseInitialized: firebaseService.isInitialized(),
          hasUid: !!user.uid,
        });
      }

      // Update local storage
      console.log("AuthContext: Updating auth state in storage");
      await storeData("auth_state", {
        isAuthenticated: true,
        userName: updatedUser.displayName || "",
        userId: updatedUser.uid,
        email: updatedUser.email,
        photoURL: updatedUser.photoURL,
      });
      console.log("AuthContext: Auth state updated in storage successfully");

      console.log("AuthContext: Setting updated user state");
      setUser(updatedUser);
      console.log("AuthContext: User state updated successfully");
    } catch (error) {
      console.error("AuthContext: Error updating user profile:", error);
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
