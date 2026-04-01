"use client";

import { getFirebaseAuth } from "@/lib/firebase";
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { User } from "firebase/auth";
import { useLang } from "@/lib/lang";
import { t } from "@/lib/copy";

type Props = { user: User | null };

export default function AuthButton({ user }: Props) {
  const { lang } = useLang();
  const c = t(lang);

  const handleGoogleSignIn = () =>
    signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());

  if (user) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className="text-gray-400">{user.displayName ?? user.email}</span>
        <button
          onClick={() => signOut(getFirebaseAuth())}
          className="text-gray-500 hover:text-white transition-colors"
        >
          {c.signOut}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleGoogleSignIn}
      className="text-sm bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded transition-colors"
    >
      {c.signIn}
    </button>
  );
}
