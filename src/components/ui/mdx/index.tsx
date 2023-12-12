import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import Image from "next/image";
import MDXRenderer from "react-markdown";
import remarkGfm from "remark-gfm";
import a11yDark from "react-syntax-highlighter/dist/cjs/styles/prism/a11y-dark";
import javascript from "react-syntax-highlighter/dist/cjs/languages/prism/javascript";
import jsx from "react-syntax-highlighter/dist/cjs/languages/prism/jsx";
import typescript from "react-syntax-highlighter/dist/cjs/languages/prism/typescript";
import tsx from "react-syntax-highlighter/dist/cjs/languages/prism/tsx";
import bash from "react-syntax-highlighter/dist/cjs/languages/prism/bash";
import type { ReactNode } from "react";

SyntaxHighlighter.registerLanguage("javascript", javascript);
SyntaxHighlighter.registerLanguage("jsx", jsx);
SyntaxHighlighter.registerLanguage("typescript", typescript);
SyntaxHighlighter.registerLanguage("tsx", tsx);
SyntaxHighlighter.registerLanguage("bash", bash);

interface MDXProps {
  contents: string;
}

const Code = ({
  className,
  children,
  ...props
}: {
  className?: string;
  children: ReactNode;
}) => {
  const hasLang = /language-(\w+)/.exec(className || "");

  return hasLang ? (
    <SyntaxHighlighter style={a11yDark} language={hasLang[1]}>
      {String(children).replace(/\n$/, "")}
    </SyntaxHighlighter>
  ) : (
    <code className={className} {...props}>
      `<span>{children}</span>`
    </code>
  );
};

const MDX = ({ contents }: MDXProps) => {
  return (
    <>
      <MDXRenderer
        className="mdx-renderer"
        remarkPlugins={[remarkGfm]}
        components={{
          code: ({ children, className }) => {
            return <Code className={className}>{children}</Code>;
          },
          p: (paragraph: { children?: ReactNode; node?: any }) => {
            const { node } = paragraph;

            if (node.children[0].tagName === "img") {
              const image = node.children[0];
              const metastring = image.properties.alt;
              const alt = metastring?.replace(/ *\{[^)]*\} */g, "");
              const metaWidth = metastring.match(/{([^}]+)x/);
              const metaHeight = metastring.match(/x([^}]+)}/);
              const width = metaWidth ? metaWidth[1] : "768";
              const height = metaHeight ? metaHeight[1] : "432";
              const isPriority = metastring?.toLowerCase().match("{priority}");
              const hasCaption = metastring
                ?.toLowerCase()
                .includes("{caption:");
              const caption = metastring?.match(/{caption: (.*?)}/)?.pop();

              return (
                <div className="container flex flex-col gap-2 justify-center items-center my-12">
                  <Image
                    src={image.properties.src}
                    width={width}
                    height={height}
                    alt={alt}
                    priority={isPriority}
                    className="rounded-lg"
                  />
                  {hasCaption ? (
                    <div
                      className="italic text-sm text-greyscale-5"
                      aria-label={caption}
                    >
                      {caption}
                    </div>
                  ) : null}
                </div>
              );
            }
            return <p>{paragraph.children}</p>;
          },
          a: ({ href, children }) => {
            if (href?.match("http")) {
              return (
                <a href={href} target="_blank" rel="noopener noreferrer">
                  {children}
                </a>
              );
            }
            return <a href={href}>{children}</a>;
          },
          h3: (props) => {
            const children = Array.isArray(props.children)
              ? props.children
              : [props.children];

            const heading = children
              .flatMap((element) =>
                typeof element === "string"
                  ? element
                  : element?.type !== undefined &&
                    typeof element.props.children === "string"
                  ? element.props.children
                  : typeof element === "object" &&
                    element.props?.children?.flatMap
                  ? element.props.children.flatMap((child: object) => {
                      if (typeof child === "string") return child;
                      return "";
                    })
                  : ""
              )
              .join("");

            const slug = heading.trim();

            return (
              <h3 id={slug}>
                <a href={`#${slug}`}>{props.children}</a>
              </h3>
            );
          },
        }}
      >
        {contents}
      </MDXRenderer>
    </>
  );
};

export default MDX;
