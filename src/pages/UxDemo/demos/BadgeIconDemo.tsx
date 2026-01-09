import React, { useState } from 'react';
import { BadgeIcon, Input, Select, Toggle } from '../../../controls';
import { PlaygroundSection } from '../PlaygroundSection';

export const BadgeIconDemo: React.FC = () => {
    const [badgeIconCount, setBadgeIconCount] = useState(5);
    const [badgeIconPosition, setBadgeIconPosition] = useState<
        'top-start' | 'top-end' | 'bottom-start' | 'bottom-end'
    >('top-end');
    const [badgeIconDot, setBadgeIconDot] = useState(false);

    return (
        <PlaygroundSection
            title="BadgeIcon"
            label="[BadgeIcon]"
            description="An icon button with a badge indicator."
            controls={
                <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-neutral-500">Badge Count</label>
                            <Input
                                type="number"
                                value={badgeIconCount.toString()}
                                onChange={(e) => setBadgeIconCount(Number(e.target.value))}
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-neutral-500">Position</label>
                            <Select
                                value={badgeIconPosition}
                                onChange={(e) => setBadgeIconPosition(e.target.value as 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end')}
                            >
                                <option value="top-start">Top Start</option>
                                <option value="top-end">Top End</option>
                                <option value="bottom-start">Bottom Start</option>
                                <option value="bottom-end">Bottom End</option>
                            </Select>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-4">
                        <Toggle
                            label="Dot Only"
                            checked={badgeIconDot}
                            onChange={(e) => setBadgeIconDot(e.target.checked)}
                        />
                    </div>
                </div>
            }
            preview={
                <div className="flex items-center justify-center gap-8 p-8">
                    <BadgeIcon
                        icon="Notification"
                        badgeCount={badgeIconCount}
                        badgeDot={badgeIconDot}
                        badgePosition={badgeIconPosition}
                        onClick={() => { }}
                    />
                    <BadgeIcon
                        icon="Chat"
                        badgeCount={badgeIconCount}
                        badgeDot={badgeIconDot}
                        badgePosition={badgeIconPosition}
                        color="emerald"
                        onClick={() => { }}
                    />
                </div>
            }
        />
    );
};
