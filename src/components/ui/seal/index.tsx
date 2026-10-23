import clsx from "clsx";

interface SealProps {
  size?: "sm" | "md" | "end" | "lg" | "xl";
  className?: string;
}

const Seal = ({ size, className }: SealProps) => {
  return (
    <span className={clsx("seal", `seal-${size ?? "md"}`, className)} aria-hidden="true">
      19
    </span>
  );
};

export default Seal;
