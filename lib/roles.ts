import type { UserRole } from "@/types";

export const SUPER_ADMIN_EMAIL = "fakhrulalam104@gmail.com";
const roleRank: Record<UserRole, number> = {
  member: 1,
  coordinator: 1,
  hr: 2,
  manager: 2,
  admin: 3,
  owner: 4,
  super_admin: 5
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
    case "manager":
    case "hr":
    case "coordinator":
    case "member":
      return value;
    default:
      return "member";
  }
}

export function canManageTeam(role: UserRole) {
  return role === "super_admin" || role === "owner" || role === "admin" || role === "manager" || role === "hr";
}

export function canManageSettings(role: UserRole) {
  return role === "super_admin" || role === "owner" || role === "admin" || role === "manager" || role === "hr";
}

export function canReviewApprovals(role: UserRole) {
  return canManageTeam(role);
}

export function canCoordinateTasks(role: UserRole) {
  return role === "coordinator" || canManageTeam(role);
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
    return nextRole === "admin" || nextRole === "manager" || nextRole === "hr" || nextRole === "coordinator" || nextRole === "member";
  }

  if (actorRole === "admin") {
    return nextRole === "manager" || nextRole === "hr" || nextRole === "coordinator" || nextRole === "member";
  }

  if (actorRole === "manager" || actorRole === "hr") {
    return nextRole === "coordinator" || nextRole === "member";
  }

  return false;
}

export function canManageTargetRole(actorRole: UserRole, targetRole: UserRole) {
  if (actorRole === "super_admin") {
    return true;
  }

  return roleRank[actorRole] > roleRank[targetRole];
}
