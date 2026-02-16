import { useState, useEffect } from "react";
import { useIconRenderer } from "../contexts/IconContext";

export interface UserAvatarUser {
  name?: string;
  username?: string;
  email?: string;
  avatarUrl?: string;
}

export interface UserAvatarProps {
  user?: UserAvatarUser | null;
  size?: number;
  className?: string;
  variant?: "circle" | "rounded" | "square";
}

export const UserAvatar = ({ user, size = 32, className = "", variant = "circle" }: UserAvatarProps) => {
  const renderIcon = useIconRenderer();
  const [hasError, setHasError] = useState(false);
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  useEffect(() => {
    setHasError(false);
    if (user?.avatarUrl) {
      setImgSrc(user.avatarUrl);
    } else {
      setImgSrc(null);
    }
  }, [user?.avatarUrl, size]);

  const roundedClass = variant === "circle" ? "rounded-full" : variant === "rounded" ? "rounded-md" : "rounded-none";
  const baseClasses = `flex items-center justify-center font-bold text-slate-600 overflow-hidden ${roundedClass} ${className}`;

  const renderFallback = () => {
    const identifier = user?.name || user?.username || user?.email;
    if (identifier) {
      return (
        <div
          className={`w-full h-full bg-slate-200 flex items-center justify-center text-xs dark:bg-slate-700 dark:text-slate-300 ${roundedClass}`}
        >
          {identifier[0].toUpperCase()}
        </div>
      );
    }
    return (
      <div
        className={`w-full h-full bg-slate-200 flex items-center justify-center text-xs dark:bg-slate-700 dark:text-slate-300 ${roundedClass}`}
      >
        {renderIcon("User", "xs")}
      </div>
    );
  };

  if (!user || !user.avatarUrl) {
    return (
      <div className={baseClasses} style={{ width: size, height: size }}>
        {renderFallback()}
      </div>
    );
  }

  return (
    <div className={`${baseClasses} bg-transparent`} style={{ width: size, height: size }}>
      {!hasError && imgSrc ? (
        <img
          src={imgSrc}
          alt={user?.name || user?.username || "User Avatar"}
          className={`h-full w-full object-cover ${roundedClass}`}
          onError={() => setHasError(true)}
        />
      ) : (
        renderFallback()
      )}
    </div>
  );
};

UserAvatar.displayName = "UserAvatar";

export default UserAvatar;
