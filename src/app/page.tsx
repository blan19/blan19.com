import { Suspense, type ReactNode } from "react";
import { unstable_noStore as noStore } from "next/cache";
import {
  getBestBlogPosts,
  getLatestBlogPosts,
  getViewCount,
} from "@/app/db/queries";
import { getBlogPosts } from "@/app/db/blog";
import Card from "@/components/ui/card";
import Link from "next/link";
import ViewCounter from "@/components/ui/view-counter";

const ArrowIcon = () => {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2.07102 11.3494L0.963068 10.2415L9.2017 1.98864H2.83807L2.85227 0.454545H11.8438V9.46023H10.2955L10.3097 3.09659L2.07102 11.3494Z"
        fill="currentColor"
      />
    </svg>
  );
};

const Skeleton = () => {
  return (
    <div className="border border-greyscale-5 dark:border-greyscale-7 shadow rounded-md p-4 w-full">
      <div className="animate-pulse flex space-x-4">
        <div className="w-[50%] space-y-6 py-1">
          <div className="h-2 bg-greyscale-5 dark:bg-greyscale-7 rounded"></div>
          <div className="w-[50%] space-y-3">
            <div className="grid grid-cols-3 gap-4">
              <div className="h-2 bg-greyscale-5 dark:bg-greyscale-7 rounded col-span-2"></div>
              <div className="h-2 bg-greyscale-5 dark:bg-greyscale-7 rounded col-span-1"></div>
            </div>
            <div className="h-2 bg-greyscale-5 dark:bg-greyscale-7 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FindMeLink = ({
  children,
  link,
  name,
}: {
  children: ReactNode;
  link: string;
  name: string;
}) => {
  return (
    <a
      className="group card flex gap-5"
      rel="noopener noreferrer"
      target="_blank"
      href={link}
    >
      <div className="flex gap-1">
        {children}
        <p>{name}</p>
      </div>
      <div className="transform transition-transform duration-300 group-hover:-rotate-12">
        <ArrowIcon />
      </div>
    </a>
  );
};

const View = async ({ slug }: { slug: string }) => {
  const view = await getViewCount(slug);

  return (
    <ViewCounter
      className="text-xs md:text-sm text-greyscale-7 dark:text-greyscale-2"
      view={view?.count ?? 0}
    />
  );
};

const Blogs = async ({
  type,
  posts,
}: {
  type: "latest" | "best";
  posts: ReturnType<typeof getBlogPosts>;
}) => {
  noStore();
  let blogs: Awaited<ReturnType<typeof getLatestBlogPosts>>;
  if (type === "latest") blogs = await getLatestBlogPosts();
  else blogs = await getBestBlogPosts();

  if (!blogs.length)
    return (
      <div className="card">
        <p>아직 블로그 게시글이 존재하지 않아요 😢</p>
      </div>
    );

  return (
    <ul className="flex flex-col gap-4">
      {blogs
        .map((blog) => posts.find((post) => blog.slug === post.slug))
        .map((blog) => (
          <li key={blog!.slug}>
            <Link href={`/tech/${blog!.slug}`}>
              <Card
                title={blog!.metadata.title}
                tags={blog!.metadata.tags}
                date={blog!.metadata.publishedAt}
              >
                <View slug={blog!.slug} />
              </Card>
            </Link>
          </li>
        ))}
    </ul>
  );
};

export default function Home() {
  const posts = getBlogPosts("tech");

  return (
    <section className="grid gap-12">
      <div>
        <h1 className="font-medium text-2xl mb-4 tracking-tighter">
          Welcome to My Tech Blog 👋
        </h1>
        <p className="w-full prose prose-neutral dark:prose-invert whitespace-pre-line">{`안녕하세요!\nSoftware Enginner '박준서' 입니다.\n블로그를 통해 제가 관심 있어 하거나 새롭게 배운 내용을 많은 분과 공유하고 소통하는 것이 제 목표입니다!\n글에서 부족한 부분이 보인다면 편하게 댓글로 부족한 부분을 짚어주세요\n함께 성장하고 발전하는 공간이 되었으면 합니다 😀`}</p>
      </div>
      <div>
        <h1 className="font-medium text-2xl mb-4 tracking-tighter">
          최근 블로그 포스팅
        </h1>
        <Suspense fallback={<Skeleton />}>
          <Blogs type="latest" posts={posts} />
        </Suspense>
      </div>
      <div>
        <h1 className="font-medium text-2xl mb-4 tracking-tighter">
          조회수가 가장 높은 블로그 포스팅
        </h1>
        <Suspense fallback={<Skeleton />}>
          <Blogs type="best" posts={posts} />
        </Suspense>
      </div>
      <div className="flex justify-center">
        <Link href="/tech" className="animate-bounce relative flex flex-col">
          <div className="flex items-center gap-2">
            <p>전체 게시글 보기</p>
            <ArrowIcon />
          </div>
          <div className="absolute w-full h-[1px] top-6 inset-0 bg-greyscale-5 dark:bg-greyscale-7" />
        </Link>
      </div>
      <div>
        <h1 className="font-medium text-2xl mb-4 tracking-tighter">
          저를 이곳에서 찾을 수 있어요 🙋‍♂️
        </h1>
        <ul className="flex gap-3">
          <li>
            <FindMeLink
              link="mailto:oponize@naver.com"
              name="oponize@naver.com"
            >
              <div />
            </FindMeLink>
          </li>
          <li>
            <FindMeLink link="https://github.com/blan19" name="깃허브">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </FindMeLink>
          </li>
        </ul>
      </div>
      <div>
        <h1 className="font-medium text-2xl mb-4 tracking-tighter">
          현재 내가 빠져있는 것들 💘
        </h1>
        <ul className="flex gap-3 whitespace-pre-wrap flex-wrap">
          <li className="card">Typescript</li>
          <li className="card">Rust</li>
          <li className="card">WebGL</li>
          <li className="card">Next.js</li>
          <li className="card">Flutter</li>
          <li className="card">Opensource</li>
        </ul>
      </div>
    </section>
  );
}
