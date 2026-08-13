"use client";

import { useEffect,useRef , useState } from "react";
import Link from "next/link";
import { Html5Qrcode } from "html5-qrcode";
interface DashboardData {
  total_participants: number;
  attended: number;
  not_attended: number;
  attendance_percentage: number;
}

interface Participant {
  id: number;
  name: string;
  email: string;
  phone: string;
  attended: boolean;
  registered_at: string;
  checked_in_at: string | null;
}

export default function AdminDashboard() {
  
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scannerActive, setScannerActive] = useState(false);
  const [scanMessage, setScanMessage] = useState("");
  const [scanError, setScanError] = useState("");
  const [scannedParticipant, setScannedParticipant] =
  useState<Participant | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
const [qrParticipant, setQrParticipant] =
  useState<Participant | null>(null);
const [qrLoading, setQrLoading] = useState(false);

  async function viewParticipantQR(participant: Participant) {
  setQrLoading(true);
  setQrCode(null);
  setQrParticipant(null);

  try {
    const response = await fetch(
      `http://127.0.0.1:8000/api/participants/${participant.id}/qr`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Unable to load QR code.");
    }

    setQrCode(data.qr_code);
    setQrParticipant(participant);
  } catch (err) {
    setScanError(
      err instanceof Error
        ? err.message
        : "Unable to load QR code."
    );
  } finally {
    setQrLoading(false);
  }
}

  async function fetchDashboard() {
    try {
      setError("");

      const [dashboardResponse, attendanceResponse] = await Promise.all([
        fetch("http://127.0.0.1:8000/api/dashboard"),
        fetch("http://127.0.0.1:8000/api/attendance"),
      ]);

      if (!dashboardResponse.ok || !attendanceResponse.ok) {
        throw new Error("Failed to load dashboard data.");
      }

      const dashboardData = await dashboardResponse.json();
      const attendanceData = await attendanceResponse.json();

      setDashboard(dashboardData);
      setParticipants(attendanceData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading the dashboard."
      );
    } finally {
      setLoading(false);
    }
  }
    async function stopScanner() {
  if (scannerRef.current) {
    try {
      await scannerRef.current.stop();
      scannerRef.current.clear();
    } catch {
      // Scanner may already be stopped
    }

    scannerRef.current = null;
  }

  setScannerActive(false);
}
async function handleScan(decodedText: string) {
  await stopScanner();

  setScanMessage("");
  setScanError("");
  setScannedParticipant(null);

  try {
    const response = await fetch(
      "http://127.0.0.1:8000/api/checkin",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          qr_token: decodedText,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Check-in failed.");
    }

    setScannedParticipant(data.participant);

    await fetchDashboard();

  } catch (err) {
    setScanError(
      err instanceof Error
        ? err.message
        : "Unable to process QR code."
    );
  }
}


