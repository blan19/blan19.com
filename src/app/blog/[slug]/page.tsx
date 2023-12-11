import { getBlogPosts } from "@/app/db/blog";
import MDX from "@/components/ui/mdx";
import Table from "@/components/ui/table";
import { notFound } from "next/navigation";

const Post = ({ params: { slug } }: { params: { slug: string } }) => {
  const post = getBlogPosts("tech").find((post) => post.slug === slug);

  if (!post) {
    notFound();
  }

  return (
    <section>
      <Table contents={post.content} />
      <MDX contents={post.content} />
    </section>
  );
};

export default Post;
