import fs from "fs";

export const getContentsPaths = (path: string) => {
  const files = fs.readdirSync(path);

  return files.map((file) => {
    return {
      params: {
        id: file.replace(/\.md$/, ""),
      },
    };
  });
};
