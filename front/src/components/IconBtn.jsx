/**
 * Consistent icon-only action button.
 * Solid colored rounded square with a white icon — matches the design reference.
 *
 * color variants: "green" | "blue" | "red" | "yellow"
 */
const colorMap = {
  green:  "bg-green-500 hover:bg-green-600",
  blue:   "bg-blue-500 hover:bg-blue-600",
  red:    "bg-red-500 hover:bg-red-600",
  yellow: "bg-yellow-400 hover:bg-yellow-500",
};

const IconBtn = ({ onClick, disabled, title, icon: Icon, color = "blue" }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    aria-label={title}
    className={`
      inline-flex items-center justify-center
      w-8 h-8 rounded-xl
      text-white transition-colors
      disabled:opacity-40 disabled:cursor-not-allowed
      ${colorMap[color] ?? colorMap.blue}
    `}
  >
    <Icon size={15} strokeWidth={2.2} />
  </button>
);

export default IconBtn;
