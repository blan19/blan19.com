import fs from "fs";
import matter from "gray-matter";
import path from "path";
import { remark } from "remark";
import html from "remark-html";

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
    const filePath = path.join(dirPath, file);
    const content = fs.readFileSync(filePath, "utf-8");
    const matteredContent = matter(content);
    return {
      id: file.replace(/\.md$/, ""),
      ...matteredContent.data,
    };
  });
};
