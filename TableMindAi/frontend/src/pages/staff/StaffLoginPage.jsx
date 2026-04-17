import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { getApiErrorMessage } from "../../utils/errors";

export default function StaffLoginPage() {
  const navigate = useNavigate();
  const { login, logout } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState("staff@tablemind.ai");
  const [password, setPassword] = useState("Staff123!");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const user = await login({ email, password });

      if (!["staff", "admin"].includes(user.role)) {
        logout();
        throw new Error("This account does not have staff access.");
      }

      navigate("/staff/dashboard");
      showToast({
        title: "Signed in",
        message: "Staff session is active.",
        variant: "success",
      });
    } catch (requestError) {
      const message = getApiErrorMessage(requestError, "Unable to sign in.");
      setError(message);
      showToast({
        title: "Sign-in failed",
        message,
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form className="panel w-full max-w-md space-y-5 rounded-[32px] p-8" onSubmit={handleSubmit}>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Staff Access</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Sign in to the live order board</h1>
        </div>
        <Input label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        <Input label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </Button>
      </form>
    </div>
  );
}
