//TODO 퍼블리싱 필요

import SocialLogin from "./SocialLogin";

export default function LoginPage() {
  return (
    <section className="flex inner min-h-screen items-center justify-center !bg-pilltime-grayLight">
      <div className="w-full max-w-sm !p-8 bg-white rounded-2xl flex flex-col gap-12">
        <h1 className="text-4xl font-bold text-center !mb-6 !text-pilltime-grayDark">
          아 맞 다 약 !
        </h1>
        <SocialLogin />
      </div>
    </section>
  );
}
