import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { PlaygroundSection } from '../PlaygroundSection';
import { Button, useBottomSheet } from '../../../controls';
import notificationService from '../../../services/NotificationService';
import { GLOBAL_NOTIFICATION_CHANNEL } from '../../../constants/constants';

interface FeedbackSubmission {
    score: number;
    note: string;
}

const feedbackRatingScale = Array.from({ length: 11 }, (_, index) => index);

const FeedbackSheetContent: React.FC<{ onSubmit: (submission: FeedbackSubmission) => void }> = ({
    onSubmit,
}) => {
    const [score, setScore] = useState<number | null>(null);
    const [note, setNote] = useState('');

    return (
        <div className="space-y-5">
            <div className="space-y-1.5">
                <p className="text-base font-semibold text-slate-800">
                    How likely are you to recommend us to a colleague?
                </p>
                <p className="text-sm text-slate-500">
                    0 means not at all likely and 10 is extremely likely.
                </p>
            </div>
            <div className="flex flex-wrap gap-2">
                {feedbackRatingScale.map((value) => (
                    <button
                        key={value}
                        type="button"
                        className={`h-10 w-10 rounded-full border text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-200 ${score === value
                            ? 'border-blue-500 bg-blue-500 text-white'
                            : 'border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600'
                            }`}
                        onClick={() => setScore(value)}
                    >
                        {value}
                    </button>
                ))}
            </div>
            {score !== null && (
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700" htmlFor="feedback-notes">
                        Tell us a bit more
                    </label>
                    <textarea
                        id="feedback-notes"
                        className="h-28 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700 shadow-sm transition placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        placeholder="What made you choose that score?"
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                    />
                </div>
            )}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500">
                    We read every response and use it to guide our roadmap.
                </p>
                <Button
                    size="sm"
                    color="blue"
                    disabled={score === null}
                    onClick={() => {
                        if (score === null) {
                            return;
                        }
                        onSubmit({ score, note: note.trim() });
                    }}
                >
                    Finish
                </Button>
            </div>
        </div>
    );
};

export const BottomSheetDemo: React.FC = () => {
    const { presentSheet } = useBottomSheet();

    const handleFeedbackSubmit = (submission: FeedbackSubmission) => {
        notificationService.createNotification({
            id: uuidv4(),
            message: `Thanks for rating us ${submission.score}/10`,
            details: submission.note || 'No additional comments provided.',
            autoClose: true,
            dismissible: true,
            showAsToast: true,
            channel: GLOBAL_NOTIFICATION_CHANNEL,
        });
    };

    const openFeedbackSheet = () => {
        presentSheet({
            title: 'Share your feedback',
            description: 'Trigger the bottom sheet anywhere through the global controller.',
            content: ({ dismiss }) => (
                <FeedbackSheetContent
                    onSubmit={(submission) => {
                        handleFeedbackSubmit(submission);
                        dismiss();
                    }}
                />
            ),
            actions: ({ dismiss }) => (
                <Button variant="ghost" color="slate" size="md" onClick={dismiss}>
                    Not now
                </Button>
            ),
        });
    };

    return (
        <PlaygroundSection
            title="Feedback Prompt"
            label="[BottomSheet]"
            description="Trigger the universal bottom sheet controller with any body/actions."
            controls={
                <div className="space-y-4">
                    <p className="text-sm text-neutral-500 dark:text-neutral-300">
                        Press the preview button to open the live bottom sheet overlay.
                    </p>
                    <Button variant="soft" color="blue" onClick={openFeedbackSheet}>
                        Preview Feedback Sheet
                    </Button>
                </div>
            }
            preview={
                <div className="space-y-3 text-sm text-neutral-500 dark:text-neutral-300">
                    <p>
                        The preview lives outside of this panel. Use the button in the controls column to open
                        the overlay.
                    </p>
                    <p>The sheet adapts to screen size and supports custom actions/body content.</p>
                </div>
            }
        />
    );
};
