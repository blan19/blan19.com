import type { ReactNode } from "react";

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

export default function Home() {
  return (
    <section className="grid gap-12">
      <div>
        <h1 className="font-medium text-2xl mb-4 tracking-tighter">
          Welcome to My Tech Blog 👋
        </h1>
        <p className="w-full prose prose-neutral dark:prose-invert whitespace-pre-line">{`안녕하세요!\n인터렉티브 3D 웹 분야에서 전문가가 되길 원하는 개발자 '박준서' 입니다!\n블로그를 통해 3D 분야 뿐만아니라 다른 프론트엔드 생태계 등등 제가 배운 내용을 최대한 많은 분들과 공유하고 소통하고 싶습니다!\n블로그 글에서 부족한 부분이 보인다면 편하게 댓글로 부족한 부분을 짚어주세요 😀`}</p>
      </div>
      <div>
        <h1 className="font-medium text-2xl mb-4 tracking-tighter">
          최근 블로그 포스팅
        </h1>
        <div className="card">
          <p>아직 블로그 게시글이 존재하지 않아요 😢</p>
        </div>
      </div>
      <div>
        <h1 className="font-medium text-2xl mb-4 tracking-tighter">
          조회수가 가장 높은 블로그 포스팅
        </h1>
        <div className="card">
          <p>아직 블로그 게시글이 존재하지 않아요 😢</p>
        </div>
      </div>
      <div>
        <h1 className="font-medium text-2xl mb-4 tracking-tighter">
          저를 이곳에서 찾을 수 있어요 🙋‍♂️
        </h1>
        <ul className="flex gap-3">
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
          <li>
            <FindMeLink
              link="https://www.linkedin.com/in/junseo-park-976400236"
              name="링크드인"
            >
              <svg
                height="24"
                width="24"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 256 256"
              >
                <g fill="none">
                  <path
                    d="M0 18.338C0 8.216 8.474 0 18.92 0h218.16C247.53 0 256 8.216 256 18.338v219.327C256 247.79 247.53 256 237.08 256H18.92C8.475 256 0 247.791 0 237.668V18.335z"
                    fill="#069"
                  />
                  <path
                    d="M77.796 214.238V98.986H39.488v115.252H77.8zM58.65 83.253c13.356 0 21.671-8.85 21.671-19.91-.25-11.312-8.315-19.915-21.417-19.915-13.111 0-21.674 8.603-21.674 19.914 0 11.06 8.312 19.91 21.169 19.91h.248zM99 214.238h38.305v-64.355c0-3.44.25-6.889 1.262-9.346 2.768-6.885 9.071-14.012 19.656-14.012 13.858 0 19.405 10.568 19.405 26.063v61.65h38.304v-66.082c0-35.399-18.896-51.872-44.099-51.872-20.663 0-29.738 11.549-34.78 19.415h.255V98.99H99.002c.5 10.812-.003 115.252-.003 115.252z"
                    fill="#fff"
                  />
                </g>
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
          <li className="card">WebGL</li>
          <li className="card">Three.js</li>
          <li className="card">Next.js</li>
          <li className="card">Flutter</li>
          <li className="card">Opensource</li>
        </ul>
      </div>
    </section>
  );
}
