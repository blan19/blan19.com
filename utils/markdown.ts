import fs from "fs";
import matter from "gray-matter";
import path from "path";
import { remark } from "remark";
import html from "remark-html";
import { PostMdxMeta } from "../types/mdx";

interface Mdx {
  [key: string]: any;
}

export type Meta = { id: string } & Mdx;

const getSortedImageAndMdx = (files: string[]) => {
  let image: string = "";
  let mdx: string = "";
  files.forEach((file) => {
    if (file.includes("md")) mdx = file;
    else image = file;
  });
  return [mdx, image];
};

export const getContentsPaths = (dirPath: string) => {
  const files = fs.readdirSync(dirPath);

  return files.map((file) => {
    return {
      params: {
        id: file.replace(/\.md$/, ""),
      },
    };
  });
};

export const getContentsFolderFiles = (dirPath: string) => {};

export const getContent = async (dirPath: string, id: string) => {
  const filePath = path.join(dirPath, `${id}.md`);
  const content = fs.readFileSync(filePath, "utf-8");
  const matteredContent = matter(content);

  const remarkedContent = await remark()
    .use(html)
    .process(matteredContent.content);
  const contentHtml = remarkedContent.toString();

  return {
    id,
    contentHtml,
    ...matteredContent.data,
  };
};

export const getContentsMeta = (dirPath: string) => {
  const files = fs.readdirSync(dirPath);

  return files.map((file) => {
    const fileFolder = fs.readdirSync(dirPath + `/${file}`);
    const [mdx, _] = getSortedImageAndMdx(fileFolder);

    const filePath = path.join(dirPath + `/${file}`, `${mdx}`);
    console.log(filePath);

    const content = fs.readFileSync(filePath, "utf-8");
    const matteredContent = matter(content).data as PostMdxMeta;

    return matteredContent;
  });
};
