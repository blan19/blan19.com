import { getBlogPosts, getBlogTags } from "@/app/db/blog";
import clsx from "clsx";
import Link from "next/link";

interface TagsProps {
  posts: ReturnType<typeof getBlogPosts>;
  seletedTag: string;
}

const Tags = ({ posts, seletedTag }: TagsProps) => {
  const tags = getBlogTags(posts);
  return (
    <ul className="flex w-full justify-center items-center gap-3 flex-wrap">
      {tags.map(([tag, count]) => {
        const isSeleted =
          tag === seletedTag || (tag === "all" && seletedTag === undefined);

        return (
          <Link
            key={tag}
            href={{
              pathname: "/blog",
              query: {
                tag: tag,
              },
            }}
          >
            <li
              className={clsx(
                "flex gap-1 p-2 rounded-xl",
                {
                  "bg-greyscale-1 dark:bg-greyscale-8": isSeleted,
                },
                {
                  "border border-greyscale-5 dark:border-greyscale-8 text-greyscale-6":
                    !isSeleted,
                }
              )}
            >
              <h1>{tag}</h1>
              <span
                className={clsx(
                  {
                    "text-greyscale-6": isSeleted,
                  },
                  {
                    "text-greyscale-7": !isSeleted,
                  }
                )}
              >{`(${count})`}</span>
            </li>
          </Link>
        );
      })}
    </ul>
  );
};

export default Tags;
