import React from "react"
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin - R2K2 Tournaments",
  description: "Tournament administration dashboard",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
