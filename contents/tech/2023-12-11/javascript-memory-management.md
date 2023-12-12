---
publishedAt: "2023-12-11"
title: "자바스크립트에서 메모리 관리"
tags: ["javascript"]
reference:
  [
    "https://developer.mozilla.org/ko/docs/Web/JavaScript/Memory_management#%EA%B0%92_%EC%82%AC%EC%9A%A9",
    "https://felixgerschau.com/javascript-memory-management/#reference-counting-garbage-collection",
    "https://deepu.tech/memory-management-in-v8/",
    "https://auth0.com/blog/four-types-of-leaks-in-your-javascript-code-and-how-to-get-rid-of-them/",
  ]
---

### 배경

javascript를 사용하는 개발자들은 평소 메모리에 대해 큰 신경 쓸 일은 없을 것 입니다.

저도 그랬지만, 회사 업무 중 자바스크립트 메모리 관리에 신경 써야할 일이 생기게 되었습니다.

c++과 같은 low-level 언어들은 메모리 할당 해제를 수동으로 해주어야 하지만,
javascript와 같은 high-level 언어들은 `Garbage collector(GC)`, 가비지 컬렉터가 알아서 할당된 메모리를 해제해 줍니다.

저도 이렇게 가비지 컬렉터가 참조가 없는 값에 대한 메모리 할당을 해제를 해준다는 수준으로 간단하게만 알고 있었습니다.

하지만 저처럼 메모리 누수에 신경을 쓸 일이 생긴다면, 어떻게 메모리에 저장되고 가비지 컬렉터는 어떻게 메모리를 해제하는지에 대해 알아 볼 필요가 있습니다.

### 자바스크립트 메모리 사용

먼저, 자바스크립트에서는 객체나 원시값들은 어디에 저장 되고 있는 걸까요?
바로 `스택`과 `힙 메모리`입니다.

### 메모리를 관리할 필요가 있을 땐 자바스크립트에서는 어떻게 할까?

### 가비지 컬랙터

#### 가비지 컬랙터로 인해 생기는 장,단

### 마치면서
