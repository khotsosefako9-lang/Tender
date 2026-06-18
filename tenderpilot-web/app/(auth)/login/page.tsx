"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/landing/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password. Please try again.");
    } else {
      router.push(callbackUrl);
    }
  };

  return (
    <div className="min-h-screen bg-brand-off-white flex flex-col items-center justify-center px-4">
      <div className="mb-8"><Logo /></div>
      <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        <h1 className="text-2xl font-bold text-brand-navy mb-2">Welcome back</h1>
        <p className="text-gray-500 text-sm mb-6">Sign in to your Tenderpilot account</p>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" required />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" required />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{" "}
          <Link href="/onboard" className="text-brand-navy font-medium hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<div>Loading...</div>}><LoginForm /></Suspense>;
}
