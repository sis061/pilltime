import Image from "next/image";
import dynamic from "next/dynamic";

const SocialLogin = dynamic(() => import("./SocialLogin"), {
  loading: () => (
    <div className="w-full h-10 rounded-md bg-muted animate-pulse" />
  ),
});

export default function LoginPage() {
  return (
    <section className="flex w-full max-w-screen-2xl mx-auto max-md:!px-8 min-h-screen items-center justify-center">
      <div className="w-full max-w-sm !p-8 bg-[#F6F4F2] rounded-2xl flex flex-col items-center justify-center gap-20 min-h-[75dvh]">
        <Image
          src="/pilltime_logo.png"
          alt="logo"
          width={400}
          height={400}
          priority
          sizes="(max-width: 640px) 240px, 400px"
        />
        <h1
          className="text-4xl font-bold text-center !mb-6 !text-pilltime-grayDark"
          hidden
        >
          아 맞 다 약 !
        </h1>
        <SocialLogin />
      </div>
    </section>
  );
}
