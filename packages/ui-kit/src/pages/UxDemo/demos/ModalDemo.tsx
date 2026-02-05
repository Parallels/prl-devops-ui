import React, { useState } from 'react';
import { Modal, Button, Input, Select } from '../../..';
import { PlaygroundSection } from '../PlaygroundSection';

export const ModalDemo: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [title, setTitle] = useState('Example Modal');
    const [description, setDescription] = useState('This is a description for the modal.');
    const [size, setSize] = useState<'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full'>('md');

    return (
        <PlaygroundSection
            title="Modal"
            label="[Modal]"
            description="A dialog window that sits on top of the main content."
            controls={
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-neutral-500">State</label>
                        <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-neutral-500">Title</label>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-neutral-500">Description</label>
                        <Input value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-neutral-500">Size</label>
                        <Select value={size} onChange={(e) => setSize(e.target.value as 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full')}>
                            <option value="xs">XS</option>
                            <option value="sm">SM</option>
                            <option value="md">MD</option>
                            <option value="lg">LG</option>
                            <option value="xl">XL</option>
                            <option value="full">Full</option>
                        </Select>
                    </div>
                </div>
            }
            preview={
                <div className="flex h-12 items-center justify-center rounded border border-neutral-200 bg-white px-4 dark:border-neutral-700 dark:bg-neutral-800">
                    <span className="text-sm text-neutral-500">Click &quot;Open Modal&quot; to see the modal.</span>
                    <Modal
                        isOpen={isOpen}
                        onClose={() => setIsOpen(false)}
                        title={title}
                        description={description}
                        size={size}
                    >
                        <div className="p-4">
                            <p className="text-neutral-600 dark:text-neutral-300">
                                This is the modal content. You can put anything here.
                            </p>
                            <div className="mt-4 flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setIsOpen(false)}>
                                    Cancel
                                </Button>
                                <Button variant="solid" onClick={() => setIsOpen(false)}>
                                    Confirm
                                </Button>
                            </div>
                        </div>
                    </Modal>
                </div>
            }
        />
    );
};
