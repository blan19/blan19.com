import Card from "@/components/ui/card";
import { getBlogPosts } from "@/app/db/blog";
import Tags from "@/components/ui/tags";
import Link from "next/link";

const Blog = ({
  searchParams: { tag },
}: {
  searchParams: {
    tag: string;
  };
}) => {
  const posts = getBlogPosts("tech");
  const selectedPosts = posts.filter((post) =>
    tag !== "all" && tag !== undefined ? post.metadata.tags.includes(tag) : post
  );

  return (
    <section>
      <h1 className="text-8xl mb-6">🧑‍💻</h1>
      <h1 className="font-medium text-2xl mb-1 tracking-tighter">
        블로그 포스팅
      </h1>
      <p className="w-full text-greyscale-5">내 기록들</p>
      <div className="w-full h-[0.5px] rounded bg-greyscale-3 my-7" />
      <Tags posts={posts} seletedTag={tag} />
      <ul className="flex flex-col gap-8 pt-7">
        {selectedPosts.map(({ metadata, slug }) => (
          <li key={slug}>
            <Link href={`/blog/${slug}`}>
              <Card
                title={metadata.title}
                tags={metadata.tags}
                date={metadata.publishedAt}
              >
                <span className="text-sm text-greyscale-7 dark:text-greyscale-2">
                  10000 views
                </span>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default Blog;
