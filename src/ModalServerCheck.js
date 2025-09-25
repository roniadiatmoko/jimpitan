import { useEffect, useState } from "react";
import { ENDPOINT_BASE_URL } from "./config";

export default function ServerCheckModal() {
  const [checkServer, setCheckServer] = useState(true);
  const [loading, setLoading] = useState(true);
  const [ping, setPing] = useState(false);

  const pingServer = async () => {
    try {
        await fetch(ENDPOINT_BASE_URL);
        setPing(true);
        setLoading(false);
    }catch (error) {
        setPing(false);
        setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
        pingServer();
    }, 1000)
  }, []);

  if (!checkServer) {
    return null;
  }

  return (
    <div className="bg-black bg-opacity-50 fixed top-0 left-0 w-full h-full z-40">
      <div className="fixed top-1/4 left-1/2 w-[90%] transform -translate-x-1/2 -translate-y-1/2 text-center bg-green-100 rounded-lg p-5 z-50">
        <h3 className="text-center bold mb-10">Memeriksa server...</h3>

        {
            loading ? (
                <div className="flex justify-center">
                    <div className="animate-spin inline-block w-6 h-6 border-[3px] border-current border-t-transparent text-blue-600 rounded-full" role="status" aria-label="loading">
                        <span className="sr-only">Sedang memeriksa...</span>
                    </div>
                </div>
            ) : ("")
        }

        {
            ping ? (
                <h3 className="text-center bold mb-10">Server terhubung ✅</h3>
            ) : (!loading && !ping ? (
                <div>
                    <h3 className="text-center text-red-500 bold mb-10"> ❌ &nbsp; Server tidak terhubung! <br/><span className="text-red-600">&nbsp; &nbsp; Hubungi PJ Jimpitan </span></h3>
                    
                </div>
                ) : ("")
            )
        }

        {/* footer */}
        {ping ? (
          <button
            onClick={() => setCheckServer(false)}
            className="bg-green-300 py-2 px-4 font-bold w-full text-2xl rounded text-green-900 hover:bg-green-400"
          >
            Lanjut menjimpit
          </button>
        ) : (
          ""
        )}
      </div>
    </div>
  );
}
