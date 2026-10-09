import {
  Activity,
  History,
  Landmark,
  PieChart,
  Server,
  Waypoints,
} from "lucide-react";

export const NAV = [
  { href: "/", label: "Portfolio", icon: PieChart },
  { href: "/orchestrators", label: "Orchestrators", icon: Server },
  { href: "/gateways", label: "Gateways", icon: Waypoints },
  { href: "/network", label: "Network", icon: Activity },
  { href: "/governance", label: "Governance", icon: Landmark },
  { href: "/activity", label: "Activity", icon: History },
] as const;
