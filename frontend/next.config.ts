import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: "/",
        destination: "/screens/supplysetu_ai_-_landing_page.html",
      },
      {
        source: "/login",
        destination: "/screens/supplysetu_ai_-_login_-_otp.html",
      },
      {
        source: "/orders/new",
        destination: "/screens/supplysetu_ai_-_new_order_voice.html",
      },
      {
        source: "/orders/detail",
        destination: "/screens/supplysetu_ai_-_order_detail.html",
      },
      {
        source: "/customers",
        destination: "/screens/supplysetu_ai_-_customer_directory.html",
      },
      {
        source: "/customers/profile",
        destination: "/screens/supplysetu_ai_-_customer_profile.html",
      },
      {
        source: "/analytics",
        destination: "/screens/supplysetu_ai_-_analytics_dashboard.html",
      },
      {
        source: "/settings",
        destination: "/screens/supplysetu_ai_-_settings.html",
      },
    ];
  },
};

export default nextConfig;
