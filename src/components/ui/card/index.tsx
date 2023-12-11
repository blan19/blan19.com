import type { ReactNode } from "react";

interface CardProps {
  title: string;
  tags: string[];
  date: string;
  children: ReactNode;
}

const Card = ({ title, tags, date, children }: CardProps) => {
  return (
    <div className="card flex flex-col items-start">
      <h1 className="font-medium text-xl mb-1 tracking-tighter">{title}</h1>
      <div className="flex gap-1">
        <span className="text-sm text-greyscale-7 dark:text-greyscale-2">
          {date},
        </span>
        {children}
      </div>
      <ol className="flex gap-2">
        {tags.map((tag) => (
          <li key={tag}>
            <span className="text-sm text-greyscale-7 dark:text-greyscale-2">{`#${tag}`}</span>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default Card;
