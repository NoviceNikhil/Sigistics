import React from 'react';
import authBg from "@/assets/auth-bg.jpg";

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-muted/50 px-4 py-8 animate-slide-up">
      <div className="flex w-full max-w-5xl overflow-hidden rounded-2xl bg-card shadow-xl">
        {/* Left decorative panel */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          <img
            src={authBg}
            alt="Decorative background"
            className="absolute inset-0 h-full w-full object-cover"
            width={800}
            height={1024}
          />
          <div className="relative z-10 flex flex-col justify-center px-12 py-16 text-white">
            <p className="text-lg font-light tracking-wide opacity-90">Nice to see you again</p>
            <h2 className="mt-2 text-4xl font-bold uppercase tracking-wider">{title}</h2>
            <div className="mt-4 h-1 w-12 bg-white/80 rounded" />
            <p className="mt-6 max-w-sm text-sm leading-relaxed opacity-75">
              The premium logistics and delivery experience. Fast, secure, and transparent processing for SwiftDrop operations.
            </p>
          </div>
        </div>

        {/* Right form panel */}
        <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2 bg-card">
          <div className="w-full max-w-md">
            <h1 className="mb-2 text-2xl font-bold text-primary">{subtitle}</h1>
            <p className="mb-8 text-sm text-muted-foreground">
              Please fill in your details below
            </p>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
