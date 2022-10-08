---
date: "2022-04-12"
title: "Javascript - 실행컨텍스트"
creater: "blan19"
categories: ["Javascript"]
summary: "자바스크립트 스펙을 정리하고 복습해보자"
thumbnail: "자바스크립트.png"
---

## 실행 컨텍스트

- 공식 스펙에 적힌 내용과는 좀 다릅니다.

실행 컨텍스트는 자바스크립트가 왜 그렇게 동작하는 지 여러분께 설명해줍니다.

```tsx
let name = "Junseo"; // (1)변수 선언 (6)변수 대입
function wow(word) {
  // (2)변수 선언 (3)변수 대입
  console.log(word + " " + name); // (11)
}
function say() {
  // (4)변수 선언 (5)변수 대입
  let name = "Hyo"; // (8)
  console.log(name); // (9)
  wow("hello"); // (10)
}
say(); // (7)
```

먼저 어떻게 console이 찍힐지 생각해봅시다.

주석 괄호 안의 숫자 순으로 실행됩니다.

**`lexical scoping`**을 아신다면, 결과가 Hyo, hello Junseo라는 걸 아실 겁니다.

처음 코드를 실행(여기서 실행은 브라우저가 스크립트를 로딩해서 실행하는 걸 말합니다)하는 순간 모든 것을 포함하는 **`전역 컨텍스트`**가 생깁니다.

모든 것을 관리하는 환경입니다. 페이지가 종료될 때까지 유지됩니다.

전역 컨텍스트 말고도 **`함수 컨텍스트`**도 있습니다.

자바스크립트는 **`함수 스코프`**를 따릅니다. 함수를 호출할 때마다 함수 컨텍스트가 하나씩 더 생깁니다.

- 먼저 전역 컨텍스트 하나 생성 후, 함수 호출 시마다 컨텍스트가 생깁니다.
- 컨텍스트 생성 시 컨텍스트 안에 **`변수객체 (argument, variable)`, `scope chain`, `this`**가 생성됩니다.
- 컨텍스트 생성 후 함수가 실행되는데, 사용되는 변수들은 변수 객체 안에서 값을 찾고, 없다면 스코프 체인을 따라 올라가며 찾습니다.
- 함수 실행이 마무리되면 해당 컨텍스트는 사라집니다.(클로저 제외) 페이지가 종료되면 전역 컨텍스트가 사라집니다.

### \***\*전역 컨텍스트\*\***

전역 컨텍스트가 생성된 후 두 번째 원칙에 따라 변수객체, scope chain, this가 들어옵니다.

전역 컨텍스트는 **`arguments`**(함수의 인자를 말합니다)가 없고, **`variable`**
은 해당 스코프의 변수들입니다. (name, wow, say)이 존재합니다

**`scope chain`**(스코프 체인, 자신과 상위 스코프들의 변수객체입니다)은 자기 자신인 전역 변수객체입니다.

**`this`**는 따로 설정되어 있지 않으면 window입니다. this를 바꾸는 방법이 바로 **new**를 호출하는 겁니다. (또는 함수에 다른 this 값을 **bind** 할 수도 있습니다)

객체로 표현해보겠습니다.

```tsx
'전역 컨텍스트': {
  변수객체: {
    arguments: null,
    variable: ['name', 'wow', 'say'],
  },
  scopeChain: ['전역 변수객체'],
  this: window,
}
```

wow랑 say는 **`호이스팅`** 때문에 선언과 동시에 대입이 됩니다.

```tsx
variable: [{ name: "Junseo" }, { wow: Function }, { say: Function }];
```

### \***\*함수 컨텍스트\*\***

그 후 (7)번에서 `say();`를 하는 순간 새로운 컨텍스트인 say 함수 컨텍스트가 생깁니다.

전역 컨텍스트는 그대로 있습니다.

**`arguments`**는 없고, **`variable`**은 name 하나 뿐입니다.

**`scope chain`**은 say 변수객체와 상위의 전역 변수객체입니다.

**`this`**는 따로 설정해준 적이 없으므로, window입니다.

