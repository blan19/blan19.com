---
date: "2022-04-04"
title: "인간 Typescript 되어보자 - 3"
creater: "blan19"
categories: ["Typescript"]
summary: "타입스크립트를 복습하고 몰랐던 점을 기록해서 차근차근 정복해보자!"
thumbnail: "typescript.png"
---

## 인터페이스

> Typescript의 핵심 원칙 중 하나는 타입 검사가 값의 형태에 초점을 맞추고 있다는 것입니다. 이를 “덕 타이핑" 혹은 구조적 서브 타이핑이라고도 합니다. Typesript에서, 인터페이스는 이런 타입들의 이름을 짓는 역할을 하고 코드 안의 계약을 정의하는 것 뿐만 아니라 프로젝트 외부에서 사용하는 코드의 계약을 정의하는 강력한 방법입니다

### 간단한 인터페이스 사용

```tsx
interface LabeledValue {
  label: string;
}

function printLabel(labeledObj: LabeledValue) {
  console.log(labeledObj.label);
}

let myObj = { size: 10, label: "Size 10 Object" };
printLabel(myObj);
```

타입스크립트는 값의 형태에 초점을 맞추는 구조적 서브 타이핑이기 때문에 단지 인터페이스가 요구하는 프로퍼티들이 존재하는지와 프로퍼티들이 요구하는 타입을 가졌는지만을 확인합니다.

### 선택적 프로퍼티 (Optional Properties)

선택적 프로퍼티들은 객체 안의 몇 개의 프로퍼티만 채워 함수에 전달하는 "option bags" 같은 패턴을 만들 때 유용합니다.

선택적 프로퍼티는 선언에서 프로퍼티 이름 끝에 `?`를 붙여 표시합니다.

```tsx
interface SquareConfig {
  color?: string;
  width?: number;
}

function createSquare(config: SquareConfig): { color: string; area: number } {
  let newSquare = { color: "white", area: 100 };
  if (config.color) {
    newSquare.color = config.color;
  }
  if (config.width) {
    newSquare.area = config.width * config.width;
  }
  return newSquare;
}

let mySquare = createSquare({ color: "black" });
```

선택적 프로퍼티의 이점은 인터페이스에 속하지 않는 프로퍼티의 사용을 방지하면서, 사용 가능한 속성을 알려준다는 것입니다.

### \***\*읽기전용 프로퍼티 (Readonly properties)\*\***

_일부 프로퍼티들은 객체가 처음 생성될 때만 수정 가능해야합니다. 프로퍼티 이름 앞에 readonly를 넣어서 이를 지정할 수 있습니다_

```tsx
interface Point {
  readonly x: number;
  readonly y: number;
}

let p_1: Point = { x: 10, y: 20 };
// p_1.x = 1; // 읽기 전용이므로 오류 발생
```

_Typescript에서는 모든 변경 메서드가 제거된 Array<T>와 동일한 ReadonlyArray<T> 타입을 제공합니다._

_그래서 생성 후에 배열을 변경하지 않음을 보장할 수 있습니다_

```tsx
let a: number[] = [1, 2, 3, 4, 5, 6];
let ro: ReadonlyArray<number> = a;
// ro[0] = 1; // 오류 발생

/**
 * 타입 단언으로 오버라이드하는 것은 가능합니다
 */

a = ro as number[];
```

_`readonly` vs `const`_

_readonly와 const 중에 어떤 것을 사용할 지 기억하기 가장 쉬운 방법은 변수와 프로퍼티중 어디에 사용할지 질문해 보는 것입니다._

_변수는 const를 사용하고 프로퍼티는 readonly를 사용합니다_

### \***\*초과 프로퍼티 검사 (Excess Property Checks)\*\***

_객체 리터럴은 다른 변수에 할당할 때나 인수로 전달할 때, 특별한 처리를 받고, 초과 프로퍼티 검사를 받습니다. 만약 객체 리터럴이 "target type"이 갖고 있지 않은 프로퍼티를 갖고 있으면, 에러를 발생합니다_

```tsx
interface SquareConfig {
  color?: string;
  width?: number;
}

function createSquare(config: SquareConfig): { color: string; area: number } {
  let newArea = { color: "", area: 10 };
  if (config.color) {
    newArea.color = config.color;
  }
  if (config.width) {
    newArea.area = config.width * 2;
  }
  return newArea;
}

let mySquare = createSquare({ colour: "red", width: 100 }); // 오류 발생!

/*
이 검사를 피하는 방법은 정말 간단합니다. 가장 간단한 방법은 타입 단언을 사용하는 것입니다
*/

let mySquare = createSquare({ width: 100, opacity: 0.5 } as SquareConfig);
```

