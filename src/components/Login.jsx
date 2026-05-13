import { useState } from "react";
import { AlertCircle, Mail, Lock, Eye, EyeOff, Moon, Sun } from "lucide-react";
import { login } from "../services/api";
import { useAuth } from "../hooks/useAuth";

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { theme, toggleTheme } = useAuth();

  const logoSrc = theme === "dark" ? "/logo-text-white.png" : "/logo-text.png";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setIsLoading(true);
      const response = await login(email, password);

      onLoginSuccess(response);
    } catch (err) {
      // Extract error details from various possible response structures
      let errorMsg = "Login failed. Please try again.";

      if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.response?.statusText) {
        errorMsg = `Error: ${err.response.statusText}`;
      } else if (err.message) {
        errorMsg = err.message;
      }

      console.error("❌ Login Error:", {
        status: err.response?.status,
        statusText: err.response?.statusText,
        error: err.response?.data?.error,
        message: err.response?.data?.message,
        fullError: err.message,
        data: err.response?.data,
      });

      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-linear-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-lg shadow-2xl dark:shadow-slate-900/50 p-8 border border-slate-200 dark:border-slate-700">
          {/* Header with Theme Toggle */}
          <div className="flex justify-between items-start mb-4">
            <div className="text-center flex-1">
              <div className="flex justify-center mb-4">
                <img
                  src={logoSrc}
                  alt="CleanMeets Logo"
                  className="h-24 dark:h-20 w-auto"
                />
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700/50 rounded-lg transition text-slate-700 dark:text-slate-300"
              title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400 dark:text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-600 focus:border-cyan-500 dark:focus:border-cyan-500 outline-none transition"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400 dark:text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-600 focus:border-cyan-500 dark:focus:border-cyan-500 outline-none transition"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-3 top-2.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 focus:outline-none"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-rose-500/20 dark:bg-rose-500/20 border border-rose-500/50 rounded flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <p className="text-rose-600 dark:text-rose-400 text-sm">
                  {error}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2 bg-linear-to-r from-primary-500 to-primary-600 text-white rounded-lg font-semibold hover:from-primary-600 hover:to-primary-700 disabled:from-slate-400 disabled:to-slate-400 transition"
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          {/* Info Message */}
          <div className="mt-6 p-3 bg-blue-500/20 dark:bg-blue-500/20 border border-blue-500/50 rounded">
            <p className="text-blue-600 dark:text-blue-400 text-sm text-center">
              Contact your administrator to create an account
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-600 dark:text-slate-500 text-sm mt-6">
          © {new Date().getFullYear()} CleanMeets. All rights reserved.
        </p>
      </div>
    </div>
  );
}
