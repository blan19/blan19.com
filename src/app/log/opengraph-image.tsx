// 사이트 카드를 이 세그먼트에도 붙인다. 페이지가 자기 openGraph 를 정의하면 상위(app/opengraph-image)의 파일 이미지는 사라지므로
// 같은 세그먼트에 다시 두어 파일 규칙(해시 붙은 URL, 크기, alt)으로 넣는다.
export { default, alt, size, contentType } from "@/app/opengraph-image";
