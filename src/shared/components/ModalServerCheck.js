import { useEffect, useState } from "react";
import { ENDPOINT_BASE_URL, checkAndSelectBackend } from "../config";

export default function ServerCheckModal({ onBackendReady }) {
  const [checkServer, setCheckServer] = useState(true);
  const [loading, setLoading] = useState(true);
  const [ping, setPing] = useState(false);
  const [activeBackend, setActiveBackend] = useState(ENDPOINT_BASE_URL);

  const pingServer = async () => {
    setLoading(true);
    try {
      const result = await checkAndSelectBackend();
      setActiveBackend(result.url);
      if (result.success) {
        setPing(true);
        if (onBackendReady) {
          onBackendReady(result.url);
        }
      } else {
        setPing(false);
      }
    } catch (error) {
      setPing(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      pingServer();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (!checkServer) {
    return null;
  }

  const cleanBackendName = (activeBackend || "").replace(/^https?:\/\//, "");

  return (
    <div className="bg-black bg-opacity-50 fixed top-0 left-0 w-full h-full z-40">
      <div className="fixed top-1/4 left-1/2 w-[90%] max-w-md transform -translate-x-1/2 -translate-y-1/2 text-center bg-white rounded-xl shadow-2xl p-6 z-50 border border-gray-200">
        <h3 className="text-center font-bold text-lg mb-4 text-gray-800">
          Memeriksa Koneksi Server...
        </h3>

        {loading && (
          <div className="my-6">
            <div className="flex justify-center mb-2">
              <div
                className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-green-600 rounded-full"
                role="status"
                aria-label="loading"
              >
                <span className="sr-only">Sedang memeriksa...</span>
              </div>
            </div>
            <p className="text-xs text-gray-500">Mengecek ketersediaan backend...</p>
          </div>
        )}

        {!loading && ping && (
          <div className="my-4">
            <h3 className="text-center font-bold text-green-600 text-lg mb-1">
              Server Terhubung ✅
            </h3>
            <p className="text-xs text-gray-500 mb-6 bg-gray-50 py-1.5 px-3 rounded-full inline-block border border-gray-100">
              🔗 {cleanBackendName}
            </p>
          </div>
        )}

        {!loading && !ping && (
          <div className="my-4">
            <h3 className="text-center text-red-500 font-bold text-lg mb-2">
              ❌ Server Tidak Terhubung!
            </h3>
            <p className="text-xs text-red-600 mb-2">
              Gagal menghubungi backend di:
            </p>
            <p className="text-xs font-mono bg-red-50 text-red-700 py-1 px-2 rounded mb-4 break-all">
              {cleanBackendName || "api-jimpitan.roniadiatmoko.my.id"}
            </p>
            <button
              onClick={pingServer}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-4 rounded text-sm mb-2 shadow"
            >
              🔄 Coba Periksa Lagi
            </button>
            <p className="text-[11px] text-gray-400 mt-2">
              Pastikan backend atau tunnel lokal Anda sedang menyala.
            </p>
          </div>
        )}

        {/* Tombol Lanjut */}
        {!loading && ping && (
          <button
            onClick={() => setCheckServer(false)}
            className="bg-green-600 py-3 px-4 font-bold w-full text-lg rounded-lg text-white hover:bg-green-700 shadow-md transition"
          >
            Lanjut Menjimpit
          </button>
        )}
      </div>
    </div>
  );
}
