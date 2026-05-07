import type { UserRole } from "@/types";

export const SUPER_ADMIN_EMAIL = "fakhrulalam104@gmail.com";
const roleRank: Record<UserRole, number> = {
  member: 1,
  admin: 2,
  owner: 3,
  super_admin: 4
};

export function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.toLowerCase().trim() : "";
}

export function isSuperAdminEmail(value: unknown) {
  return normalizeEmail(value) === SUPER_ADMIN_EMAIL;
}

export function normalizeUserRole(value: unknown, email?: unknown): UserRole {
  if (isSuperAdminEmail(email)) {
    return "super_admin";
  }

  switch (value) {
    case "owner":
    case "admin":
    case "member":
      return value;
    default:
      return "member";
  }
}

export function canManageTeam(role: UserRole) {
  return role === "super_admin" || role === "owner" || role === "admin";
}

export function canManageSettings(role: UserRole) {
  return role === "super_admin" || role === "owner" || role === "admin";
}

export function canReviewApprovals(role: UserRole) {
  return canManageTeam(role);
}

export function canAccessTracking(role: UserRole) {
  return role !== "super_admin";
}

export function getDefaultHomePath(role: UserRole) {
  return canAccessTracking(role) ? "/dashboard" : "/admin";
}

export function canAssignRole(actorRole: UserRole, nextRole: UserRole) {
  if (nextRole === "super_admin") {
    return actorRole === "super_admin";
  }

  if (actorRole === "super_admin") {
    return true;
  }

  if (actorRole === "owner") {
    return nextRole === "admin" || nextRole === "member";
  }

  if (actorRole === "admin") {
    return nextRole === "member";
  }

  return false;
}

export function canManageTargetRole(actorRole: UserRole, targetRole: UserRole) {
  if (actorRole === "super_admin") {
    return true;
  }

  return roleRank[actorRole] > roleRank[targetRole];
}
