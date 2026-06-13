"use client";
import dynamic from "next/dynamic";

const DeliveryMap = dynamic(
  () => import("./DeliveryMap"),
  { ssr: false }
);

export default function MapWrapper({ route }: { route: any[] }) {
  return <DeliveryMap route={route} />;
}
