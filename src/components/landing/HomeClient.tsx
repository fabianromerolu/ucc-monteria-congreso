"use client";

import * as React from "react";

import Hero from "../landing/Hero";
import RegistrationsViewer from "../landing/RegistrationsViewer";
import AttendancePublicSection from "../landing/AttendancePublicSection";
import { getAttendancePublicConfig } from "@/src/services/attendance.service";

export default function HomeClient() {
  const [attendanceEnabled, setAttendanceEnabled] = React.useState(false);
  const [attendanceConfigLoading, setAttendanceConfigLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;

    async function loadAttendanceConfig() {
      try {
        setAttendanceConfigLoading(true);
        const config = await getAttendancePublicConfig();

        if (!mounted) return;
        setAttendanceEnabled(config.enabled);
      } catch (error) {
        console.error(error);

        if (!mounted) return;
        setAttendanceEnabled(false);
      } finally {
        if (mounted) {
          setAttendanceConfigLoading(false);
        }
      }
    }

    loadAttendanceConfig();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 md:py-12">
      <Hero />
      <AttendancePublicSection
        enabled={attendanceEnabled}
        loading={attendanceConfigLoading}
      />
      <RegistrationsViewer
        attendanceEnabled={attendanceEnabled}
        onAttendanceEnabledChange={setAttendanceEnabled}
      />
    </main>
  );
}
