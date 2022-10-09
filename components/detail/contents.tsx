import ReactMarkdown from "react-markdown";
import styled from "styled-components";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { a11yDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import remarkGfm from "remark-gfm";

interface Props {
  markdown: string;
}

const Content = ({ markdown }: Props) => {
  return (
    <MarkDownRenderer
      remarkPlugins={[remarkGfm]}
      components={{
        code: ({ node, inline, className, children, ...props }) => {
          const match = /language-(\w+)/.exec(className || "");
          return inline ? (
            <Highlight {...props}>{children}</Highlight>
          ) : match ? (
            <SyntaxHighlighter
              style={a11yDark as {}}
              language={match[1]}
              PreTag="div"
              {...props}
            >
              {String(children).replace(/\n$/, "")}
            </SyntaxHighlighter>
          ) : (
            <SyntaxHighlighter
              style={a11yDark as {}}
              language="textile"
              PreTag="div"
              {...props}
            >
              {String(children).replace(/\n$/, "")}
            </SyntaxHighlighter>
          );
        },
      }}
    >
      {markdown}
    </MarkDownRenderer>
  );
};

export default Content;

const Highlight = styled.code`
  background-color: ${({ theme }) => theme.colors.gray_2};
  color: ${({ theme }) => theme.colors.primary};
  font-weight: ${({ theme }) => theme.fontWeight.regular};
  font-size: ${({ theme }) => theme.fontSize.body2r_pc};
  padding: 0.25rem;
  border-radius: 5px;
`;

const MarkDownRenderer = styled(ReactMarkdown)`
  line-height: 1.75rem;
  font-weight: ${({ theme }) => theme.fontWeight.regular};
  font-size: ${({ theme }) => theme.fontSize.body2r_pc};

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
    margin-top: 3rem;
  }
  hr + h1,
  hr + h2,
  hr + h3 {
    margin-top: 0;
  }
  h1 {
    font-size: ${({ theme }) => theme.fontSize.title_mobile};
  }
  h2 {
    font-size: ${({ theme }) => theme.fontSize.subtitle1_pc};
  }
  h3 {
    font-size: ${({ theme }) => theme.fontSize.subtitle2r_pc};
  }

  p {
    padding: 0.3rem 0;
    color: ${(props) => props.theme.colors.font};
  }

  ol,
  ul {
    padding: 1.5rem 0;
    list-style: none;
  }
  li::before {
    content: "# ";
    color: ${(props) => props.theme.colors.primary};
  }

  blockquote {
    margin: 30px 0;
    padding: 5px 15px;
    border-left: 2px solid ${({ theme }) => theme.colors.primary};
    font-weight: ${({ theme }) => theme.fontWeight.bold};
    background-color: ${({ theme }) => theme.colors.gray_2};
  }

  hr {
    border: 1px solid ${(props) => props.theme.colors.sub};
    margin: 2.5rem 0;
  }

  a {
    color: ${({ theme }) => theme.colors.primary};
    text-decoration: underline;
  }

  img {
    width: 100%;
    padding: 3rem 0;
  }
`;
