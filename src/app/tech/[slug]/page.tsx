import { notFound } from "next/navigation";
import type { Metadata } from "next";
import config from "@/lib/config";
import { getAdjacentPosts, getPost } from "@/lib/posts";
import { renderMarkdown } from "@/lib/markdown";
import { alternates, openGraph, postJsonLd } from "@/lib/seo";
import PostHeader from "@/components/ui/post-header";
import TocRail, { TocDetails } from "@/components/ui/toc";
import TocSpy from "@/components/ui/toc-spy";
import PostBody from "@/components/ui/post-body";
import PostReferences from "@/components/ui/post-references";
import RelatedPosts from "@/components/ui/related-posts";
import PrevNext from "@/components/ui/prev-next";
import Comment from "@/components/ui/comment";
import JsonLd from "@/components/ui/json-ld";

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

  const { title, description, tags, publishedAt, updatedAt } = post.metadata;

  return {
    title,
    description,
    keywords: tags,
    authors: [{ name: config.author.name, url: config.author.link }],
    alternates: alternates(`/tech/${post.slug}`),
    // twitter 는 layout 의 card 를 쓰고 제목·설명·이미지는 Next 가 openGraph 에서 채운다.
    openGraph: {
      ...openGraph({
        title,
        description,
        path: `/tech/${post.slug}`,
        imageTitle: title,
      }),
      type: "article",
      publishedTime: publishedAt,
      ...(updatedAt && { modifiedTime: updatedAt }),
      authors: [config.author.link],
      tags,
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
            <RelatedPosts post={post} />
            <PrevNext prev={prev} next={next} />
            <Comment key={post.slug} />
          </footer>
        </div>
      </article>
      <TocSpy items={toc} />
      <JsonLd data={postJsonLd(post)} />
    </div>
  );
};

export default Post;
