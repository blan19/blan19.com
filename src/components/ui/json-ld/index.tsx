interface JsonLdProps {
  data: object;
}

// `<` 를 이스케이프해 글 제목 같은 문자열이 </script> 로 태그를 닫지 못하게 한다(Next JSON-LD 가이드).
const JsonLd = ({ data }: JsonLdProps) => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify(data).replace(/</g, "\\u003c"),
    }}
  />
);

export default JsonLd;
