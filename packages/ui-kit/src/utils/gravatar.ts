import CryptoJS from "crypto-js";

export const getGravatarUrl = (email: string, size: number = 200): string => {
    const trimmedEmail = email.trim().toLowerCase();
    const hash = CryptoJS.MD5(trimmedEmail).toString();
    return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=404`;
};
