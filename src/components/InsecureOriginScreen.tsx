import React, { useEffect } from 'react';

interface InsecureOriginScreenProps {
    error?: Error | null;
}

export const InsecureOriginScreen: React.FC<InsecureOriginScreenProps> = ({ error }) => {
    useEffect(() => {
        if (error) {
            console.error('[InsecureOriginScreen]', error);
        }
    }, [error]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-white dark:bg-neutral-950 p-6">
            <div className="max-w-xl text-center">
                <div className="mb-4 flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                        <svg
                            className="h-8 w-8 text-red-600 dark:text-red-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.75}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                        </svg>
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">
                    Can&#8217;t encrypt your secrets here
                </h1>

                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed">
                    This app needs a secure connection (HTTPS) to encrypt what you store. You&#8217;re reaching
                    it over plain HTTP on a local address, so your browser hides the encryption tools it needs
                    — and the app won&#8217;t save anything unprotected without your say-so.
                </p>

                <div className="text-left mb-6">
                    <div className="mb-4">
                        <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1 uppercase tracking-wide">
                            Recommended fix
                        </p>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Put the app behind HTTPS, or open it via localhost. Both give the browser a secure
                            context and everything just works.
                        </p>
                    </div>

                    <div className="bg-neutral-50 dark:bg-neutral-900 rounded-md p-3 mb-4 border border-neutral-200 dark:border-neutral-800">
                        <pre className="text-xs text-neutral-700 dark:text-neutral-300 overflow-x-auto">
{`app.internal.example {
    reverse_proxy localhost:8080
}`}
                        </pre>
                    </div>

                    <div>
                        <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1 uppercase tracking-wide">
                            Just trying it out?
                        </p>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                            Set this on the server and restart:
                        </p>
                        <div className="bg-neutral-50 dark:bg-neutral-900 rounded-md p-2 mb-3 border border-neutral-200 dark:border-neutral-800 inline-block">
                            <pre className="text-xs font-mono text-neutral-700 dark:text-neutral-300">
                                ALLOW_INSECURE_STORAGE=true
                            </pre>
                        </div>

                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-3 text-left">
                            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                                <strong className="font-semibold">Danger:</strong> Only use this for evaluation.
                                In this mode your secrets are stored{' '}
                                <strong>WITHOUT encryption</strong> and sent over an{' '}
                                <strong>UNENCRYPTED</strong> connection. Anyone on the same network, or anyone with
                                access to this machine, can read them. Never point real credentials at it. Switch
                                it back off and enable HTTPS before storing anything you care about.
                            </p>
                        </div>
                    </div>
                </div>

                {error?.stack && (
                    <details className="mt-4">
                        <summary className="text-xs text-neutral-400 cursor-pointer hover:text-neutral-600 dark:hover:text-neutral-300">
                            Technical details
                        </summary>
                        <pre className="mt-2 text-xs bg-red-50 dark:bg-red-900/30 p-3 rounded overflow-auto text-left text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap">
                            {error.stack}
                        </pre>
                    </details>
                )}
            </div>
        </div>
    );
};

export default InsecureOriginScreen;