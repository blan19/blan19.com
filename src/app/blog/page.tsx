import Card from "@/components/ui/card";
import { getBlogPosts } from "@/app/db/blog";

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
      <ul>
        <li>
          <Card
            title="내가 next.js@14를 사용하는  이유 내가 next.js@14를 사용하는  이유"
            tags={["react", "next.js"]}
            date="2023-12-10"
            view={10000}
          />
        </li>
      </ul>
    </section>
  );
};

export default Blog;
