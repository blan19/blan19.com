"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import Icon from "@/components/ui/icon";
import { captionHost, isUrlCaption } from "@/lib/markdown/image-meta";

interface PostImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority: boolean;
  caption?: string;
}

const Caption = ({ caption }: { caption: string }) => {
  if (isUrlCaption(caption)) {
    return (
      <figcaption>
        <a
          className="ext"
          href={caption}
          target="_blank"
          rel="noopener noreferrer"
        >
          출처: {captionHost(caption)}
        </a>
      </figcaption>
    );
  }
  return <figcaption>{caption}</figcaption>;
};

const PostImage = ({
  src,
  alt,
  width,
  height,
  priority,
  caption,
}: PostImageProps) => {
  const [failed, setFailed] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Cache Components 의 <Activity> 가 떠난 글을 숨기면 열린 dialog 가 모달이 아닌 채 열려 남는다.
  // 숨길 때 실행되는 layout effect 정리에서 닫는다.
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    return () => dialog?.close();
  }, []);

  const open = () => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (dialog.open && !dialog.matches(":modal")) dialog.close();
    if (!dialog.open) dialog.showModal();
  };
  const close = () => dialogRef.current?.close();
  const handleDialogClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) close();
  };

  return (
    <figure className="img-fig">
      {failed ? (
        <div className="img-fallback" role="img" aria-label={alt}>
          <Icon name="img-off" />
          <span className="img-fallback-alt">{alt}</span>
          <span className="img-fallback-why">이미지를 불러오지 못했습니다.</span>
        </div>
      ) : (
        <button
          type="button"
          className="img-zoom"
          aria-label={`${alt} 크게 보기`}
          onClick={open}
        >
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            sizes="(max-width: 767px) 100vw, 660px"
            loading={priority ? "eager" : undefined}
            fetchPriority={priority ? "high" : undefined}
            onError={() => setFailed(true)}
          />
        </button>
      )}
      {caption && <Caption caption={caption} />}
      {!failed && (
        <dialog
          className="zoom-dlg"
          ref={dialogRef}
          aria-label={alt}
          onClick={handleDialogClick}
        >
          <div>
            <div className="zoom-bar">
              <span>{caption && !/^https?:\/\//i.test(caption) ? caption : alt}</span>
              <button
                type="button"
                className="zoom-close"
                aria-label="닫기"
                onClick={close}
              >
                <Icon name="x" />
              </button>
            </div>
            <Image
              src={src}
              alt={alt}
              width={width}
              height={height}
              sizes="(max-width: 1100px) 100vw, 1100px"
            />
          </div>
        </dialog>
      )}
    </figure>
  );
};

export default PostImage;
