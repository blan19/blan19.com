import type { Element, Root } from "hast";
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
import { hasClass } from "@/lib/markdown/hast-utils";
import type { CalloutType } from "@/lib/markdown/types";

interface PostBodyProps {
  hast: Root;
}

const SITE_ORIGINS = ["https://www.blan19.xyz", "https://blan19.xyz"];
const CALLOUT_TYPES: CalloutType[] = ["note", "tip", "important", "warning", "caution"];

const prop = (node: Element | undefined, name: string) => {
  const value = node?.properties[name];
  return value === undefined || value === null ? undefined : String(value);
};

const flag = (node: Element | undefined, name: string) =>
  node?.properties[name] !== undefined;

const Figure = ({
  node,
  children,
  ...props
}: ComponentProps<"figure"> & ExtraProps) => {
  if (node && hasClass(node, "code-block")) {
    return (
      <CodeBlock
        lang={prop(node, "dataLang") ?? "text"}
        title={prop(node, "dataTitle")}
        lines={Number(prop(node, "dataLines") ?? 0)}
        lineNumbers={flag(node, "dataLn")}
        diff={flag(node, "dataDiff")}
        prompt={flag(node, "dataPrompt")}
        collapsible={flag(node, "dataCollapsible")}
        wide={flag(node, "dataWide")}
      >
        {children}
      </CodeBlock>
    );
  }
  if (node && hasClass(node, "img-fig")) {
    return (
      <PostImage
        src={prop(node, "dataSrc") ?? ""}
        alt={prop(node, "dataAlt") ?? ""}
        width={Number(prop(node, "dataWidth") ?? 768)}
        height={Number(prop(node, "dataHeight") ?? 432)}
        priority={flag(node, "dataPriority")}
        caption={prop(node, "dataCaption")}
      />
    );
  }
  if (node && hasClass(node, "diagram")) {
    return (
      <Mermaid
        code={prop(node, "dataMermaid") ?? ""}
        caption={prop(node, "dataCaption")}
      />
    );
  }
  return <figure {...props}>{children}</figure>;
};

const Aside = ({
  node,
  children,
  ...props
}: ComponentProps<"aside"> & ExtraProps) => {
  const type = prop(node, "dataType");
  if (node && hasClass(node, "callout")) {
    const calloutType = CALLOUT_TYPES.find((value) => value === type) ?? "note";
    return <Callout type={calloutType}>{children}</Callout>;
  }
  return <aside {...props}>{children}</aside>;
};

const sitePath = (href: string) => {
  for (const origin of SITE_ORIGINS) {
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
    flag(node, "dataFootnoteRef") ||
    flag(node, "dataFootnoteBackref") ||
    (node !== undefined && hasClass(node, "anchor"));
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
