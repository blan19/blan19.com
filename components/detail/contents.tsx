import ReactMarkdown from "react-markdown";
import styled from "styled-components";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface Props {
  markdown: string;
}

const Content = ({ markdown }: Props) => {
  return (
    <ReactMarkdown
      components={{
        code: ({ node, inline, className, children, ...props }) => {
          const match = /language-(\w+)/.exec(className || "");
          return !inline && match ? (
            <SyntaxHighlighter
              style={dark}
              language={match[1]}
              PreTag="div"
              {...props}
            >
              {String(children).replace(/\n$/, "")}
            </SyntaxHighlighter>
          ) : (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
      }}
    >
      {markdown}
    </ReactMarkdown>
  );
};

export default Content;

const MdxRenderer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  margin: 0 auto;
  word-break: break-all;
  line-height: 1.8;
  font-size: 1.15rem;
  font-weight: 400;
  p {
    padding: 0.3rem 0;
    color: ${(props) => props.theme.colors.font};
  }
  h1,
  h2,
  h3 {
    font-weight: 600;
    margin-bottom: 3rem;
    color: ${(props) => props.theme.colors.font};
  }
  * + h1,
  * + h2,
  * + h3 {
    margin-top: 8rem;
  }
  hr + h1,
  hr + h2,
  hr + h3 {
    margin-top: 0;
  }
  h1 {
    font-size: 2.5rem;
  }
  h2 {
    font-size: 2rem;
  }
  h3 {
    font-size: 1.5rem;
  }
  // Adjust Quotation Element Style
  blockquote {
    margin: 30px 0;
    padding: 5px 15px;
    border-left: 2px solid #8c5be9;
    font-weight: 600;
  }
  // Adjust List Element Style
  ol,
  ul {
    padding: 3rem 0;
    list-style: none;
  }
  li::before {
    content: "# ";
    color: ${(props) => props.theme.colors.primary};
  }
  hr {
    border: 1px solid ${(props) => props.theme.colors.sub};
    margin: 10rem 0;
  }
  a {
    color: #8c5be9;
    text-decoration: underline;
  }
  pre[class*="language-"] {
    margin: 30px 0;
    padding: 1.5rem;
    font-size: 1.25rem;
    ::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.5);
      border-radius: 3px;
    }
  }
  code[class*="language-"],
  pre[class*="language-"] {
    tab-size: 2;
  }
  img {
    width: 100%;
  }
`;
