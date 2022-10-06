---
date: "2022-04-07"
title: "Electron으로 일정 공유 앱 만드는 과정의 기록들 - 2"
creater: "blan19"
categories: ["Typescript", "React", "Electron"]
summary: "Electron Forge를 사용하여 Electron + Webpack + React + Typescript 환경에서 앱을 만들어보자"
thumbnail: "./electron.png"
---

## Electron 일정 공유 앱을 만들어 보자 - 2

> 일정을 서로 공유하는 우리만의 데스크톱 앱을 만들어보자! 하고 시작된 일렉트론 개발 기록

### Full Calendar

일정 공유 앱인 만큼 캘린더를 통해 일정을 만드는 등의 이벤트를 만들 필요가 있었습니다.
빠른 개발을 위해 캘린더 라이브러리를 찾아보았고 그 중에서 Full Calendar라는 라이브러리를 선택하게 되었습니다

1. Full Calendar의 무료 정책인 standard 정도면 충분했고, 드래깅 이벤트등 지원해주는 것이 많았습니다
2. React + Typescript 등 지원이 되어있어 프로젝트에 적용이 쉬웠습니다. 업데이트가 2년 전이긴 했지만 충분했습니다
3. State 관리가 쉬웠고, 그것을 통한 이벤트 관리가 수월했습니다

```
npm install --save @fullcalendar/react @fullcalendar/daygrid
```

```tsx
import React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import styled from "styled-components";

const CalendarEvent = () => {
  return (
    <CalendarEventContainer>
      <FullCalendar plugins={[dayGridPlugin]} initialView="dayGridMonth" />
    </CalendarEventContainer>
  );
};

export default CalendarEvent;

const CalendarEventContainer = styled.section`
  width: 55rem;
  padding: 0 15px;
  margin-top: 5px;

  /* calendar-root */
  .fc {
    width: 100%;
  }

  /* calendar-title */
  .fc-toolbar-title {
    font-size: 20px !important;
    color: #495057 !important;
  }

  /* calendar-daygrid */
  .fc-daygrid {
    margin-top: 10px;
  }
`;
```

간단하게 컴포넌트로 가져와 적용을 쉽게 할 수 있습니다

<img width="100%" alt="Electron" src="https://user-images.githubusercontent.com/66871265/162196920-d5588157-7b7e-4d6a-8bb8-f02c416d019a.png">

적용 후 뷰입니다

### Heroku + Strapi

Full Calendar를 통해 이벤트 리스트를 만들면, 그 이벤트 데이터를 관리해줄 서버가 필요했습니다.

빠르게 프로젝트를 완성할 필요가 있었으므로 호스팅은 Heroku를 통해 하고, CRUD를 편리하게 관리해주는 Strapi가 안성 맞춤이라고 생각하여
이번 프로젝트에서 처음으로 적용해보기로 하였습니다.

Database는 Postgre를 사용할 예정입니다!

Heroku에 Strapi를 Deploy 시키는 과정은 공식문서를 참고하여 진행하였습니다 [공식문서](https://docs.strapi.io/developer-docs/latest/setup-deployment-guides/deployment/hosting-guides/heroku.html#heroku-postgres)

> 제가 Mac 환경에서 진행하는 점 양해부탁드립니다..!

1. Heroku CLI Installation

heroku-cli 설치가 안되어 있다면 먼저 설치가 필요합니다

```
brew tap heroku/brew && brew install heroku
```

2. Login to Heroku from your CLI

설치 후 cli를 통해 로그인을 진행해줍니다

```
heroku login
```

3. Create a new project (or use an existing one)

이후 strapi 프로젝트를 만들어 줍시다!

```
yarn create strapi-app my-project
```

strapi의 디폴트 데이터 베이스는 SQLite database 이므로 Custom -> postgre를 선택하여 진행해줍니다

4. Update .gitignore

프로젝트를 셋업했다면 .gitignore를 업데이트 해줍니다

```
// Path: ./my-project/.gitignore

package-lock.json
```

gitignore에 추가하지 않는다면 이슈가 발생할 수 있다고 합니다

5. Init a Git repository and commit your project

heroku에 push를 위해 깃 레퍼지토리를 만들어 줍니다

```
cd my-project
git init
git add .
git commit -m "Initial Commit"
```

6. Create a Heroku project

heroku에서 아직 앱을 만들지 않았다면 아래 명령어로 만들어줍시다

```
heroku create

```

이미 앱이 존재한다면

```
heroku git:remote -a your-heroku-app-name
```

7. Heroku Database set-up

저는 무료 플랜인 hobby plan을 사용 할 것이기 때문에 다른 플랜을 사용하신다면 Heroku에서 참고하시면 될 것 같습니다!

heroku 앱에 postgre db를 추가해 줍니다

```
// Path: ./my-project/

heroku addons:create heroku-postgresql:hobby-dev
```

```
heroku config
```

위 명령어로 db 주소가 뜰텐데

`postgres:// USERNAME : PASSWORD @ HOST : PORT / DATABASE_NAME`로 해석하시면 됩니다..!

8. Set Database variables automatically

호스팅시 변경 되는 DATABASE_URL 환겨 변수를 자동화를 해봅시다

```
yarn add pg-connection-string
```

이후 프로덕션을 위한 데이터베이스 구성 파일을 만들어 줍니다

`./config` 에 `/env/production` 를 만들어 주고 `database.js`라는 파일을 production 폴더에 생성해줍니다

프로덕션 환경에서의 데이터베이스 파일을 만들기 위함입니다

```js
// Path: ./config/env/production/database.js

const parse = require("pg-connection-string").parse;
const config = parse(process.env.DATABASE_URL);

module.exports = ({ env }) => ({
  connection: {
    client: "postgres",
    connection: {
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      ssl: {
        rejectUnauthorized: false,
      },
    },
    debug: false,
  },
});
```

그리고 heroku-cli를 통해
새 데이터베이스 구성 파일이 사용되도록 NODE_ENV 설정을 heroku-cli 에서 설정합니다

```
heroku config:set NODE_ENV=production
```

9. Create your Strapi server config for production

프로덕션 서버 config를 위해 스트라피 서버를 만들어줍니다

```js
// Path: ./config/env/production/server.js
module.exports = ({ env }) => ({
  url: env("MY_HEROKU_URL"),
});
```

heroku app url을 등록해줍니다

```
heroku config:set MY_HEROKU_URL=$(heroku info -s | grep web_url | cut -d= -f2)

```

10. Install the pg node module

postgre db를 위한 모듈을 설치해줍니다

```
yarn add pg
```

11. APP KEYS

strapi 사용을 위한 앱 키를 환경 변수로 등록해줍니다

```
heroku config:set APP_KEYS=someSecret,anotherSecret
```

12. Commit your changes

```
git add .
git commit -m "Update database config"
yarn install
git add yarn.lock
git commit -m "yarn lockfile updated"
git push heroku HEAD:main
```

서버 호스팅에 성공하면 heroku-cli를 통해 브라우저창을 띄어줘서 확인해 봅시다!

```
heroku open
```

이후 성공했다면 /admin 에서 컬렉션을 등록하고 crud를 과정을 진행하시면 됩니다
처음이라면 계정을 만들고 진행하시면 되구요!
