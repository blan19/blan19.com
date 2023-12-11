import MDX from "@/components/ui/mdx";
import Table from "@/components/ui/table";
import formatDate from "@/utils/formatDate";
import { getBlogPosts } from "@/app/db/blog";
import { notFound } from "next/navigation";

const Post = ({ params: { slug } }: { params: { slug: string } }) => {
  const post = getBlogPosts("tech").find((post) => post.slug === slug);

  if (!post) {
    notFound();
  }

  return (
    <section>
      <ul className="flex gap-2 mb-4">
        {post.metadata.tags.map((tag) => (
          <li key={tag}>
            <span className="text-lg font-medium text-greyscale-5 tracking-tighter">
              #{tag}
            </span>
          </li>
        ))}
      </ul>
      <h1 className="font-medium text-4xl tracking-tighter mb-3">
        {post.metadata.title}
      </h1>
      <p className="mb-10 dark:text-greyscale-4 my-4">
        {formatDate(post.metadata.publishedAt)}
      </p>
      <Table contents={post.content} />
      <MDX contents={post.content} />
    </section>
  );
};

export default Post;
