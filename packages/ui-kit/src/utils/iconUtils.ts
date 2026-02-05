

export const widthTokenRegex = /^(?:min-|max-)?w-/;
export const heightTokenRegex = /^(?:min-|max-)?h-/;

export const mergeClassTokens = (...groups: Array<string | undefined>) => {
    const tokens: string[] = [];

    const addToken = (token: string) => {
        if (widthTokenRegex.test(token)) {
            for (let i = tokens.length - 1; i >= 0; i -= 1) {
                if (widthTokenRegex.test(tokens[i])) {
                    tokens.splice(i, 1);
                }
            }
        }

        if (heightTokenRegex.test(token)) {
            for (let i = tokens.length - 1; i >= 0; i -= 1) {
                if (heightTokenRegex.test(tokens[i])) {
                    tokens.splice(i, 1);
                }
            }
        }

        if (!tokens.includes(token)) {
            tokens.push(token);
        }
    };

    groups
        .filter(Boolean)
        .forEach((group) =>
            group!
                .split(/\s+/)
                .filter(Boolean)
                .forEach(addToken)
        );

    return tokens.join(' ');
};

export const hasExplicitSize = (value?: string) =>
    Boolean(value) && /\b(?:min-|max-)?(?:w|h)-/.test(value as string);
