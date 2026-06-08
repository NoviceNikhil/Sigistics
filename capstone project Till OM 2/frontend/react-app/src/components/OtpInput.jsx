import React, { useState, useRef, useEffect } from 'react';

const OtpInput = ({ length = 6, onComplete }) => {
  const [otp, setOtp] = useState(new Array(length).fill(""));
  const inputRefs = useRef([]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index, e) => {
    const value = e.target.value;
    if (isNaN(value)) return;

    const newOtp = [...otp];
    // allow only one character
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // trigger onComplete
    const combinedOtp = newOtp.join("");
    if (combinedOtp.length === length) {
      onComplete(combinedOtp);
    }

    // move to next
    if (value && index < length - 1 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0 && inputRefs.current[index - 1]) {
      // move to prev input on backspace
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, length).split("");
    if (pastedData.some(isNaN)) return;

    const newOtp = [...otp];
    pastedData.forEach((char, i) => {
      newOtp[i] = char;
    });
    setOtp(newOtp);

    const combinedOtp = newOtp.join("");
    if (combinedOtp.length === length) {
      onComplete(combinedOtp);
    }

    // Focus last filled
    const targetIndex = Math.min(pastedData.length, length - 1);
    inputRefs.current[targetIndex].focus();
  };

  return (
    <div className="flex gap-2 sm:gap-3 justify-center mb-6">
      {otp.map((data, index) => (
        <input
          key={index}
          type="text"
          className="flex h-12 w-12 sm:h-14 sm:w-14 text-center text-xl font-bold rounded-md border border-input bg-background text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          value={data}
          ref={(ref) => (inputRefs.current[index] = ref)}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
        />
      ))}
    </div>
  );
};

export default OtpInput;
