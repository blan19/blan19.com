import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { author } from "@/lib/config";
import { alternates, openGraph } from "@/lib/metadata";
import { getAdjacentPosts, getBlogPosts, getPost } from "@/lib/posts";
import { renderMarkdown } from "@/lib/markdown";
import { postJsonLd } from "@/lib/json-ld";
import PostHeader from "@/components/ui/post-header";
import TocRail, { TocDetails } from "@/components/ui/toc";
import TocSpy from "@/components/ui/toc-spy";
import PostBody from "@/components/ui/post-body";
import PostReferences from "@/components/ui/post-references";
import RelatedPosts from "@/components/ui/related-posts";
import PrevNext from "@/components/ui/prev-next";
import Comment from "@/components/ui/comment";
import JsonLd from "@/components/ui/json-ld";

// 모든 글을 빌드 때 prerender 한다. 조회수(ArticleViews)만 요청 때 채우는 구멍이다.
// 목록에 없는 slug 는 src/proxy.ts 가 루트 404 로 돌려 여기 오지 않는다. 그래도 오면(dev, 빌드 뒤 추가된 글) 요청 때 렌더되고
// notFound() 로 404 가 되지만 Next 의 오류 셸(lang, 본문 없음)이다(Cache Components 는 dynamicParams 를 쓰지 않는다).
// params 는 Suspense 밖(페이지 맨 위)에서 await 해 첫 응답이 렌더 완료를 기다리게 한다(그래야 404 상태 코드가 나간다).
export const generateStaticParams = () =>
  getBlogPosts("tech").map((post) => ({ slug: post.slug }));

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
  const path = `/tech/${post.slug}`;
  // og:image 는 같은 폴더의 opengraph-image.tsx 가 채운다(파일 규칙이 우선).
  // twitter 는 layout 의 card 를 물려받고 제목, 설명, 이미지는 Next 가 openGraph 에서 채운다.
  return {
    title,
    description,
    keywords: [...tags],
    authors: [{ name: author.name, url: author.link }],
    alternates: alternates(path),
    openGraph: {
      ...openGraph(path, title, description),
      type: "article",
      publishedTime: publishedAt,
      ...(updatedAt && { modifiedTime: updatedAt }),
      authors: [author.link],
      tags: [...tags],
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
