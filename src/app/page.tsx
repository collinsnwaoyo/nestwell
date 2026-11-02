"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/shell/brand-mark";
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
      <BrandMark large />

      <div className="flex flex-col items-center gap-3">
        <h1 className="text-display font-semibold">Nestwell</h1>
        <p className="max-w-sm text-balance text-muted-foreground">
          Hi there. I use Nestwell to run my own rental properties in Lagos.
          I&apos;ve opened up a demo copy so you can look around. Everything
          works, and the data resets every night.
        </p>
      </div>

      <Button className="px-6" onClick={handleContinue}>
        Continue
      </Button>
    </main>
  );
}
