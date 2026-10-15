import { useState } from "react";
import backImage from "../assets/image.png";
import { Link } from "react-router-dom";
import API_URL from "../config";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const [data, setData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  function handleChange(e) {
    const { name, value } = e.target;

    setData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setMessage("");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.message || "Registration failed");
        return;
      }

      setMessage("Account created successfully!");

      setData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
      });
      navigate("/chat");
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to the server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#080d18] p-2 sm:p-4 lg:p-5">
      <div className="mx-auto flex min-h-[calc(100vh-1rem)] max-w-7xl overflow-hidden rounded-2xl border border-slate-700/50 bg-[#111827] shadow-2xl sm:min-h-[calc(100vh-2rem)] lg:min-h-[calc(100vh-2.5rem)]">
        {/* ================= LEFT SIDE ================= */}

        <div
          className="relative hidden w-1/2 overflow-hidden bg-cover bg-center px-8 py-7 text-white md:flex md:flex-col lg:px-10"
          style={{ backgroundImage: `url(${backImage})` }}
        >
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-slate-950/75" />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-slate-950/40 to-indigo-950/70" />

          {/* Logo */}

          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 to-violet-600 text-lg font-bold shadow-lg shadow-indigo-500/30">
              S
            </div>

            <span className="text-xl font-bold tracking-tight">Syncly</span>
          </div>

          {/* Hero */}

          <div className="relative z-10 mt-14 max-w-xl">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.28em] text-indigo-300">
              People · Ideas · Progress
            </p>

            <h1 className="text-4xl font-bold leading-[1.05] tracking-tight lg:text-5xl">
              More than chat.
              <span className="block bg-gradient-to-r from-indigo-300 via-violet-400 to-indigo-300 bg-clip-text text-transparent">
                Real alignment.
              </span>
            </h1>

            <p className="mt-4 max-w-lg text-sm leading-6 text-slate-300 lg:text-base">
              Syncly helps teams communicate, collaborate and move faster — all
              in one place.
            </p>
          </div>

          {/* Features */}

          <div className="relative z-10 mt-9 space-y-4">
            {/* Feature 01 */}

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-indigo-400/20 bg-indigo-500/10 text-[10px] font-semibold text-indigo-300">
                01
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-100">
                  Real-time messaging
                </h3>

                <p className="text-xs text-slate-400">Stay in sync, always</p>
              </div>
            </div>

            {/* Feature 02 */}

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-indigo-400/20 bg-indigo-500/10 text-[10px] font-semibold text-indigo-300">
                02
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-100">
                  Organize your work
                </h3>

                <p className="text-xs text-slate-400">
                  Teams, projects and more
                </p>
              </div>
            </div>

            {/* Feature 03 */}

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-indigo-400/20 bg-indigo-500/10 text-[10px] font-semibold text-indigo-300">
                03
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-100">
                  Built for what's next
                </h3>

                <p className="text-xs text-slate-400">
                  AI, file sharing and more
                </p>
              </div>
            </div>
          </div>

          {/* Bottom */}

          <div className="relative z-10 mt-auto">
            <div className="mb-2 h-1 w-8 rounded-full bg-gradient-to-r from-indigo-400 to-violet-500" />

            <p className="max-w-sm text-xs italic text-slate-400">
              "Better conversations build a brighter tomorrow."
            </p>
          </div>
        </div>

        {/* ================= RIGHT SIDE ================= */}

        <div className="flex w-full flex-col bg-[#111827] px-5 py-5 sm:px-8 md:w-1/2 md:px-10 lg:px-12">
          {/* Top navigation */}

          <div className="flex justify-end">
            <p className="text-xs text-slate-400">
              Already a member?
              <Link
                to="/login"
                type="button"
                className="ml-2 font-semibold text-indigo-400 transition hover:text-indigo-300"
              >
                Log in
              </Link>
            </p>
          </div>

          {/* Form container */}

          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-4">
            {/* Heading */}

            <div className="mb-5">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-400">
                Get started
              </p>

              <h2 className="text-2xl font-bold tracking-tight text-slate-100 lg:text-3xl">
                Create your account
              </h2>

              <p className="mt-2 text-sm text-slate-400">
                Join Syncly and be part of something more.
              </p>
            </div>

            {/* ================= FORM ================= */}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* First + Last name */}

              <div className="grid gap-3 sm:grid-cols-2">
                {/* First name */}

                <div>
                  <label
                    htmlFor="firstName"
                    className="mb-1.5 block text-xs font-semibold text-slate-200"
                  >
                    First name
                  </label>

                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="John"
                    value={data.firstName}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 hover:border-slate-600 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>

                {/* Last name */}

                <div>
                  <label
                    htmlFor="lastName"
                    className="mb-1.5 block text-xs font-semibold text-slate-200"
                  >
                    Last name
                  </label>

                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    placeholder="Doe"
                    value={data.lastName}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 hover:border-slate-600 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>
              </div>

              {/* Email */}

              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-xs font-semibold text-slate-200"
                >
                  Email address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={data.email}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 hover:border-slate-600 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>

              {/* Password */}

              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-xs font-semibold text-slate-200"
                >
                  Password
                </label>

                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={data.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2.5 pl-3.5 pr-14 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 hover:border-slate-600 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-indigo-400 transition hover:text-indigo-300"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* Password requirements */}

              <div className="rounded-lg border border-slate-700/60 bg-slate-800/60 px-3.5 py-2.5">
                <p className="mb-2 text-[10px] font-medium text-slate-400">
                  Your password must:
                </p>

                <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-400">
                  <p className="flex items-center gap-1.5">
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                        data.password.length >= 6
                          ? "bg-indigo-400"
                          : "bg-slate-600"
                      }`}
                    />
                    6+ characters
                  </p>

                  <p className="flex items-center gap-1.5">
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                        /\d/.test(data.password)
                          ? "bg-indigo-400"
                          : "bg-slate-600"
                      }`}
                    />
                    A number
                  </p>

                  <p className="flex items-center gap-1.5">
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                        /[A-Za-z]/.test(data.password)
                          ? "bg-indigo-400"
                          : "bg-slate-600"
                      }`}
                    />
                    A letter
                  </p>
                </div>
              </div>

              {/* Message */}

              {message && (
                <div
                  className={`rounded-lg border px-3.5 py-2.5 text-xs ${
                    message.includes("successfully")
                      ? "border-indigo-500/20 bg-indigo-500/10 text-indigo-300"
                      : "border-red-500/20 bg-red-500/10 text-red-400"
                  }`}
                >
                  {message}
                </div>
              )}

              {/* Submit */}

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition duration-200 hover:-translate-y-0.5 hover:from-indigo-500 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating account..." : "Create Account"}

                {!loading && (
                  <span className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                )}
              </button>
            </form>

            {/* Divider */}

            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-700" />

              <span className="text-[10px] font-medium text-slate-500">OR</span>

              <div className="h-px flex-1 bg-slate-700" />
            </div>

            {/* Social buttons */}

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="rounded-lg border border-slate-700 bg-slate-800 py-2.5 text-xs font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-750"
              >
                Continue with Google
              </button>

              <button
                type="button"
                className="rounded-lg border border-slate-700 bg-slate-800 py-2.5 text-xs font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-750"
              >
                Continue with GitHub
              </button>
            </div>

            {/* Terms */}

            <p className="mt-4 text-center text-[10px] leading-4 text-slate-500">
              By creating an account, you agree to our{" "}
              <button
                type="button"
                className="font-medium text-indigo-400 hover:text-indigo-300 hover:underline"
              >
                Terms of Service
              </button>{" "}
              and{" "}
              <button
                type="button"
                className="font-medium text-indigo-400 hover:text-indigo-300 hover:underline"
              >
                Privacy Policy
              </button>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
