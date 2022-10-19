---
title: "과제프로젝트"
date: "2022-02"
github: "https://github.com/blan19/Next_shop_app"
url: ""
stack: ["React, Next, Firebase"]
deployment: ["Vercel"]
summary: "next.js 와 firebase 기반의 회원 인증, 어드민 페이지 (상품 추가/수정/삭제), 상품 결제 모듈이 포함된 쇼핑몰 웹앱"
thumbnail:
  ["숍_1.png", "숍_2.png", "숍_3.png", "숍_4.png", "숍_5.png", "숍_6.png"]
---

Next.js has two forms of pre-rendering: **Static Generation** and **Server-side Rendering**. The difference is in **when** it generates the HTML for a page.

- **Static Generation** is the pre-rendering method that generates the HTML at **build time**. The pre-rendered HTML is then _reused_ on each request.
- **Server-side Rendering** is the pre-rendering method that generates the HTML on **each request**.

Importantly, Next.js lets you **choose** which pre-rendering form to use for each page. You can create a "hybrid" Next.js app by using Static Generation for most pages and using Server-side Rendering for others.
