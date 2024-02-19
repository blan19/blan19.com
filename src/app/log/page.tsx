import { getBlogPosts } from "@/app/db/blog";

const Log = () => {
  const posts = getBlogPosts("log");

  return (
    <section>
      <h1 className="font-medium text-2xl mb-4 tracking-tighter">Log.</h1>
      <p className="w-full prose prose-neutral dark:prose-invert whitespace-pre-line">
        a log about my thoughts, feelings, lessons, etc...
      </p>
      <div className="w-full h-[0.5px] rounded bg-greyscale-3 my-7" />
      <ul className="flex flex-col gap-8 pt-7">
        {posts.reverse().map(({ metadata, slug, content }) => (
          <li key={slug}>
            <div className="card flex flex-col items-start">
              <h1 className="font-medium  text-lg md:text-xl mb-1 tracking-tighter">
                {metadata.title}
              </h1>
              <div className="flex gap-1">
                <span className="text-xs md:text-sm text-greyscale-7 dark:text-greyscale-2">
                  {metadata.publishedAt}
                </span>
              </div>
              <p className="w-full whitespace-pre-line text-greyscale-7 dark:text-greyscale-2">
                {content}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default Log;
