import generateSlug from "@/utils/generateSlug";

interface TableProps {
  contents: string;
}

const Table = ({ contents }: TableProps) => {
  const headings = contents
    .match(/###.*\n/g)
    ?.filter((heading) => heading.match(/#/g)?.length === 3);

  return (
    <div className="border border-greyscale-6 rounded p-4 mb-12">
      <summary className="flex gap-2 items-center">
        <span className="text-greyscale-0">
          <svg
            height={24}
            width={24}
            clipRule="evenodd"
            fillRule="evenodd"
            strokeLinejoin="round"
            strokeMiterlimit="2"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            className="fill-greyscale-5"
          >
            <path
              d="m7 17.75c0-.414.336-.75.75-.75h13.5c.414 0 .75.336.75.75s-.336.75-.75.75h-13.5c-.414 0-.75-.336-.75-.75zm-5-4c0-.414.336-.75.75-.75h18.5c.414 0 .75.336.75.75s-.336.75-.75.75h-18.5c-.414 0-.75-.336-.75-.75zm9-4c0-.414.336-.75.75-.75h9.5c.414 0 .75.336.75.75s-.336.75-.75.75h-9.5c-.414 0-.75-.336-.75-.75zm-7-4c0-.414.336-.75.75-.75h16.5c.414 0 .75.336.75.75s-.336.75-.75.75h-16.5c-.414 0-.75-.336-.75-.75z"
              fillRule="nonzero"
            />
          </svg>
        </span>{" "}
        <h4 className="text-greyscale-5 text-xl font-bold tracking-tighter">
          Table of Contents:
        </h4>
      </summary>
      <ol className="flex flex-col gap-1">
        {headings?.map((heading) => {
          const headingText = heading.replace("### ", "");
          const headingID = generateSlug(headingText);
          return (
            <li
              key={headingID}
              className="flex items-center gap-3 text-lg text-greyscale-5 pl-3"
            >
              <span className="text-3xl">·</span>
              <a
                className="underline underline-offset-4 hover:no-underline"
                href={`#${headingID}`}
              >
                {headingText}
              </a>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default Table;
