export default function Footer() {
  return (
    <footer className="!z-[30] *:!z-[30] w-screen !px-2 md:!px-[2.25rem] !py-3 min-h-8 md:min-h-6 !mx-auto flex justify-center !shadow-2xl">
      <div className="flex flex-col items-center justify-around w-full gap-1">
        <span className="!text-pilltime-grayDark/50 !text-xs">
          아 맞 다 약!
        </span>
        <p className="!text-pilltime-grayDark/25 !text-xs">
          &copy; 2025 정성우&#46; All Rights Reserved&#46;
        </p>
      </div>
    </footer>
  );
}
