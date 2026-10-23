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
import PostTags from "@/components/ui/post-tags";
import AuthorCard from "@/components/ui/author-card";
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
      <article className="site-col article">
        <PostHeader post={post} />
        <TocDetails items={toc} />
        <div className="post-layout">
          <TocRail items={toc} />
          <PostBody hast={hast} />
        </div>
        <PostReferences urls={post.metadata.reference} />
        <section className="end-sec" aria-label="태그와 공유">
          <PostTags tags={post.metadata.tags} />
          <AuthorCard />
          <PrevNext prev={prev} next={next} />
        </section>
        <Comment key={post.slug} />
      </article>
      <TocSpy items={toc} />
    </div>
  );
};

export default Post;
