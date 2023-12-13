import MDX from "@/components/ui/mdx";
import Table from "@/components/ui/table";
import formatDate from "@/utils/formatDate";
import Comment from "@/components/ui/comment";
import { getBlogPosts } from "@/app/db/blog";
import { notFound } from "next/navigation";
import { Suspense, cache } from "react";
import { increment } from "@/app/db/action";
import { getViewCount } from "@/app/db/queries";
import ViewCounter from "@/components/ui/view-counter";
import type { Metadata } from "next";

export async function generateMetadata({
  params: { slug },
}: {
  params: { slug: string };
}): Promise<Metadata | undefined> {
  let post = getBlogPosts("tech").find((post) => post.slug == slug);

  if (!post) {
    return;
  }

  const {
    title,
    description,
    tags: keywords,
    publishedAt: publishedTime,
  } = post.metadata;
  let ogImage = `https://www.blan19.com/og?title=${title}`;

  return {
    title,
    description,
    keywords: keywords,
    openGraph: {
      title,
      description,
      publishedTime,
      type: "article",
      url: `https://www.blan19.com/blog/${post.slug}`,
      images: [
        {
          url: ogImage,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

const incrementView = cache(increment);

const View = async ({ slug }: { slug: string }) => {
  const view = await getViewCount(slug);
  incrementView(slug);
  return (
    <ViewCounter
      className="text-sm md:text-base dark:text-greyscale-4"
      view={view?.count ?? 0}
    />
  );
};

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
            <span className="text-base md:text-lg font-medium text-greyscale-7 dark:text-greyscale-5 tracking-tighter">
              #{tag}
            </span>
          </li>
        ))}
      </ul>
      <h1 className="font-medium text-3xl md:text-4xl tracking-tighter mb-3">
        {post.metadata.title}
      </h1>
      <div className="flex justify-between items-center my-4 mb-10">
        <p className="text-sm md:text-base dark:text-greyscale-4">
          {formatDate(post.metadata.publishedAt)}
        </p>
        <Suspense fallback={<p className="text-sm md:text-base">......</p>}>
          <View slug={post.slug} />
        </Suspense>
      </div>
      <Table contents={post.content} />
      <MDX contents={post.content} />
      <Comment />
    </section>
  );
};

export default Post;
