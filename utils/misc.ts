import { getPlaiceholder } from "plaiceholder";
import { BlurredData, MdxMeta } from "../types/mdx";
import path from "path";
import fs from "fs";

type ErrorWithMessage = {
  message: string;
};

export const getBase64BlurImage = async (
  data: MdxMeta[]
): Promise<BlurredData<MdxMeta>[]> => {
  const res = await Promise.all(
    data.map(async (v) => {
      const { base64, img } = await getPlaiceholder(`/images/${v.thumbnail}`);
      return {
        ...v,
        ...img,
        base64,
      };
    })
  ).then((v) => v);

  return res;
};

export const getCategry = (data: MdxMeta[]) => {
  const category = new Map<string, number>();
  category.set("All", data.length);
  for (const d of data) {
    const { categories } = d;
    categories.forEach((s: string) => {
      const v = category.get(s);
      if (category.has(s) && v !== undefined) category.set(s, v + 1);
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
