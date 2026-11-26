export default function CheckoutLoading() {
  return (
    <div className="flex flex-1 items-center justify-center min-h-screen bg-[#f5f5f5]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-3 border-[#E8622C] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-[#666]">Chargement...</p>
      </div>
    </div>
  );
}
