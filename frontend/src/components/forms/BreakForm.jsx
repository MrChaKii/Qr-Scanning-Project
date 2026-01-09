import React, { useState } from "react";

const BREAK_TYPES = [
  { value: "BREAKFAST", label: "Breakfast" },
  { value: "LUNCH", label: "Lunch" },
  { value: "TEA", label: "Tea" },
  { value: "CLOTHES", label: "Clothes" },
];

export const BreakForm = ({ initialData, onSuccess, onCancel }) => {
  const safeData = initialData || {};
  const [breakType, setBreakType] = useState(safeData.breakType || "");
  // Helper to get local time string (hh:mm) from ISO string
  const getLocalTimeString = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    // Get local hours and minutes
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const [startTime, setStartTime] = useState(
    safeData.startTime ? getLocalTimeString(safeData.startTime) : ""
  );
  const [endTime, setEndTime] = useState(
    safeData.endTime ? getLocalTimeString(safeData.endTime) : ""
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    // Combine selected time with today's date for valid ISO string
    const today = new Date();
    const getDateTime = (time) => {
      if (!time) return null;
      const [hours, minutes] = time.split(":");
      const date = new Date(today);
      date.setHours(Number(hours), Number(minutes), 0, 0);
      return date.toISOString();
    };
    onSuccess({
      breakType,
      startTime: getDateTime(startTime),
      endTime: getDateTime(endTime),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Break Type</label>
        <select
          value={breakType}
          onChange={(e) => setBreakType(e.target.value)}
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
      <div>
        <label className="block text-sm font-medium mb-1">Start Time</label>
        <input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="w-full border rounded px-2 py-1"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">End Time</label>
        <input
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          className="w-full border rounded px-2 py-1"
        />
      </div>
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
