import { Button } from "@/components/base/Button";

interface AdminActionButtonsProps {
  onRestore: () => void | Promise<void>;
  onSave: () => void | Promise<void>;
  onClear: () => void;
  isLoading?: boolean;
  isLoadingRestore?: boolean;
}

export function AdminActionButtons({
  onRestore,
  onSave,
  onClear,
  isLoading = false,
  isLoadingRestore = false,
}: AdminActionButtonsProps) {
  const isDisabled = isLoading || isLoadingRestore;

  return (
    <div className="h-20 flex items-center justify-end gap-2">
      <Button
        size="md"
        text="sm"
        tone="white"
        appearance="solid"
        onClick={onRestore}
        disabled={isDisabled}
      >
        {isLoadingRestore ? "載入中..." : "恢復"}
      </Button>
      <Button
        size="md"
        text="sm"
        tone="orange"
        onClick={onSave}
        disabled={isDisabled}
      >
        {isLoading ? "儲存中..." : "儲存"}
      </Button>
      <Button
        size="md"
        text="sm"
        tone="transparent"
        appearance="solid"
        onClick={onClear}
        disabled={isDisabled}
      >
        清除
      </Button>
    </div>
  );
}
