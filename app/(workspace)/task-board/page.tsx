import { WorkspaceItemsPageClient } from "@/components/pages/WorkspaceItemsPageClient";
import { requireUser } from "@/lib/require-auth";
import { canManageTeam } from "@/lib/roles";

export default async function TaskBoardPage() {
  const user = await requireUser();
  const taskAssignmentMode = user.role === "coordinator" ? "members" : canManageTeam(user.role) ? "all" : "none";

  return (
    <WorkspaceItemsPageClient
      type="task"
      taskAssignmentMode={taskAssignmentMode}
      currentUserName={user.name}
      canCreate={false}
      displayMode="list"
      canEditTasks={user.role !== "member"}
    />
  );
}
