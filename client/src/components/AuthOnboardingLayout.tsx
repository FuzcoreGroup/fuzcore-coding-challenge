import React from "react";

export default function AuthOnboardingLayout({
  title,
  subtitle,
  form,
  sideImageSrc,
}: {
  title: string;
  subtitle: string;
  form: React.ReactNode;
  sideImageSrc: string;
}) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left: form panel */}
      <div className="flex-1 bg-[#0b0b10] text-white flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">{form}</div>
      </div>

      {/* Right: marketing / onboarding panel */}
      <div className="hidden md:flex md:w-[50%] bg-emerald-400/90 text-white items-center justify-center relative overflow-hidden">
        <div className="w-full h-full p-10 flex items-center justify-center">
          <div className="max-w-md">
            <div className="text-xs font-medium tracking-wide uppercase opacity-90">{subtitle}</div>
            <h2 className="mt-3 text-3xl font-bold leading-tight">{title}</h2>
          </div>
        </div>

        {/* Large screen side image (part of the onboarding art) */}
        <img
          src={sideImageSrc}
          alt="Onboarding illustration"
          className="absolute right-[-40px] bottom-[-40px] h-[78%] w-auto object-contain"
        />
      </div>
    </div>
  );
}

