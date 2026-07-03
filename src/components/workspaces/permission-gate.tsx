import { LockIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  describePermission,
  membershipCan,
  type WorkspacePermission,
} from "@/lib/workspaces/permissions";
import { type RadarWorkspaceMembership } from "@/lib/workspaces/schema";

type WorkspacePermissionGateProps = {
  membership: RadarWorkspaceMembership;
  permission: WorkspacePermission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function WorkspacePermissionGate({
  membership,
  permission,
  children,
  fallback,
}: WorkspacePermissionGateProps) {
  if (membershipCan(membership, permission)) {
    return children;
  }

  if (fallback) {
    return fallback;
  }

  return <PermissionDenied permission={permission} />;
}

export function PermissionDenied({ permission }: { permission: WorkspacePermission }) {
  return (
    <Alert>
      <LockIcon />
      <AlertTitle>Permission required</AlertTitle>
      <AlertDescription>Your role cannot {describePermission(permission)}.</AlertDescription>
    </Alert>
  );
}
