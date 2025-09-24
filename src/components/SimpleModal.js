export default function SimpleModal({content, onClose}) {
  return (
    <div className="bg-black bg-opacity-50 fixed top-0 left-0 w-full h-full z-40">
      <div className="fixed top-1/2 left-1/2 w-[90%] transform -translate-x-1/2 -translate-y-1/2 text-center bg-white rounded-lg p-5 z-50">
        {content}
        <button
          className="p-4 mb-5 float-right rounded-xl text-white font-bold bg-gray-600 hover:bg-blue-700"
          onClick={onClose}
        >
          <span>Tutup</span>
        </button>
      </div>
    </div>
  );
}
