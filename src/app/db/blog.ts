import fs from "fs";
import path from "path";
import matter from "gray-matter";

interface Metadata {
  title: string;
  publishedAt: string;
  tags: string[];
  description: string;
  reference: string[];
}

function parseRawMDX(raw: string) {
  const { data, content } = matter(raw);

  return { metadata: data as Metadata, content };
}

function readMDXFile(filePath: string) {
  let raw = fs.readFileSync(filePath, "utf-8");
  return parseRawMDX(raw);
}

const getMDXFiles = (dir: string) => {
  return fs.readdirSync(dir).map(
    (folder) =>
      folder +
      "/" +
      fs
        .readdirSync(`${dir}/${folder}`)
        .filter((file) => path.extname(file) === ".mdx")
        .join("")
  );
};

const getMDXData = (dir: string) => {
  const filePath = getMDXFiles(dir);
  return filePath.map((file) => {
    const slug = path.basename(file, path.extname(file));
    const { metadata, content } = readMDXFile(dir + "/" + file);
    return {
      slug,
      metadata,
      content,
    };
  });
};

const getBlogPosts = (dir: string) => {
  return getMDXData(path.join(process.cwd(), `contents/${dir}`));
};

const getBlogTags = (posts: ReturnType<typeof getBlogPosts>) => {
  const tags = new Map<string, number>();
  tags.set("all", posts.length);

  posts.forEach((post) =>
    post.metadata.tags.forEach((tag) => {
      const count = tags.get(tag);
      if (tags.has(tag) && count !== undefined) tags.set(tag, count + 1);
      else tags.set(tag, 1);
    })
  );

  return Array.from(tags);
};

export { getBlogPosts, getBlogTags };
