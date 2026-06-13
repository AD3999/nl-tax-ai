import { Badge } from "@/components/ui/index";
import type { VerificationStatus } from "@/lib/tax-rules/types";

const CONFIG: Record<VerificationStatus, { label: string; variant: "success" | "warning" | "gray" | "error" }> = {
  verified:       { label: "Verified",       variant: "success"  },
  pending_review: { label: "Pending Review", variant: "warning"  },
  draft:          { label: "Draft",          variant: "gray"     },
  expired:        { label: "Expired",        variant: "error"    },
};

export function RuleStatusBadge({ status }: { status: VerificationStatus }) {
  const { label, variant } = CONFIG[status];
  return <Badge variant={variant}>{label}</Badge>;
}
