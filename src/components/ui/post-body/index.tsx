import type { Root } from "hast";
import type { Components, ExtraProps } from "hast-util-to-jsx-runtime";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import Link from "next/link";
import type { ComponentProps } from "react";
import { Fragment } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import Callout from "@/components/ui/callout";
import CodeBlock from "@/components/ui/code-block";
import Mermaid from "@/components/ui/mermaid";
import PostImage from "@/components/ui/post-image";
import { site } from "@/lib/config";
import {
  decodeCallout,
  decodeCodeFigure,
  decodeDiagramFigure,
  decodeImageFigure,
} from "@/lib/markdown/figures";
import {
  hasClass,
  isFootnoteBackref,
  isFootnoteRef,
} from "@/lib/markdown/hast-utils";

interface PostBodyProps {
  hast: Root;
}

// 플러그인이 만든 figure 를 데이터(figures.ts)대로 컴포넌트로 바꾼다.
const Figure = ({
  node,
  children,
  ...props
}: ComponentProps<"figure"> & ExtraProps) => {
  if (node) {
    const code = decodeCodeFigure(node);
    if (code) return <CodeBlock {...code}>{children}</CodeBlock>;
    const image = decodeImageFigure(node);
    if (image) return <PostImage {...image} />;
    const diagram = decodeDiagramFigure(node);
    if (diagram) return <Mermaid {...diagram} />;
  }
  return <figure {...props}>{children}</figure>;
};

const Aside = ({
  node,
  children,
  ...props
}: ComponentProps<"aside"> & ExtraProps) => {
  const type = node && decodeCallout(node);
  if (type) return <Callout type={type}>{children}</Callout>;
  return <aside {...props}>{children}</aside>;
};

const sitePath = (href: string) => {
  for (const origin of site.origins) {
    if (href === origin) return "/";
    if (href.startsWith(`${origin}/`) || href.startsWith(`${origin}?`) || href.startsWith(`${origin}#`)) {
      const path = href.slice(origin.length);
      return path.startsWith("/") ? path : `/${path}`;
    }
  }
  return undefined;
};

const Anchor = ({
  node,
  children,
  href,
  ...props
}: ComponentProps<"a"> & ExtraProps) => {
  const special =
    node !== undefined &&
    (isFootnoteRef(node) || isFootnoteBackref(node) || hasClass(node, "anchor"));
  if (special || !href) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  }
  const path = sitePath(href);
  if (path !== undefined) {
    return (
      <Link href={path} {...props}>
        {children}
      </Link>
    );
  }
  if (/^https?:\/\//i.test(href)) {
    return (
      <a
        href={href}
        {...props}
        className={props.className ? `${props.className} ext` : "ext"}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    );
  }
  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
};

// 문단 중간 이미지(그림이 아닌 것)는 지연 로드하는 일반 img 로 둔다.
const InlineImage = ({
  node,
  alt,
  ...props
}: ComponentProps<"img"> & ExtraProps) => {
  void node;
  // eslint-disable-next-line @next/next/no-img-element
  return <img alt={alt ?? ""} loading="lazy" decoding="async" {...props} />;
};

const components: Partial<Components> = {
  figure: Figure,
  aside: Aside,
  a: Anchor,
  img: InlineImage,
};

const PostBody = ({ hast }: PostBodyProps) => {
  return (
    <div className="post-body" id="post-body">
      {toJsxRuntime(hast, {
        Fragment,
        jsx,
        jsxs,
        components,
        passKeys: true,
        passNode: true,
        ignoreInvalidStyle: true,
      })}
    </div>
  );
};

export default PostBody;
