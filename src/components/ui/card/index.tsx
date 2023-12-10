interface CardProps {
  title: string;
  tags: string[];
  date: string;
  view: number;
}

const Card = ({ title, tags, date, view }: CardProps) => {
  return (
    <div className="card flex flex-col items-start">
      <h1 className="font-medium text-xl mb-1 tracking-tighter">{title}</h1>
      <div className="flex gap-1">
        <span className="text-sm text-greyscale-7 dark:text-greyscale-8">
          {date},
        </span>
        <span className="text-sm text-greyscale-7 dark:text-greyscale-8">
          {view.toLocaleString("ko-KR")} views
        </span>
      </div>
      <ol className="flex gap-2">
        {tags.map((tag) => (
          <li key={tag}>
            <span className="text-sm text-greyscale-7 dark:text-greyscale-8">{`#${tag}`}</span>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default Card;
