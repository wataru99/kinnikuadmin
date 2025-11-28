"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

interface AdminUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: string;
}

interface AuthContextType {
  user: AdminUser | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Firestoreからユーザー情報を取得してroleを確認
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const role = userData.role || "user";

            if (role === "admin") {
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: userData.displayName || firebaseUser.displayName,
                role: role,
              });
              setError(null);
            } else {
              // adminロールでない場合はサインアウト
              await firebaseSignOut(auth);
              setUser(null);
              setError("管理者権限がありません");
            }
          } else {
            // ユーザードキュメントがない場合
            await firebaseSignOut(auth);
            setUser(null);
            setError("ユーザー情報が見つかりません");
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
          await firebaseSignOut(auth);
          setUser(null);
          setError("ユーザー情報の取得に失敗しました");
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = credential.user;

      // Firestoreからユーザー情報を取得
      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));

      if (!userDoc.exists()) {
        await firebaseSignOut(auth);
        setError("ユーザー情報が見つかりません");
        setLoading(false);
        return false;
      }

      const userData = userDoc.data();
      const role = userData.role || "user";

      if (role !== "admin") {
        await firebaseSignOut(auth);
        setError("管理者権限がありません");
        setLoading(false);
        return false;
      }

      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: userData.displayName || firebaseUser.displayName,
        role: role,
      });

      setLoading(false);
      return true;
    } catch (err: any) {
      console.error("Sign in error:", err);

      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError("メールアドレスまたはパスワードが正しくありません");
      } else if (err.code === "auth/invalid-email") {
        setError("無効なメールアドレスです");
      } else if (err.code === "auth/too-many-requests") {
        setError("ログイン試行回数が多すぎます。しばらく待ってから再試行してください");
      } else {
        setError("ログインに失敗しました");
      }

      setLoading(false);
      return false;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setError(null);
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
