import { getBlogPosts, getPost } from "@/lib/posts";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og-image";

// 글마다 제목을 그린 OG 이미지. 모든 글을 빌드 때 PNG 로 만든다(요청 때 렌더하지 않는다).
// twitter:image 는 Next 가 og:image 를 그대로 물려받으므로 twitter-image 파일은 두지 않는다.
export const alt = "blan19 기술 블로그 글";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export const generateStaticParams = () =>
  getBlogPosts("tech").map((post) => ({ slug: post.slug }));

const Image = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  const post = getPost("tech", slug);
  if (!post) return new Response("Not Found", { status: 404 });
  return renderOgImage(post.metadata.title, "tech");
};

export default Image;