async function startScanner() {
  setScanMessage("");
  setScanError("");

  try {
    const scanner = new Html5Qrcode("qr-reader");

    scannerRef.current = scanner;

    setScannerActive(true);

    await scanner.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      },
      (decodedText) => {
        handleScan(decodedText);
      },
      () => {
        // Ignore normal scanning failures
      }
    );

  } catch (err) {
    scannerRef.current = null;
    setScannerActive(false);

    setScanError(
      err instanceof Error
        ? err.message
        : "Unable to access the camera."
    );
  }
}

  

  useEffect(() => {
    fetchDashboard();

    // Refresh dashboard every 5 seconds
    const interval = setInterval(fetchDashboard, 5000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="text-slate-400">Loading dashboard...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center">
          <h1 className="text-xl font-semibold text-red-300">
            Unable to load dashboard
          </h1>
          <p className="mt-2 text-sm text-red-200">{error}</p>

          <button
            onClick={fetchDashboard}
            className="mt-5 rounded-xl bg-white px-5 py-2 font-medium text-slate-950"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">
              VividHata Club
            </p>

            <h1 className="mt-2 text-4xl font-bold tracking-tight">
              Event Dashboard
            </h1>

            <p className="mt-2 text-slate-400">
              Monitor registrations and attendance in real time.
            </p>
          </div>

          <Link
            href="/"
            className="w-fit rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-cyan-400 hover:text-cyan-400"
          >
            Participant Registration
          </Link>
        </div>

        {/* Statistics */}
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              Total Registered
            </p>

            <p className="mt-3 text-4xl font-bold">
              {dashboard?.total_participants}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              Attended
            </p>

            <p className="mt-3 text-4xl font-bold text-cyan-400">
              {dashboard?.attended}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              Not Attended
            </p>

            <p className="mt-3 text-4xl font-bold">
              {dashboard?.not_attended}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              Attendance Rate
            </p>

            <p className="mt-3 text-4xl font-bold">
              {dashboard?.attendance_percentage}%
            </p>
          </div>

        </div>

        {/* Attendance Table */}
        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">

          <div className="border-b border-slate-800 px-6 py-5">
            <h2 className="text-xl font-semibold">
              Participant Attendance
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Automatically refreshed every 5 seconds.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">

              <thead className="border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-medium">ID</th>
                  <th className="px-6 py-4 font-medium">Participant</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Phone</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Check-in Time</th>
                  <th className="px-6 py-4 font-medium">QR</th>
                </tr>
              </thead>

              <tbody>
                {participants.map((participant) => (
                  <tr
                    key={participant.id}
                    className="border-b border-slate-800/70 last:border-0"
                  >
                    <td className="px-6 py-4 text-slate-400">
                      #{participant.id}
                    </td>

                    <td className="px-6 py-4 font-medium">
                      {participant.name}
                    </td>

                    <td className="px-6 py-4 text-slate-400">
                      {participant.email}
                    </td>

                    <td className="px-6 py-4 text-slate-400">
                      {participant.phone}
                    </td>

                    <td className="px-6 py-4">
                      {participant.attended ? (
                        <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-400">
                          ✓ Attended
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-400">
                          Pending
                        </span>
                      )}
                    </td>
                    

                    <td className="px-6 py-4 text-slate-400">
                      {participant.checked_in_at
                        ? new Date(
                            participant.checked_in_at
                          ).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-6 py-4">
  <button
    onClick={() => viewParticipantQR(participant)}
    disabled={qrLoading}
    className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-cyan-400 hover:text-cyan-400 disabled:opacity-50"
  >
    {qrLoading ? "Loading..." : "View QR"}
  </button>
</td>
                  </tr>
                ))}

                {participants.length === 0 && (
                  <tr>
                    <td
                      colSpan={7

                      }
                      className="px-6 py-12 text-center text-slate-500"
                    >
                      No participants registered yet.
                    </td>
                  </tr>
                )}
              </tbody>

            </table>
          </div>
        </section>

        {/* Scanner placeholder */}
        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-8">

  <div className="text-center">

    <h2 className="text-2xl font-semibold">
      QR Check-in Scanner
    </h2>

    <p className="mx-auto mt-2 max-w-lg text-slate-400">
      Scan a participant's QR code to mark them as attended.
    </p>

  </div>

  <div className="mx-auto mt-6 max-w-md">

    <div
      id="qr-reader"
      className={scannerActive ? "overflow-hidden rounded-2xl" : "hidden"}
    />

    {!scannerActive && (
      <div className="rounded-2xl border border-dashed border-slate-700 p-10 text-center">

        <div className="text-5xl">
          ▦
        </div>

        <p className="mt-4 text-slate-400">
          Camera scanner is ready.
        </p>

      </div>
    )}

    <div className="mt-5 flex justify-center gap-3">

      {!scannerActive ? (
        <button
          onClick={startScanner}
          className="rounded-xl bg-cyan-400 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
        >
          Start Camera Scanner
        </button>
      ) : (
        <button
          onClick={stopScanner}
          className="rounded-xl border border-slate-700 px-6 py-3 font-semibold text-slate-200 transition hover:border-red-400 hover:text-red-400"
        >
          Stop Scanner
        </button>
      )}

    </div>

    {scannedParticipant && (
  <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-6 text-center">

    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cyan-400 text-2xl font-bold text-slate-950">
      ✓
    </div>

    <h3 className="mt-4 text-xl font-semibold text-cyan-300">
      Check-in Successful
    </h3>

    <p className="mt-2 text-2xl font-bold text-white">
      {scannedParticipant.name}
    </p>

    <p className="mt-1 text-sm text-slate-400">
      Registration #{scannedParticipant.id}
    </p>

    <div className="mt-4 text-sm text-slate-400">
      Checked in successfully
    </div>

    <button
      onClick={() => {
        setScannedParticipant(null);
        setScanError("");
        startScanner();
      }}
      className="mt-5 rounded-xl bg-cyan-400 px-5 py-2.5 font-semibold text-slate-950 transition hover:bg-cyan-300"
    >
      Scan Another
    </button>

  </div>
)}

{scanError && (
  <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-center">

    <div className="text-3xl">⚠</div>

    <h3 className="mt-2 font-semibold text-red-300">
      Check-in Failed
    </h3>

    <p className="mt-2 text-sm text-red-200">
      {scanError}
    </p>

    <button
      onClick={() => {
        setScanError("");
        startScanner();
      }}
      className="mt-4 rounded-xl border border-red-400/30 px-5 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-400/10"
    >
      Try Again
    </button>

  </div>
)}

  </div>

</section>

      </div>
      {qrCode && qrParticipant && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
    <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-8 text-center shadow-2xl">

      <h2 className="text-2xl font-bold">
        Participant QR
      </h2>

      <p className="mt-2 text-slate-400">
        {qrParticipant.name}
      </p>

      <div className="mx-auto mt-6 w-fit rounded-2xl bg-white p-5">
        <img
          src={qrCode}
          alt={`QR code for ${qrParticipant.name}`}
          className="h-64 w-64"
        />
      </div>

      <p className="mt-4 text-sm text-slate-400">
        Registration #{qrParticipant.id}
      </p>

      <button
        onClick={() => {
          setQrCode(null);
          setQrParticipant(null);
        }}
        className="mt-6 rounded-xl bg-cyan-400 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
      >
        Close
      </button>

    </div>
  </div>
)}
    </main>
  );
}