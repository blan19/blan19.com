import Link from "next/link";
import CopyLink from "@/components/ui/copy-link";

interface PostTagsProps {
  tags: string[];
}

const PostTags = ({ tags }: PostTagsProps) => {
  return (
    <div className="tag-row">
      {tags.map((tag) => (
        <Link
          key={tag}
          className="tag-chip"
          href={`/tech?tag=${encodeURIComponent(tag)}`}
        >
          #{tag}
        </Link>
      ))}
      <CopyLink />
    </div>
  );
};

export default PostTags;
