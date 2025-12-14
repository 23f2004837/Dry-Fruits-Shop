import { useAuth } from "./AuthContext";

export const AuthGate = ({ children }) => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        Checking your session…
      </div>
    );
  }

  return children;
};
