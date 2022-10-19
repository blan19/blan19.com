interface MdxMeta {
  id: string;
  date: string;
  title: string;
  creater: string;
  categories: string[];
  summary: string;
  thumbnail: string;
}

interface ProjectMdxMeta {
  id: string;
  date: string;
  title: string;
  creater: string;
  summary: string;
  categories: string[];
  thumbnail: string[];
  github: string;
  stack: string[];
}

interface DailyMdxMeta {}

interface MdxDto<T> {
  meta: T;
  contents: string;
  id: string;
}

type BlurredData<T> = T & {
  base64: string;
  src: string;
  height: number;
  width: number;
  type?: string | undefined;
};

export type { MdxDto, MdxMeta, ProjectMdxMeta, DailyMdxMeta, BlurredData };
