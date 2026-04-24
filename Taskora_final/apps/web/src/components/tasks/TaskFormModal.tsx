"use client";

import { useState } from "react";
import { TaskStatus } from "@/types";

type Values = {
    title: string;
    description?: string;
    status: TaskStatus;
};

type Props = {
    open: boolean;
    onClose: () => void;
    onSubmit: (values: {
        title: string;
        description?: string;
        status: TaskStatus;
    }) => void;
    defaultValues?: {
        title?: string;
        description?: string;
        status?: TaskStatus;
    };
    isEdit?: boolean;
};

export function TaskFormModal({
    open,
    onClose,
    onSubmit,
}: Props) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState<TaskStatus>("TODO");

    if (!open) return null;

    async function handleSubmit() {
        await onSubmit({
            title,
            description,
            status,
        });

        onClose();
    }

    return (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
            <div className="bg-white p-6 rounded-xl w-full max-w-md space-y-4">
                <h2 className="text-xl font-bold">Create Task</h2>

                <input
                    className="w-full border p-2 rounded"
                    placeholder="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />

                <textarea
                    className="w-full border p-2 rounded"
                    placeholder="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />

                <select
                    className="w-full border p-2 rounded"
                    value={status}
                    onChange={(e) =>
                        setStatus(e.target.value as TaskStatus)
                    }
                >
                    <option value="TODO">TODO</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="DONE">DONE</option>
                </select>

                <div className="flex gap-2 justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border rounded"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleSubmit}
                        className="px-4 py-2 bg-blue-600 text-white rounded"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}