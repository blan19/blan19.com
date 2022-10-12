import fs from "fs";
import matter from "gray-matter";
import path from "path";
import { getPlaiceholder } from "plaiceholder";
import { MdxMeta, ProjectMdxMeta } from "../types/mdx";
import { getBase64BlurImage } from "./misc";

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
    const fileFolder = fs.readdirSync(dirPath + `/${file}`);
    const [mdx] = getSortedImageAndMdx(fileFolder);
    return {
      params: {
        id: file + "~" + mdx.replace(/\.md$/, ""),
      },
    };
  });
};

export const getProjects = async (dirPath: string) => {
  const files = fs.readdirSync(dirPath);

  const mdxMeta = files.map((file) => {
    const fileFolder = fs.readdirSync(dirPath + `/${file}`);
    const [mdx] = getSortedImageAndMdx(fileFolder);

    const filePath = path.join(dirPath + `/${file}`, `${mdx}`);

    const content = fs.readFileSync(filePath, "utf-8");

    const matterMarkdown = matter(content).content;
    const matteredContent = matter(content).data;

    const meta = {
      id: file + "~" + mdx.replace(/\.md$/, ""),
      ...matteredContent,
    } as ProjectMdxMeta;

    return {
      ...meta,
      markdown: matterMarkdown,
    };
  });

  const res = mdxMeta.map(async (v) => {
    const images = await Promise.all(
      v.thumbnail.map(async (t) => {
        const { base64, img } = await getPlaiceholder(`/images/${t}`);
        return {
          ...img,
          base64,
        };
      })
    ).then((res) => res);
    return {
      ...v,
      images,
    };
  });

  return res;
};

export const getContent = async (dirPath: string, id: string) => {
  const [file, mdx] = id.split("~");
  const filePath = path.join(dirPath + `/${file}`, `${mdx}.md`);
  const content = fs.readFileSync(filePath, "utf-8");
  const matteredContent = matter(content);

  return {
    id,
    markdown: matteredContent.content,
    ...matteredContent.data,
  };
};

export const getContentsMeta = (dirPath: string) => {
  const files = fs.readdirSync(dirPath);

  return files.map((file) => {
    const fileFolder = fs.readdirSync(dirPath + `/${file}`);
    const [mdx] = getSortedImageAndMdx(fileFolder);

    const filePath = path.join(dirPath + `/${file}`, `${mdx}`);

    const content = fs.readFileSync(filePath, "utf-8");

    const matteredContent = matter(content).data;

    const meta = {
      id: file + "~" + mdx.replace(/\.md$/, ""),
      ...matteredContent,
    } as MdxMeta;

    return meta;
  });
};
