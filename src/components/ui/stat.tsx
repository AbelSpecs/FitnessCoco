export const Stat = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="bg-background/30 rounded-lg p-2 backdrop-blur-md border border-border">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="font-display text-xl">{value}</p>
    </div>
  );
};
