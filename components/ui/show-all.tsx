import { Button } from "@/components/ui/button";

/** Footer that reveals the rest of a truncated list in one go. */
export function ShowAll({
  shown,
  total,
  onMore,
}: {
  shown: number;
  total: number;
  onMore: () => void;
}) {
  if (shown >= total) return null;
  return (
    <div className="border-t border-hairline p-2">
      <Button variant="ghost" size="sm" className="w-full" onClick={onMore}>
        Show all {total.toLocaleString()}
      </Button>
    </div>
  );
}
