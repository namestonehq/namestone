import React from "react";
import LoadingSpinner from "./LoadingSpinner";

const colorClassMapping = {
  orange:
    "bg-orange-500 hover:bg-orange-700 active:bg-orange-800 disabled:bg-orange-500/[0.50]",
  brownblack:
    "bg-brownblack-100 hover:bg-brownblack-200 active:bg-brownblack-300 disabled:bg-brownblack-300/[0.50]",
  white:
    "bg-white hover:bg-orange-300 active:bg-orange-400 disabled:bg-brownblack-300/[0.50]",
};

export default function Button({
  buttonText,
  onClick = () => {},
  className,
  type = "button",
  disabled = false,
  color = "orange",
  pending = false,
}) {
  const colorClass = colorClassMapping[color] || colorClassMapping.orange;
  return (
    <button
      onClick={onClick}
      className={`${className} ${colorClass} flex items-center justify-center py-3 min-w-[150px] mx-auto text-sm font-bold rounded-lg disabled:cursor-not-allowed text-brownblack-700 md:block `}
      type={type}
      disabled={disabled}
    >
      {pending ? <LoadingSpinner /> : buttonText}
    </button>
  );
}
