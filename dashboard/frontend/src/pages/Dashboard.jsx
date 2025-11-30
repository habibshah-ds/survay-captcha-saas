import React from "react";

export default function Dashboard() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-4 text-gray-700">
        This is your base dashboard. Now you can add:
      </p>

      <ul className="list-disc pl-5 mt-2">
        <li>Survey Question Editor</li>
        <li>Charts & Analytics</li>
        <li>API Keys UI</li>
        <li>Subscription & Billing</li>
        <li>Admin Panel</li>
      </ul>
    </div>
  );
}
