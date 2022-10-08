---
date: "2022-04-17"
title: "jsx-control-statements 사용하여 JSX에서 깨끗한 조건문을 작성하는 방법"
creater: "blan19"
categories: ["React"]
summary: "jsx-control-statements 사용을 익히고 클린 코드를 작성해보자"
thumbnail: "learn.webp"
---

## `JSX에서 깨끗한 조건문을 작성하는 방법`

이 포스팅은 JSX에서 가독성을 향상시키는 것에 관한 글입니다.

### Problem

JSX에서 조건문은 코드를 복잡하고 가독성이 떨어지게 만듭니다.

스택플로우 [이슈](https://stackoverflow.com/questions/37312122/how-to-do-a-nested-if-else-statement-in-reactjs-jsx)에서도 문제를 확인해볼 수 있습니다.

만약 작업하고 있는 프로젝트의 Codebase가 매우 크고, JSX에 대한 많은 조건 로직들이 존재한다면 후엔 코드는 복잡해지고 가독성이 걷잡을 수 없이 떨어질 것 입니다.

저는 제 코드에선 이러한 문제가 보이지 않았으면 합니다 절대로.

우리는 이러한 상황을 Add to cart Button 리팩토링 과정에서 마주쳤는데 이전 Old codebase 에서 어떻게 보였는지 보여드리겠습니다

<img src="https://user-images.githubusercontent.com/66871265/163708483-5cf5c8d1-1163-493a-80b5-27e902be279b.png" width="100%" alt="example">

우선 위 코드에선, 우리는 처음에 버튼 안에 `“Add to Cart”`을 유저에게 보여주어야 합니다. 그리고 유저가 버튼을 클릭한다면 버튼은 `“Loading..”` 을 데이터를 처리하는 동안 보여주어야 합니다.

후엔 유저가 로그인 상태라면 `"View Bag : $900"` 을 보여주어야 하며, 로그인 상태가 아니라면 `“Login to view Bag”` 을 보여주어야 합니다. 하지만 상품이 품절 상태라면, `"OUT OF STOCK"`을 보여주어야합니다.

<img src="https://user-images.githubusercontent.com/66871265/163716044-f41f6165-b02d-472f-a02d-624c495e4214.gif" width="100%" alt="example">

자 당신이 보고 있는 이 코드를 모두 이해 하시겠어요? 적어도 한번엔 아닐겁니다.

### The solution

아래의 코드는 jsx-control-statements 으로부터 영감 받았으며, 훨씬 가독성이 좋습니다.
저는 JSX를 더 깨끗하고 가독성이 뛰어난 몇개의 좋은 패턴들을 보여드릴 겁니다

<img src="https://user-images.githubusercontent.com/66871265/163716172-12a67de1-cdcd-4917-9462-5cb3c39d11df.png" width="100%" alt="example">

`If` 컴포넌트는 이름 그 자체로 이해하기 쉽습니다 그리고 또 구현하기에도 매우 쉽구요.
`Choose`, `When`, `Otherwise` 패턴들은 switch case default와 같습니다.
`When`은 조건과 함께하며, `Otherwise`는 그 외의 나머지로써 행위합니다.

이러한 패턴들을 쉽게 시작해봅시다!

<img src="https://user-images.githubusercontent.com/66871265/163716620-0fc11aa7-c49d-4190-a6d2-ca207fa2e73a.png" width="100%" alt="example">

어떠세요? 좀 더 흥미로운 패턴을 보여드릴게요. 이것을 `Choose` Element라고 합니다.
자세한건 [여기서](https://github.com/AlexGilleran/jsx-control-statements#choose)확인하시면 됩니다.
이젠 그것을 어떻게 사용하는지 보여드리겠습니다.

> 완벽한 구현은 아니지만, 컨셉을 설명하기엔 충분합니다. 또한 플러그인에서 사용해볼수있습니다.

<img src="https://user-images.githubusercontent.com/66871265/163716847-2b96a46f-7e9d-4847-8646-3f642298ecf0.png" width="100%" alt="example">

처음은 `true` 조건과 함께 `When` 컴포넌트가 리턴 될 것입니다.

아웃풋: I want Tea

### Use-case of Otherwise Component

따라서 만약 `When` 컴포넌트에서 `true` 조건을 아무도 가지지 않는다면, `Otherwise` 컴포넌트가 선택 될 것입니다.

<img src="https://user-images.githubusercontent.com/66871265/163717167-4493d9da-b059-47b6-b182-7d8440d1c671.png" width="100%" alt="example">

아웃풋: Tea/Coffee + Sandwich

`When`과 `Otherwise` 컴포넌트를 만들어 봅시다!

<img src="https://user-images.githubusercontent.com/66871265/163717363-7aac1485-b322-4afe-b1f4-741e65f5d6f4.png" width="100%" alt="example">

정말 쉽죠? 자 이제 진짜 목표인 `Choose` 컴포넌트를 시작해봅시다.
`Choose` 컴포넌트는 먼저 조건이 `true`인 컴포넌트를 찾고 반환할 것입니다.
만약 `When` 컴포넌트가 `true` 조건을 가지고 있지 않는다면, `Choose` 컴포넌트는 `Otherwise` 컴포넌트를 찾고 반환할 것 입니다.

<img src="https://user-images.githubusercontent.com/66871265/163717653-be8547e6-e150-421d-9714-8e48ac0a0c28.png" width="100%" alt="example">

마지막으로 `Choose` 컴포넌트 내부에 5개 이상의 `When` 컴포넌트를 사용한다면 별로 추천하지 않습니다. 그 경우엔 일반적인 노멀 JavaScript Switch Case가 더 나은 경우가 될 수 있습니다.

### Resources

[Link](https://stackoverflow.com/questions/37312122/how-to-do-a-nested-if-else-statement-in-reactjs-jsx)
[Link](https://github.com/AlexGilleran/jsx-control-statements)

Designs by [Astha](https://medium.com/@astha.oberoi)

### Reference

Hardik khanchandani [칼럼](https://medium.com/trell-labs/cleaner-way-to-write-conditionals-in-jsx-b13fb60b5792)
