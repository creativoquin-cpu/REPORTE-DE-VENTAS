import { LoginForm } from "@/components/LoginForm";

export default function AdminLoginPage() {
  return (
    <div className="grid min-h-dvh place-items-center p-6" data-quin-theme="admin">
      <div className="w-full max-w-[360px] rounded-2xl border border-d-sup-3 bg-d-sup p-8">
        <h1 className="text-[22px] font-black text-d-txt">Agencia Quin</h1>
        <p className="mt-0.5 mb-5 text-sm text-d-txt-2">Panel de administrador</p>
        <LoginForm />
      </div>
    </div>
  );
}
