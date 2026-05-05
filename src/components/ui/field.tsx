import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Field = ({
  name,
  label,
  value,
  defaultValue,
  autoComplete = true,
  type = "text",
  disabled = false,
  onChange,
}: {
  name?: string;
  label: string;
  defaultValue?: string;
  value?: string;
  autoComplete?: boolean;
  type?: string;
  disabled?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  return (
    <div>
      <Label className="text-xs uppercase tracking-widest text-muted-foreground">{label}</Label>
      <Input
        name={name}
        value={value}
        defaultValue={defaultValue}
        type={type}
        autoComplete={autoComplete ? "on" : "off"}
        disabled={disabled}
        onChange={onChange}
        className="mt-1.5 bg-background/50"
      />
    </div>
  );
};
