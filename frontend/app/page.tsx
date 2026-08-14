"use client";

import { FormEvent, useState } from "react";

interface Participant {
  id: number;
  name: string;
  email: string;
  phone: string;
  registered_at: string;
}

interface RegistrationResponse {
  message: string;
  participant: Participant;
  qr_token: string;
  qr_code: string;
}

export default function Home() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [result, setResult] = useState<RegistrationResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setResult(null);
    setLoading(true);

    try {
      const response = await fetch(
        "https://qr-event-checkin-api-1air.onrender.com/api/participants",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            phone,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Registration failed");
      }

      setResult(data);

      setName("");
      setEmail("");
      setPhone("");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-10 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">
            VividHata Club
          </p>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Event Check-in System
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-slate-400">
            Register for the event and receive your unique QR code.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">

          {/* Registration Form */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">

            <h2 className="text-2xl font-semibold">
              Register
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Enter your details to receive your event QR code.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Full Name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Enter your name"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Phone
                </label>

                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="9876543210"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-cyan-400"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Registering..." : "Register for Event"}
              </button>

            </form>

            {error && (
              <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                {error}
              </div>
            )}

          </section>

          {/* QR Result */}
          <section className="flex min-h-[500px] items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">

            {result ? (
              <div className="text-center">

                <div className="mb-6">
                  <div className="text-4xl">✓</div>

                  <h2 className="mt-3 text-2xl font-semibold">
                    Registration Successful
                  </h2>

                  <p className="mt-2 text-slate-400">
                    Show this QR code at the event entrance.
                  </p>
                </div>

                <div className="mx-auto w-fit rounded-2xl bg-white p-5">
                  <img
                    src={result.qr_code}
                    alt="Your event QR code"
                    className="h-64 w-64"
                  />
                  <a
  href={result.qr_code}
  download={`event-qr-${result.participant.id}.png`}
  className="mt-5 inline-block rounded-xl bg-cyan-400 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
>
  Download QR Code
</a>
                </div>

                <p className="mt-5 text-lg font-medium">
                  {result.participant.name}
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Registration ID: #{result.participant.id}
                </p>

              </div>
            ) : (
              <div className="text-center text-slate-500">

                <div className="text-6xl">▦</div>

                <h2 className="mt-5 text-xl font-semibold text-slate-300">
                  Your QR code will appear here
                </h2>

                <p className="mt-2 text-sm">
                  Complete the registration form to generate it.
                </p>

              </div>
            )}

          </section>

        </div>
      </div>
    </main>
  );
}