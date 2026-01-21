import { useState, useEffect } from "react";

function PasswordStrength({ password, onStrengthChange }) {
  const [strength, setStrength] = useState({
    score: 0,
    label: "",
    color: "",
    suggestions: [],
  });

  useEffect(() => {
    const calculateStrength = (pwd) => {
      if (!pwd) {
        return {
          score: 0,
          label: "",
          color: "",
          suggestions: [],
        };
      }

      let score = 0;
      const suggestions = [];

      // Length check
      if (pwd.length >= 8) {
        score += 1;
      } else {
        suggestions.push("Use at least 8 characters");
      }

      // Uppercase check
      if (/[A-Z]/.test(pwd)) {
        score += 1;
      } else {
        suggestions.push("Add uppercase letters");
      }

      // Lowercase check
      if (/[a-z]/.test(pwd)) {
        score += 1;
      } else {
        suggestions.push("Add lowercase letters");
      }

      // Number check
      if (/\d/.test(pwd)) {
        score += 1;
      } else {
        suggestions.push("Add numbers");
      }

      // Special character check
      if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) {
        score += 1;
      } else {
        suggestions.push("Add special characters (!@#$%^&*)");
      }

      // Bonus points for length
      if (pwd.length >= 12) score += 1;
      if (pwd.length >= 16) score += 1;

      // Determine label and color
      let label, color;
      if (score <= 2) {
        label = "Weak";
        color = "text-red-400";
      } else if (score <= 4) {
        label = "Fair";
        color = "text-yellow-400";
      } else if (score <= 5) {
        label = "Good";
        color = "text-blue-400";
      } else {
        label = "Strong";
        color = "text-green-400";
      }

      return {
        score: Math.min(score, 5),
        label,
        color,
        suggestions: suggestions.slice(0, 3), // Limit to 3 suggestions
      };
    };

    const newStrength = calculateStrength(password);
    setStrength(newStrength);

    if (onStrengthChange) {
      onStrengthChange(newStrength);
    }
  }, [password, onStrengthChange]);

  if (!password) return null;

  const getBarColor = (index) => {
    if (index < strength.score) {
      if (strength.score <= 2) return "bg-red-400";
      if (strength.score <= 4) return "bg-yellow-400";
      if (strength.score === 5) return "bg-blue-400";
      return "bg-green-400";
    }
    return "bg-slate-600";
  };

  return (
    <div className="mt-3 space-y-2">
      {/* Strength bars */}
      <div className="flex gap-1">
        {[...Array(5)].map((_, index) => (
          <div
            key={index}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${getBarColor(
              index
            )}`}
          />
        ))}
      </div>

      {/* Strength label */}
      <div className="flex items-center justify-between">
        <span className={`text-sm font-medium ${strength.color}`}>
          {strength.label}
        </span>
        <span className="text-xs text-slate-400">{strength.score}/5</span>
      </div>

      {/* Suggestions */}
      {strength.suggestions.length > 0 && (
        <div className="text-xs text-slate-400 space-y-1">
          <div>To improve:</div>
          <ul className="list-disc list-inside space-y-0.5 ml-2">
            {strength.suggestions.map((suggestion, index) => (
              <li key={index}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default PasswordStrength;
