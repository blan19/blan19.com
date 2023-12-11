const Footer = () => {
  return (
    <footer className="bg-greyscale-1 dark:bg-greyscale-8  mt-20">
      <div className="responsive flex justify-between py-10">
        <div className="flex flex-col justify-between">
          <h2 className="text-xl font-medium tracking-tighter italic">
            blan19.com
          </h2>
          <p className="text-xs italic">Copyright © 2023 — blan19</p>
        </div>
        <div>
          <p className="font-medium">POWERED BY</p>
          <div className="w-full h-[1px] bg-greyscale-5 my-3" />
          <ul className="flex flex-col gap-3 text-sm">
            <li>
              <span>Next.js</span>
            </li>
            <li>
              <span>Tailwind</span>
            </li>
            <li>
              <span>Prisma</span>
            </li>
            <li>
              <span>Vercel</span>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
