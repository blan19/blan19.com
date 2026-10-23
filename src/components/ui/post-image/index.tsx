"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { MouseEvent } from "react";
import Icon from "@/components/ui/icon";

interface PostImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority: boolean;
  caption?: string;
}

const hostname = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

const Caption = ({ caption }: { caption: string }) => {
  if (/^https?:\/\//i.test(caption)) {
    return (
      <figcaption>
        <a
          className="img-src ext"
          href={caption}
          target="_blank"
          rel="noopener noreferrer"
        >
          출처: {hostname(caption)}
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

  const open = () => dialogRef.current?.showModal();
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
            preload={priority}
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
          <div className="zoom-inner">
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
