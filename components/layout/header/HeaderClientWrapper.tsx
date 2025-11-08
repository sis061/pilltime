"use client";

import dynamic from "next/dynamic";

// HeaderClient는 원래 client 컴포넌트라고 가정
const HeaderClient = dynamic(() => import("./HeaderClient"), {
  ssr: false,
  loading: () => null,
});

type Props = React.ComponentProps<typeof HeaderClient>;

export default function HeaderClientWrapper(props: Props) {
  return <HeaderClient {...props} />;
}
