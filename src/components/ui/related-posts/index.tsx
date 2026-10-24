import { getPostsNewestFirst } from "@/lib/posts";
import type { Post } from "@/lib/posts";
import { PAGE_IDS } from "@/lib/page-ids";
import PostRow from "@/components/ui/post-row";

interface RelatedPostsProps {
  post: Post;
}

const LIMIT = 3;

// 글 끝 "관련 글": 태그가 겹치는 tech 글을 겹친 태그 수 내림차순, 같으면 목록 순서(최신순)로 최대 3개.
// 파일시스템만 읽는다(DB 없음). 겹치는 글이 없으면 섹션째 그리지 않는다. 행은 홈 목록과 같은 PostRow 다.
const RelatedPosts = ({ post }: RelatedPostsProps) => {
  const tags = new Set(post.metadata.tags);
  if (tags.size === 0) return null;

  const related = getPostsNewestFirst("tech")
    .filter((other) => other.slug !== post.slug)
    .map((other) => ({
      other,
      shared: new Set(other.metadata.tags.filter((tag) => tags.has(tag))).size,
    }))
    .filter(({ shared }) => shared > 0)
    // sort 는 안정 정렬이라 겹친 수가 같으면 최신순이 유지된다.
    .sort((a, b) => b.shared - a.shared)
    .slice(0, LIMIT);

  if (related.length === 0) return null;

  return (
    <section className="end-sec" aria-labelledby={PAGE_IDS.relatedLabel}>
      <h2 className="end-label" id={PAGE_IDS.relatedLabel}>
        관련 글
      </h2>
      <ol className="idx-list">
        {related.map(({ other }) => (
          <PostRow
            key={other.slug}
            post={other}
            date="full"
            desc="desktop"
            views={false}
          />
        ))}
      </ol>
    </section>
  );
};

export default RelatedPosts;