```tsx
'say 컨텍스트': {
  변수객체: {
    arguments: null,
    variable: ['name'], // 초기화 후 [{ name: 'nero' }]가 됨
  },
  scopeChain: ['say 변수객체', '전역 변수객체'],
  this: window,
}
```

say를 호출한 후 위에서부터 차례대로((8)~(10) 실행합니다.

**`variable`**의 name에 Hyo를 대입해주고 나서 `console.log(name);`
이 있습니다.

name 변수는 say 컨텍스트 안에서 찾았습니다.

**`variable`**에 name이 Hyo라고 되어 있네요. name이 콘솔에 찍힙니다.

그 다음엔 `wow('hello')`가 있습니다. say 컨텍스트 안에서 wow 변수를 찾을 수 없습니다.

찾을 수 없다면 **scope chain**을 따라 올라가 상위 변수객체에서 찾습니다. 이후, 전역 변수객체에서 찾습니다.

전역 변수객체의 variable에 wow라는 함수가 존재합니다. 호출합니다.

(10)번에서 wow함수가 호출되었으니 wow 컨텍스트도 생기게 됩니다.

**`arguments`**는 word = 'hello'입니다.

**`scope chain`**은 wow 스코프와 전역 스코프입니다.

여기서 중요한 게 lexical scoping에 따라 wow 함수의 스코프 체인은 선언 시에 이미 정해져 있습니다.

_따라서 say 스코프는 wow 컨텍스트의 **`scope chain`**이 아닙니다._

**`variable`**은 없습니다

**`this`**는 window입니다.

```tsx
'wow 컨텍스트': {
  변수객체: {
    arguments: [{ word : 'hello' }],
    variable: null,
  },
  scopeChain: ['wow 변수객체', '전역 변수객체'],
  this: window,
}
```

wow 컨텍스트가 생긴 후 함수가 실행 됩니다. say 함수는 아직 종료된 게 아닙니다.

wow 함수 안에서 `console.log(word + ' ' + name);`이 있습니다.

word는 **`arguments`**에서 찾을 수 있고, name은 wow 변수객체에는 값이 없으니, **`scope chain`**을 따라 전역 스코프에서 찾을 수 있습니다.

전역 변수객체로 올라가, variable에 name이 Junseo라고 되어 있습니다. 그래서 hello Junseo가 됩니다.

wow 컨텍스트에 따라, wow 함수는 애초에 say 컨텍스트와 일절 관련이 없습니다.

이제 wow 함수 종료 후 wow 컨텍스트가 사라지고, say 함수의 실행이 마무리됩니다.

따라서 say 컨텍스트도 사라지고, 마지막에 전역 컨텍스트도 사라집니다.

### \***\*호이스팅\*\***

`호이스팅`이란 변수를 선언하고 초기화했을 때 선언 부분이 최상단으로 끌어올려지는 현상을 의미합니다. (초기화 또는 대입 부분은 그대로 남아있습니다)

아래처럼 sayWow처럼 **`함수 표현식`**이 아니라 **`함수 선언식`**일 때는 식 자체가 통째로 끌어올려집니다.

```tsx
console.log(zero); // 에러가 아니라 undefined
sayWow(); // 정상적으로 wow
function sayWow() {
  console.log("wow");
}
var junseo = "Junseo";
```

변수 선언과 함수 선언식이 최상단으로 끌어올려졌기 때문에, 에러 없이 정상 작동합니다.

위의 코드는 다음과 같습니다.

```tsx
function sayWow() {
  console.log("wow");
}
var junseo;
console.log(junseo);
sayWow();
junseo = "Junseo";
```

하지만 같은 함수여도 함수 표현식으로 선언한 경우에는 에러가 발생합니다.

```tsx
sayWow(); // (3)
sayYeah(); // (5) 여기서 대입되기 전에 호출해서 에러
var sayYeah = function () {
  // (1) 선언 (6) 대입
  console.log("yeah");
};
function sayWow() {
  // (2) 선언과 동시에 초기화(호이스팅)
  console.log("wow"); // (4)
}
```

일단 처음 실행 시는 전역 컨텍스트가 먼저 생성됩니다

sayWow 함수는 함수 선언식이므로 컨텍스트 생성 후 바로 대입됩니다.

```tsx
'전역 컨텍스트': {
  변수객체: {
    arguments: null,
    variable: [{ sayWow: Function }, 'sayYeah'],
  },
  scopeChain: ['전역 변수객체'],
  this: window,
}
```

컨텍스트 생성 및 코드가 순차적으로 실행되는데 sayYeah는 대입되기 전에 호출해서 에러가 발생합니다.

### \***\*클로저\*\***

비공개 변수를 가질 수 있는 환경에 있는 함수가 `클로저`입니다.

비공개 변수는 클로저 함수 내부에 생성한 변수도 아니고, 매개변수도 아닌 변수를 의미합니다.

클로저를 말할 때는 **`스코프/컨텍스트/비공개 변수와 함수의 관계`**를 항상 같이 말해주어야 합니다.

```tsx
let makeClosure = function () {
  let name = "junseo";
  return function () {
    console.log(name);
  };
};
let closure = makeClosure(); // function () { console.log(name); }
closure(); // 'junseo';
```

closure 함수 안에 console.log(name)이 있습니다.

name은 closure 함수의 매개변수도 아니고, closure 함수 내부에서 생성한 변수도 아닙니다.

바로 이런 것이 비공개 변수입니다. `function() { console.log(name) }`은 name 변수나, name 변수가 있는 스코프에 대해 클로저라고 부를 수 있습니다.

수학적으로는 자유변수라고도 합니다.

이걸 컨텍스트로 분석해보겠습니다. 전역 컨텍스트 생성 후, makeClosure 함수 호출 시 makeClosure 컨텍스트도 만들어집니다.

```tsx
"전역 컨텍스트": {
  변수객체: {
    arguments: null,
    variable: [{ makeClosure: Function }, 'closure'],
  },
  scopeChain: ['전역 변수객체'],
  this: window,
}
"makeClosure 컨텍스트": {
  변수객체: {
    arguments: null,
    variable: [{ name: 'junseo' }],
  },
  scopeChain: ['makeClosure 변수객체', '전역 변수객체'],
  this: window,
}
```

주목할 점은 `closure = makeClosure()`할 때의 상황입니다.

function을 return하는데 그 function 선언 시의 **`scope chain`**은 `lexical scoping`을 따라서 `['makeClosure 변수객체', '전역 변수객체']`를 포함합니다.

따라서 closure을 호출할 때 컨텍스트는 다음과 같습니다.

```tsx
"closure 컨텍스트":  {
  변수객체: {
    arguments: null,
    variable: null,
  scopeChain: ['closure 변수객체', 'makeClosure 변수객체', '전역 변수객체'],
  this: window,
}
```

따라서 closure 함수에서 **`scope chain`**을 통해 makeClosure의 name 변수에 접근할 수 있습니다.

`클로저`는 **`비공개 변수`**를 만들어 활용할 수 있습니다.

비공개 변수이기 때문에 남들이 조작할 걱정은 없습니다.

프로그램 사용자는 여러분이 공개한 메소드만 사용해야합니다. 사용자가 예상을 뒤엎는 행동을 하는 것을 막을 수 있습니다.

꼭 알아두어야 할 점은 절대로 사용자를 믿어서는 안됩니다. 무슨 짓을 할 지 모르거든요. 해킹을 시도할 수도 있고, 프로그램에 버그를 만들 수도 있습니다. 특히 서버와 연결되어 있는 경우는 더 조심해야합니다.

그렇기때문에 항상 사용자가 할 수 있는 모든 행동과 일어날 수 있는 경우의 수를 통제하고 있어야합니다.

자바스크립트에서 사용자를 통제하기 위한 기본적인 방법이 바로 **`클로저`**입니다.

### 클로저의 단점

**`단점`**으로는 잘못 사용했을 시 성능 문제와 메모리 문제가 발생할 수 있습니다.

closure의 비공개 변수는 자바스크립트에서 언제 메모리 관리를 해야할 지 모르기 때문에 자칫 메모리 낭비로 이어질 수 있습니다.

또한 scope chain을 거슬러 올라가는 행동을 하기 때문에 조금 느립니다.

### 레퍼런스

- 제로초 블로그 [link](https://www.zerocho.com/category/JavaScript/post/609778ad9f879900043a8728)
