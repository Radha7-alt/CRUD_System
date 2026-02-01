import { verifyToken } from "./auth";

export function getAuth(req) {
  const token = req.cookies?.token;
  if (!token) return null;
  try {
    return verifyToken(token); // { userId, role, iat, exp }
  } catch {
    return null;
  }
}

export function requireAuth(req, res) {
  const auth = getAuth(req);
  if (!auth) {
    res.status(401).json({ message: "Unauthorized" });
    return null;
  }
  return auth;
}

export function requireAdmin(req, res) {
  const auth = requireAuth(req, res);
  if (!auth) return null;
  if (auth.role !== "admin") {
    res.status(403).json({ message: "Forbidden (admin only)" });
    return null;
  }
  return auth;
}
