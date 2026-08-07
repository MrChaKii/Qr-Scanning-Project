import React, { useState } from "react";

const BREAK_TYPES = [
  { value: "BREAKFAST",       label: "Breakfast" },
  { value: "LUNCH",           label: "Lunch" },
  { value: "TEA",             label: "Tea" },
  { value: "CLOTHES",         label: "Clothes" },
  { value: "MORNING MEETING", label: "Morning Meeting" },
];

/**
 * Convert "HH:MM" to total minutes since midnight.
 */
const toMinutes = (hhmm) => {
  if (!hhmm) return 0;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/**
 * Compute human-readable duration label from two "HH:MM" strings.
 */
const durationLabel = (start, end) => {
  const diff = toMinutes(end) - toMinutes(start);
  if (diff <= 0) return "";
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m} min`;
};

export const BreakForm = ({ initialData, onSuccess, onCancel }) => {
  const safeData = initialData || {};

  const [breakType,  setBreakType]  = useState(safeData.breakType  || "");
  const [startTime,  setStartTime]  = useState(safeData.startTime  || "");
  const [endTime,    setEndTime]    = useState(safeData.endTime    || "");
  const [error,      setError]      = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!breakType) {
      setError("Please select a break type.");
      return;
    }
    if (!startTime) {
      setError("Start time is required.");
      return;
    }
    if (!endTime) {
      setError("End time is required.");
      return;
    }
    if (toMinutes(endTime) <= toMinutes(startTime)) {
      setError("End time must be after start time.");
      return;
    }

    onSuccess({ breakType, startTime, endTime });
  };

  const preview = startTime && endTime && toMinutes(endTime) > toMinutes(startTime)
    ? durationLabel(startTime, endTime)
    : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Break type */}
      <div>
        <label className="block text-sm font-medium mb-1">Break Type</label>
        <select
          value={breakType}
          onChange={(e) => setBreakType(e.target.value)}
          required
          className="w-full border rounded px-2 py-1"
        >
          <option value="">Select break type</option>
          {BREAK_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Time range */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Start Time</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">End Time</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
            className="w-full border rounded px-2 py-1"
          />
        </div>
      </div>

      {/* Live duration preview */}
      {preview && (
        <p className="text-sm text-slate-500">
          Duration: <span className="font-medium text-slate-700">{preview}</span>
        </p>
      )}

      {/* Validation error */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <div className="flex space-x-2">
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Save
        </button>
        <button
          type="button"
          className="bg-gray-300 px-4 py-2 rounded"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};
