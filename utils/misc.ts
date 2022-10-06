import { PostMdxMeta } from "../types/mdx";

type ErrorWithMessage = {
  message: string;
};

export const getCategry = (data: PostMdxMeta[]) => {
  const category = new Map<string, number>();
  category.set("All", data.length);
  for (const d of data) {
    const { categories } = d;
    categories.forEach((s: string) => {
      if (category.has(s)) category.set(s, category.get(s) + 1);
      else category.set(s, 1);
    });
  }
  return Array.from(category);
};

const isErrorWithMessage = (error: unknown): error is ErrorWithMessage => {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as Record<string, unknown>).message === "string"
  );
};

const toErrorWithMessage = (maybeError: unknown): ErrorWithMessage => {
  if (isErrorWithMessage(maybeError)) return maybeError;

  try {
    return new Error(JSON.stringify(maybeError));
  } catch {
    return new Error(String(maybeError));
  }
};

export const getErrorMessage = (error: unknown) =>
  toErrorWithMessage(error).message;
