---
date: "2022-04-13"
title: "Javascript - 스코프"
creater: "blan19"
categories: ["Javascript"]
summary: "자바스크립트 스펙을 정리하고 복습해보자"
thumbnail: "./자바스크립트.png"
---

## 스코프

Javascript를 다뤄본 개발자라면 스코프(Scope)라는 단어를 많이 접했을 겁니다.

이 포스팅으로 자바스크립트의 스코프를 다뤄보겠습니다

먼저 자바스크립트의 스코프는 2가지 타입이 존재합니다 전역(Global)과 지약(local)입니다.

### 전역 변수와 지역 변수

> 전역 변수 사용을 지양하라는 말 많이 들어보셨죠? 왜 전역 변수 사용을 지양해야 할까요? 대표적인 이유론 변수가 섞일 수 있기 때문입니다

자, 이젠 전역 변수와 지역 변수가 무엇인지,

아래 예제 코드를 통해 자세히 알아보겠습니다

```tsx
let a = "global"

function print() {
  let a = "local"
  console.log(a)
}

print() // local
console.log(a) // global
```

같은 a여도 print() 함수 밖의 a는 전역 변수이고, print() 함수 안의 a는 print() 함수의 지역 변수입니다.

만약 print() 함수 안에 변수 a의 선언을 지우면 어떻게 될까요? print() 함수의 지역변수인 a가 사라졌으니 에러를 출력할까요?

한번 print() 함수의 지역변수 a를 지우고 실행해 보겠습니다

```tsx
let a = "global"

function print() {
  console.log(a)
}

print() // global
```

결과는 에러를 출력하지 않고, 전역 변수인 a를 출력합니다

이는 Scope Chaine에 의해 일어나는 현상입니다

스코프 체인을 간단하게 설명하자면, 현재 자신의 스코프에서 사용하고자 하는 변수가 없다면 Scope Chain을 따라 해당 변수를 찾게됩니다.

이젠 이 포스팅의 목적인 스코프에 대해 설명해 보겠습니다

### 스코프(Scope

위의 상황에서 지역변수는 아무리 해도 전역변수에 영향을 끼칠 수 없습니다.

바로 함수 스코프 때문이죠.

범위라는 말처럼 함수 안에서 선언된 변수는 해당 함수 안에서만 사용할 수 있습니다.

```tsx
let a = "global"

function print() {
  let a = "local"
  console.log(a)
}

print() // local
console.log(a) // global
```

자바스크립트는 `변수의 범위`를 호출한 함수의 지역 스코프부터 전역 변수들이 있는 전역 스코프까지 점차 넓혀가며 찾습니다.

함수 ex의 범위 안에 x가 없기 때문에 더 넓은 범위인 전역 스코프에서 찾습니다.

### 스코프 체인

바로 전역변수와 지역변수의 관계에서 **`스코프 체인(scope chain)`**이란 개념이 나옵니다.

내부 함수에서는 외부 함수의 변수에 접근 가능하지만 외부 함수에서는 내부 함수의 변수에 접근할 수 없습니다.

그리고 모든 함수들은 전역 객체에 접근할 수 있습니다.

```tsx
let name = "Junseo"
function outer() {
  console.log("외부", name)
  function inner() {
    let enemy = "Hyo"
    console.log("내부", name)
  }
  inner()
}
outer()
console.log(enemy) // undefined
```

inner 함수는 name 변수를 찾기 위해 먼저 자기 자신의 스코프에서 찾고, 없으면 한 단계 올라가 outer 스코프에서 찾고, 없으면 다시 올라가 결국 전역 스코프에서 찾습니다.

다행히 전역 스코프에서 name 변수를 찾아서 'Junseo'라는 값을 얻었습니다.

만약 전역 스코프에도 없다면 변수를 찾지 못하였다는 에러가 발생합니다.

이렇게 꼬리를 물고 계속 범위를 넓히면서 찾는 관계를 **`스코프 체인`**이라고 부릅니다.

### 렉시컬 스코핑(lexical scoping

**스코프**는 함수를 호출할 때가 아니라 **`선언`**할 때 생깁니다.

정적 스코프라고도 불립니다.

```tsx
let name = "Junseo"
function log() {
  console.log(name)
}

function wrapper() {
  let name = "Hyo"
  log()
}
wrapper() // Junseo
```

스코프는 함수를 **선언** 할 때 생기므로, log 안의 name은 wrapper 안의 지역변수 name이 아니라, 전역변수 name을 가리킵니다.

이런 것을 **`lexical scoping`**이라고 합니다.

함수를 처음 선언하는 순간, 함수 내부의 변수는 자기 스코프로부터 가장 가까운 곳(상위 범위에서)에 있는 변수를 계속 참조하게 됩니다.

### 레퍼런스

- 제로초 블로그 [link](https://www.zerocho.com/)
