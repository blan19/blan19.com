interface PostMdxMeta {
  date: string;
  title: string;
  creater: string;
  categories: string[];
  summary: string;
  thumbnail: string;
}

interface ProjectMdxMeta {}

interface DailyMdxMeta {}

interface MdxDto<T> {
  meta: T;
  contents: string;
  id: string;
}

export type { MdxDto, PostMdxMeta, ProjectMdxMeta, DailyMdxMeta };
