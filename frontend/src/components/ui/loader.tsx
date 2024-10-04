import { cva, VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

interface LoaderProps
  extends VariantProps<typeof loaderVariants>,
    VariantProps<typeof spinnerVariants> {
  color?: string;
  className?: string;
  strokeWidth?: string | number;
  children?: React.ReactNode;
  containerClassName?: string;
}

const loaderVariants = cva("flex items-center gap-3", {
  variants: {
    variant: {
      default: "",
    },
    size: {
      default: "h-full w-full justify-center",
      fit: "w-fit",
      fullScreen:
        "fixed left-0 top-0 h-screen w-screen justify-center backdrop-blur-md",
    },
    spinnerSize: {
      sm: "h-[24px] w-[24px]",
      md: "h-[100px] w-[100px]",
      lg: "h-[200px] w-[200px]",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

const spinnerVariants = cva("", {
  variants: {
    spinnerSize: {
      sm: "h-[40px] w-[40px]",
      md: "h-[100px] w-[100px]",
      lg: "h-[200px] w-[200px]",
    },
  },
  defaultVariants: {
    spinnerSize: "sm",
  },
});

export function Loader(props: LoaderProps) {
  const {
    color = "grey",
    variant,
    size,
    spinnerSize,
    className,
    containerClassName,
    strokeWidth = 2,
    children,
  } = props;

  return (
    <div
      className={cn(
        loaderVariants({ variant, size, className: containerClassName }),
      )}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn([
          "animate-spin",
          className,
          spinnerVariants({ spinnerSize: spinnerSize }),
        ])}
      >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
      {children ? children : <p>กำลังโหลด...</p>}
    </div>
  );
}
