interface ViewCounter {
  view: number;
  className: string;
}

const ViewCounter = ({ view, className }: ViewCounter) => {
  return <p className={className}>{view.toLocaleString("ko-KR")} views</p>;
};

export default ViewCounter;
