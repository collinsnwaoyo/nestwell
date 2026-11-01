"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hasSeenWelcome, markWelcomeSeen } from "@/lib/welcome";

export default function WelcomePage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (hasSeenWelcome()) {
      router.replace("/home");
      return;
    }
    setChecked(true);
  }, [router]);

  function handleContinue() {
    markWelcomeSeen();
    router.push("/home");
  }

  if (!checked) return null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-3xl bg-primary text-primary-foreground">
        <Building2 className="size-7" />
      </div>

      <div className="flex flex-col items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Nestwell</h1>
        <p className="max-w-sm text-balance text-muted-foreground">
          Hi there. I use Nestwell to run my own rental properties in Lagos.
          I&apos;ve opened up a demo copy so you can look around. Everything
          works, and the data resets every night.
        </p>
      </div>

      <Button size="lg" className="rounded-full px-8" onClick={handleContinue}>
        Continue
      </Button>
    </main>
  );
}
