export default function HamburgerButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 active:scale-95"
    >
      <div className="w-5 h-[2px] bg-gray-800 mb-[4px] rounded"></div>
      <div className="w-5 h-[2px] bg-gray-800 mb-[4px] rounded"></div>
      <div className="w-5 h-[2px] bg-gray-800 rounded"></div>
    </button>
  );
}
