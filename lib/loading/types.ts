export type LoadingVariant = "full-page" | "section" | "inline";
export type LoadingState = "loading" | "success" | "error";

export interface LoadingContainerProps {
  variant?: LoadingVariant;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  isLoading?: boolean;
  state?: LoadingState;
  error?: React.ReactNode;
  className?: string;
}

export interface SkeletonBlockProps {
  height?: string;
  width?: string;
  rounded?: string;
  className?: string;
}

export interface SkeletonLineProps {
  width?: string;
  height?: string;
  className?: string;
}

export interface SkeletonGridProps {
  cols?: number;
  gap?: string;
  children?: React.ReactNode;
  className?: string;
}
