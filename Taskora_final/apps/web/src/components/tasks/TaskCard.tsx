"use client";

import { Task } from "@/types";

type TaskCardProps = {
    task: Task;
    onEdit?: (task: Task) => void;
    onDelete?: (task: Task) => void;
};

export function TaskCard({
    task,
    onEdit,
    onDelete,
}: TaskCardProps) {
    return (
        <div className="bg-white p-4 rounded-xl border shadow-sm space-y-3">
            <h3 className="font-semibold text-lg">{task.title}</h3>

            <p className="text-sm text-gray-600">
                {task.description}
            </p>

            <div className="flex gap-2">
                <button
                    onClick={() => onEdit?.(task)}
                    className="px-3 py-1 bg-blue-600 text-white rounded"
                >
                    Edit
                </button>

                <button
                    onClick={() => onDelete?.(task)}
                    className="px-3 py-1 bg-red-600 text-white rounded"
                >
                    Delete
                </button>
            </div>
        </div>
    );
}