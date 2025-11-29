"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
// import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import TopNavbar from "../components/TopNavbar";
// import { USER_ROLE } from "@/constants";
import { toast, useSonner } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { USER_ROLE } from "../types/constants";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { signIn} = useAuth();
  const router = useRouter();
  

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {

      const user = await signIn(); 

      toast(  "Welcome!",{ description: "You signed in with Google." });

        router.push("/")
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNavbar />
      <div className="flex justify-center items-center py-6 sm:py-10 px-4">
        <Card className="w-full max-w-lg shadow-xl border">
          <CardHeader className="pb-4 text-left">
            <CardTitle className="text-2xl font-semibold">Welcome</CardTitle>
            <CardDescription>Sign in using Google</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full h-12 gap-3 rounded-md bg-[#060606] hover:bg-primary/90 text-primary-foreground"
            >
              <img src="/google-logo.svg" alt="Google" className="h-6 w-6" />
              {loading ? "Signing in..." : "Continue with Google"}
            </Button>
          </CardContent>

          <CardFooter className="border-t bg-card text-xs text-muted-foreground py-2 text-center">
            Protected by reCAPTCHA and Google Policies
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
