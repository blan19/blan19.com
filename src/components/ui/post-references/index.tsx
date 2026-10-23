import { PAGE_IDS } from "@/lib/page-ids";

interface PostReferencesProps {
  urls: readonly string[];
}

const safeDecode = (value: string) => {
  try {
    return decodeURI(value);
  } catch {
    return value;
  }
};

const splitUrl = (url: string) => {
  try {
    const { hostname, pathname, search, hash } = new URL(url);
    const rest = pathname + search + hash;
    return {
      host: hostname.replace(/^www\./, ""),
      path: rest === "/" ? "" : safeDecode(rest),
    };
  } catch {
    return { host: url, path: "" };
  }
};

const PostReferences = ({ urls }: PostReferencesProps) => {
  const list = urls?.filter(Boolean) ?? [];
  if (!list.length) return null;

  return (
    <section className="end-sec refs" aria-labelledby={PAGE_IDS.refLabel}>
      <h2 className="end-label" id={PAGE_IDS.refLabel}>
        참고 자료
      </h2>
      <ol>
        {list.map((url, i) => {
          const { host, path } = splitUrl(url);
          return (
            <li key={`${i}-${url}`}>
              <a href={url} target="_blank" rel="noopener noreferrer">
                <span className="rl">
                  <span className="host">{host}</span>
                  {path && <span className="path">{path}</span>}
                </span>
                <span className="arr" aria-hidden="true">
                  ↗
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </section>
  );
};

export default PostReferences;
