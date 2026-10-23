import { notFound } from "next/navigation";
import type { Metadata } from "next";
import config from "@/lib/config";
import { getAdjacentPosts, getPost } from "@/lib/posts";
import { renderMarkdown } from "@/lib/markdown";
import PostHeader from "@/components/ui/post-header";
import TocRail, { TocDetails } from "@/components/ui/toc";
import TocSpy from "@/components/ui/toc-spy";
import PostBody from "@/components/ui/post-body";
import PostReferences from "@/components/ui/post-references";
import PrevNext from "@/components/ui/prev-next";
import Comment from "@/components/ui/comment";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata | undefined> {
  const { slug } = await params;
  const post = getPost("tech", slug);

  if (!post) {
    return;
  }

  const {
    title,
    description,
    tags: keywords,
    publishedAt: publishedTime,
  } = post.metadata;
  // 알려진 이슈: title 을 인코딩하지 않는다.
  const ogImage = `${config.url}og?title=${title}`;

  return {
    title,
    description,
    keywords: keywords,
    openGraph: {
      title,
      description,
      publishedTime,
      type: "article",
      url: `${config.url}tech/${post.slug}`,
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

const Post = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  const post = getPost("tech", slug);

  if (!post) {
    notFound();
  }

  const { hast, toc } = await renderMarkdown(post.slug, post.content);
  const { prev, next } = getAdjacentPosts("tech", post.slug);

  return (
    <div className="site-wrap">
      <article className="rail-grid post-grid">
        <PostHeader post={post} />
        <TocRail items={toc} />
        <div className="rail-main post-main">
          <TocDetails items={toc} />
          <PostBody hast={hast} />
          <footer className="post-end">
            <PostReferences urls={post.metadata.reference} />
            <PrevNext prev={prev} next={next} />
            <Comment key={post.slug} />
          </footer>
        </div>
      </article>
      <TocSpy items={toc} />
    </div>
  );
};

export default Post;
