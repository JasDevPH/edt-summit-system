// FILE: app/test-upload/page.tsx
"use client";

import { useState } from "react";
import Image from "next/image";

export default function TestUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<any>(null);
  const [token, setToken] = useState("");

  const handleUpload = async () => {
    if (!file || !token) {
      alert("Please select a file and enter token");
      return;
    }

    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "test");
      formData.append("resourceType", "image");

      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      setResult(data);
    } catch {
      setResult({ success: false, message: "Upload failed" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Test File Upload</h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              JWT Token (login first at /api/auth/login)
            </label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Paste your JWT token here"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Select Image File
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full p-2 border rounded"
            />
          </div>

          <button
            onClick={handleUpload}
            disabled={uploading || !file || !token}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {uploading ? "Uploading..." : "Upload File"}
          </button>

          {result && (
            <div
              className={`p-4 rounded ${
                result.success ? "bg-green-50" : "bg-red-50"
              }`}
            >
              <h3 className="font-bold mb-2">
                {result.success ? "Success!" : "Error"}
              </h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
              {result.url && (
                <div className="mt-4">
                  <p className="font-medium mb-2">Uploaded Image:</p>
                  <div className="relative w-full h-64">
                    <Image
                      src={result.url}
                      alt="Uploaded"
                      fill
                      className="object-contain rounded"
                      unoptimized
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
