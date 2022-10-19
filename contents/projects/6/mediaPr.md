---
title: "MediaPR"
date: "2022-06"
github: "https://github.com/blan19/Media_PR"
url: ""
stack: ["React, Next, Three.js"]
deployment: ["Vercel"]
summary: "미디어 컨텐츠 웹개발 전공 시간에 React에서 3D 웹 개발에 대한 주제로 발표를 하기 위해 만들었습니다."
thumbnail: ["pr_1.gif", "pr_2.gif", "pr_3.gif"]
---

Next.js has two forms of pre-rendering: **Static Generation** and **Server-side Rendering**. The difference is in **when** it generates the HTML for a page.

- **Static Generation** is the pre-rendering method that generates the HTML at **build time**. The pre-rendered HTML is then _reused_ on each request.
- **Server-side Rendering** is the pre-rendering method that generates the HTML on **each request**.

Importantly, Next.js lets you **choose** which pre-rendering form to use for each page. You can create a "hybrid" Next.js app by using Static Generation for most pages and using Server-side Rendering for others.