_하지만 특별한 경우에, 추가 프로퍼티가 있음을 확신한다면, string index signature를 추가하는 것이 더 나은 방법입니다_

```tsx
interface SquareIndexConfig {
  color?: string;
  width?: number;
  [propName: string]: any;
}
```

_추가 프로퍼티 검사를 피하는 마지막 방법은 놀랍게도 객체를 다른 변수에 할당하는 것입니다. 할당된 변수는 추가 프로퍼티 검사를 받지 않기 때문에 컴파일러는 에러를 주지 않습니다_

_이 방법은 공통 프로퍼티가 있는 경우에만 사용할 수 있습니다 이 경우엔 width가 그 경우 입니다_

_만약에 공통 객체 프로퍼티가 없다면 에러가 발생합니다_

```tsx
let mySquare_2 = { colour: "red", width: 100 };
createSquare(mySquare_2);
```

### \***\*함수 타입 (Function Types)\*\***

프로퍼티로 객체를 기술하는 것 외에, 인터페이스는 함수타입을 설명할 수 있습니다.

인터페이스로 함수 타입을 기술하기 위해, 인터페이스에 호출 서명을 전달합니다. 이는 매개변수 목록과 반환 타입만 주어진 함수 선언과 비슷합니다. 각 매개변수는 이름과 타입이 모두 필요합니다

```tsx
interface SearchFunc {
  (source: string, subString: string): boolean;
}

let mySearch: SearchFunc;

mySearch = function (source: string, subString: string) {
  let result = source.search(subString);
  return result > -1;
};
```

올바른 함수 타입 검사를 위해, 매개변수의 이름이 같을 필요는 없습니다. 예를 들어, 위의 예제를 아래와 같이 쓸 수 있습니다

```tsx
mySearch = function (src: string, sub: string) {
  let result = src.search(sub);
  return result > -1;
};
```

### \***\*인덱서블 타입 (Indexable Types)\*\***

인터페이스로 함수 타입을 설명하는 방법과 유사하게, `a[10]` 이나 `ageMap["daniel"]` 처럼 타입을 “인덱스"로 기술할 수 있습니다. 인덱서블 타입은 인덱싱 할 때 해당 반환 유형과 함께 객체를 인덱싱하는 데 사용할 수 있는 타입을 기술하는 *인덱스 시그니처 (index signature)*를 가지고 있습니다.

```tsx
interface StringArray {
  [index: number]: string;
}

let myArray: StringArray;
myArray = ["Bob", "Fred"];

let myStr: string = myArray[0];
```

인덱스 서명을 지원하는 타입에는 두 가지가 있습니다. `문자열과 숫자.`

두 타입의 인덱서(indexer)를 모두 지원하는 것은 가능하지만, 숫자 인덱서에서 반환된 타입은 반드시 문자열 인덱서에서 반환된 타입의 하위 타입(subtype)이어야 합니다.

이 이유는 `number`로 인덱싱 할 때, JavaScript는 실제로 객체를 인덱싱하기 전에 `string`으로 변환하기 때문입니다. 즉, `100` (`number`)로 인덱싱하는 것은 `"100"` (`string`)로 인덱싱하는 것과 같기 때문에, 서로 일관성 있어야 합니다.

```tsx
class Animal {
  name: string;
}
class Dog extends Animal {
  breed: string;
}

// 오류: 숫자형 문자열로 인덱싱을 하면 완전히 다른 타입의 Animal을 얻게 될 것입니다!
interface NotOkay {
  [x: number]: Animal;
  [x: string]: Dog;
}
```

문자열 인덱스 시그니처는 "사전" 패턴을 기술하는데 강력한 방법이지만, 모든 프로퍼티들이 반환 타입과 일치하도록 강제합니다.

```tsx
interface NumberDictionary {
  [index: string]: number;
  length: number; // 성공, length는 숫자입니다
  name: string; // 오류, `name`의 타입은 인덱서의 하위타입이 아닙니다
}
```

하지만, 인덱스 시그니처가 유니온 타입으로 프로퍼티 타입들의 합집합이라면 다른 타입의 프로퍼티들도 허용할 수 있습니다

```tsx
interface NumberOrStringDictionary {
  [index: string]: number | string;
  length: number; // 성공, length는 숫자입니다
  name: string; // 성공, name은 문자열입니다
}
```

마지막으로, 인덱스의 할당을 막기 위해 인덱스 시그니처를 `읽기 전`으로 만들 수 있습니다

```tsx
interface ReadonlyStringArray {
  readonly [index: number]: string;
}
let myArray: ReadonlyStringArray = ["Alice", "Bob"];
myArray[2] = "Mallory"; // 오류!
```

### 레퍼런스

- Typescript 공식 문서 [Doc](https://typescript-kr.github.io/pages/interfaces.html)
