import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import API_URL from "../config";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const { user, getCurrentUser, logout } = useContext(AuthContext);
  const [data, setData] = useState({
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
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.message || "Invalid email or password");
        return;
      }

      const token = result.data.token;

      localStorage.setItem("authToken", token);

      setMessage("Login successful!");
      await getCurrentUser();
      navigate("/chat");
    } catch (error) {
      console.log(error);
      setMessage("Unable to connect to the server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#080d18] p-2 sm:p-4 lg:p-5">
      <div className="mx-auto flex min-h-[calc(100vh-1rem)] max-w-7xl overflow-hidden rounded-2xl border border-slate-700/50 bg-[#111827] shadow-2xl sm:min-h-[calc(100vh-2rem)] lg:min-h-[calc(100vh-2.5rem)]">
        <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-8 py-7 text-white md:flex md:flex-col lg:px-10">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/30 via-transparent to-violet-950/40" />

          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 to-violet-600 text-lg font-bold shadow-lg shadow-indigo-500/30">
              S
            </div>

            <span className="text-xl font-bold tracking-tight">Syncly</span>
          </div>

          <div className="relative z-10 mt-16 max-w-xl">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.28em] text-indigo-300">
              Welcome back
            </p>

            <h1 className="text-4xl font-bold leading-[1.05] tracking-tight lg:text-5xl">
              Continue the
              <span className="block bg-gradient-to-r from-indigo-300 via-violet-400 to-indigo-300 bg-clip-text text-transparent">
                conversation.
              </span>
            </h1>

            <p className="mt-4 max-w-lg text-sm leading-6 text-slate-300 lg:text-base">
              Your conversations, teams and ideas are waiting for you. Pick up
              where you left off.
            </p>
          </div>

          <div className="relative z-10 mt-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-indigo-400/20 bg-indigo-500/10 text-[10px] font-semibold text-indigo-300">
                01
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-100">
                  Stay connected
                </h3>

                <p className="text-xs text-slate-400">
                  Keep conversations moving
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-indigo-400/20 bg-indigo-500/10 text-[10px] font-semibold text-indigo-300">
                02
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-100">
                  Work together
                </h3>

                <p className="text-xs text-slate-400">
                  Collaborate without switching tools
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-indigo-400/20 bg-indigo-500/10 text-[10px] font-semibold text-indigo-300">
                03
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-100">
                  Move faster
                </h3>

                <p className="text-xs text-slate-400">
                  Let AI help with the busy work
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-auto">
            <div className="mb-2 h-1 w-8 rounded-full bg-gradient-to-r from-indigo-400 to-violet-500" />

            <p className="max-w-sm text-xs italic text-slate-400">
              "Better conversations build a brighter tomorrow."
            </p>
          </div>
        </div>

        {/* RIGHT SIDE */}

        <div className="flex w-full flex-col bg-[#111827] px-5 py-5 sm:px-8 md:w-1/2 md:px-10 lg:px-12">
          <div className="flex justify-end">
            <p className="text-xs text-slate-400">
              New to Syncly?
              <Link
                to="/register"
                className="ml-2 font-semibold text-indigo-400 transition hover:text-indigo-300"
              >
                Create account
              </Link>
            </p>
          </div>

          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-4">
            <div className="mb-6">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-400">
                Welcome back
              </p>

              <h2 className="text-2xl font-bold tracking-tight text-slate-100 lg:text-3xl">
                Sign in to Syncly
              </h2>

              <p className="mt-2 text-sm text-slate-400">
                Continue where you left off.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-xs font-semibold text-slate-200"
                  >
                    Password
                  </label>

                  <button
                    type="button"
                    className="text-[11px] font-medium text-indigo-400 transition hover:text-indigo-300"
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={data.password}
                    onChange={handleChange}
                    required
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

              {/* MESSAGE */}

              {message && (
                <div
                  className={`rounded-lg border px-3.5 py-2.5 text-xs ${
                    message.includes("successful")
                      ? "border-indigo-500/20 bg-indigo-500/10 text-indigo-300"
                      : "border-red-500/20 bg-red-500/10 text-red-400"
                  }`}
                >
                  {message}
                </div>
              )}

              {/* LOGIN BUTTON */}

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition duration-200 hover:-translate-y-0.5 hover:from-indigo-500 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            {/* DIVIDER */}

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-700" />

              <span className="text-[10px] font-medium text-slate-500">OR</span>

              <div className="h-px flex-1 bg-slate-700" />
            </div>

            {/* SOCIAL LOGIN */}

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

            {/* USER INFO */}

            {user && (
              <div className="mt-5 rounded-lg border border-indigo-500/20 bg-indigo-500/10 p-4">
                <p className="text-xs text-indigo-300">Currently signed in</p>

                <h3 className="mt-1 text-sm font-semibold text-slate-100">
                  Welcome, {user.firstName}
                </h3>

                <p className="mt-1 text-xs text-slate-400">{user.email}</p>

                <button
                  onClick={logout}
                  type="button"
                  className="mt-3 text-xs font-medium text-red-400 transition hover:text-red-300"
                >
                  Logout
                </button>
              </div>
            )}

            {/* FOOTER */}

            <p className="mt-5 text-center text-[10px] leading-4 text-slate-500">
              By continuing, you agree to our{" "}
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

export default Login;
