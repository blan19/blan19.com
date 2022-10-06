---
date: "2022-04-05"
title: "Electron으로 일정 공유 앱 만드는 과정의 기록들 - 1"
creater: "blan19"
categories: ["Typescript", "React", "Electron"]
summary: "Electron Forge를 사용하여 Electron + Webpack + React + Typescript 환경에서 앱을 만들어보자"
thumbnail: "./electron.png"
---

## Electron 일정 공유 앱을 만들어 보자 - 1

> 일정을 서로 공유하는 우리만의 데스크톱 앱을 만들어보자! 하고 시작된 일렉트론 개발 기록

### 개발 환경

빠르게 개발을 하기 위해 일렉트론 빌딩 툴인 Electron Forge를 사용하여 React + Typescript 환경을 구축하고 개발을 시작했습니다.

개발 환경 구축은 Electron Forge의 [공식문서](https://www.electronforge.io/guides/framework-integration/react-with-typescript) 를 참고하여 구축했습니다

### React 18v

React가 18버전을 release 하면서 클라이언트 렌더링 API 부분에서 변경점이 생겨 ReactDOM.render를 변경해주어야 힙니다.
기존에 있던 ReactDOM.rendersms 더 이상 React 18에선 지원하지 않기 때문입니다

18v으로 인해 React 18v의 Concurrent 를 지원하는 새로운 렌더러를 사용이 가능합니다

```tsx
// Before
import { render } from "react-dom"
const container = document.getElementById("app")
render(<App tab="home" />, container)

// After
import { createRoot } from "react-dom/client"
const container = document.getElementById("app")
const root = createRoot(container)
root.render(<App tab="home" />)
```

Electron Forge 프로젝트에 적용해보겠습니다

```tsx
// renderer.tsx
import React from "react"
import { createRoot } from "react-dom/client"
import App from "./app"

const container = document.getElementById("App")
const root = createRoot(container)
root.render(<App />)
```

React 18v에 대한 더 많은 정보는 [Upgrade Guide](https://reactjs.org/blog/2022/03/08/react-18-upgrade-guide.html)를 참고하자!

### React-router-dom

Electron은 우리가 일반적으로 웹에서 사용하는 라우팅 주소를 사용하지 않고 file system을 사용하기 때문에 Hash Router를 사용하여 라우팅해야합니다.

React-router-dom V6로 업그레이드가 되면서 이전 버전과 달라진 점이 많이 생겼는데,

대표적으론 Routes와 중첩 라우팅, useRoutes, useNavigate 등으로 바뀌었습니다

```tsx
import React from "react"
import { HashRouter, Route, Routes } from "react-router-dom"
import styled from "styled-components"
import NavBar from "./components/NavBar"
import GlobalStyles from "./lib/styles/GlobalStyles"

const App = () => {
  return (
    <HashRouter>
      <GlobalStyles />
      <AppContainer>
        <NavBar />
        <Routes>
          <Route
            path="/"
            element={
              <div>
                <h1>Hello from React!</h1>
              </div>
            }
          />
        </Routes>
      </AppContainer>
    </HashRouter>
  )
}

export default App

const AppContainer = styled.div`
  display: flex;
`
```

V6부터는 exact 는 더이상 사용하지 않고 여러 라우팅을 매칭하고 싶은 경우 URL 뒤에 \* 을 사용합니다.

Route에서는 component 대신 elemet로 렌더링을 합니다.

다른 더 많이 바뀐 점은 공식문서를 살펴보면 될 거 같습니다..!

[Upgrade Guide](https://reactrouter.com/docs/en/v6/upgrading/v5)

### Webpack

Electron Forge 문서를 따라 개발 환경을 구축하고, images나 fonts 같은 정적 파일들을 절대 경로로 가져 오기 위해서는
웹팩을 따로 설정해주어야 한다

```
npm i -D copy-webpack-plugin
```

```js
// webpack.plugins.js
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin")
const path = require("path")
const CopyWebpackPlugin = require("copy-webpack-plugin")

const assets = ["images"]

const copyAssets = assets.map(asset => {
  return new CopyWebpackPlugin({
    patterns: [{ from: path.resolve(__dirname, "src", asset), to: asset }],
  })
})

module.exports = [...copyAssets, new ForkTsCheckerWebpackPlugin()]
```

```tsx
import React from "react"

const NavBar = () => {
  return (
    <div>
      <h1>Navbar</h1>
      <img src="images/electron.png" alt="electron" />
    </div>
  )
}

export default NavBar
```

src/images의 파일들을 절대 경로를 통해 가져올 수 있게되었습니다.

fonts, css 등 필요한 폴더가 생긴다면 webpack.plugins.js의 assets에 추가해주시고 폴더를 만드시면 됩니다

### 이어서...

이후 글에선 본격적으로 개발 과정을 기록해보겠습니다..!
