import React, { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Login() {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState("");

  const submit = () => {
    login({ email }); // fake login for now
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-200">
      <div className="bg-white p-8 shadow-md rounded-lg w-96">
        <h2 className="text-xl font-bold mb-4">Login</h2>

        <input
          className="w-full border p-2 mb-4"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          onClick={submit}
          className="w-full bg-blue-600 text-white p-2 rounded"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
