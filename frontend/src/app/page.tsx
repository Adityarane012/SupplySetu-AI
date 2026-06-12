"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <img src="/logo-main.png" alt="SupplySetu AI" className="h-14 w-auto mx-auto mb-2" />
        <p className="text-gray-500">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}
