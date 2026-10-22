import Image from 'next/image';

// Brand wordmark (box with speed lines + "Amana"). `white` is for dark backgrounds. Size it with a height
// class (e.g. h-8); the width follows. Files: public/amana-logo.png, public/amana-logo-white.png (531×120).
export default function Logo({ className = 'h-8', white = false, priority = false }: { className?: string; white?: boolean; priority?: boolean }) {
  return (
    <Image src={white ? '/amana-logo-white.png' : '/amana-logo.png'} alt="Amana" width={531} height={120} priority={priority}
      className={`${className} w-auto`} />
  );
}
