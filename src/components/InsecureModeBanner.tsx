export const InsecureModeBanner: React.FC = () => (
    <div className="fixed left-0 right-0 top-0 z-[100] bg-red-600 text-white">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2 text-xs font-medium">
            <svg
                className="h-4 w-4 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
            </svg>
            <span>Insecure mode &#8212; secrets are NOT encrypted and this connection is not secure. Enable HTTPS before storing anything real.</span>
        </div>
    </div>
);

export default InsecureModeBanner;