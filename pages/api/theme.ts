import { NextApiRequest, NextApiResponse } from "next";
import { setCookie, hasCookie, getCookie } from "cookies-next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (hasCookie("theme", { req, res })) {
      const theme = getCookie("theme", { req, res });
      if (theme === "light") {
        setCookie("theme", "dark", {
          req,
          res,
          maxAge: 24 * 60 * 60,
        });
      } else
        setCookie("theme", "light", {
          req,
          res,
          maxAge: 24 * 60 * 60,
        });
    } else {
      setCookie("theme", "dark", {
        req,
        res,
        maxAge: 24 * 60 * 60,
      });
    }
    return res.status(200).end();
  } catch (e) {
    return res.status(500).send(e);
  }
}
