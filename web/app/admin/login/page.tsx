import { LoginForm } from "@/components/LoginForm";
import { LogoQuin, Quino } from "@/components/Marca";

/**
 * Login con la estética "Jornada Quin" (mockup): dos columnas sobre fondo claro
 * con grilla decorativa. Izquierda, Quino con un glow teal, el logo y un copy;
 * derecha, la tarjeta de acceso (soft-card) con el formulario real de Supabase.
 */
export default function AdminLoginPage() {
  return (
    <div
      className="relative grid min-h-dvh place-items-center overflow-hidden p-6"
      data-quin-theme="admin"
    >
      <div className="decor-grid" />
      <div className="relative grid w-full max-w-[1000px] items-center gap-10 lg:grid-cols-2">
        <div className="text-center lg:text-left">
          <div className="relative inline-block">
            <div className="absolute inset-8 rounded-full bg-turquesa/40 blur-3xl" />
            <Quino emocion="bienvenida" alto={260} className="relative mx-auto" priority />
          </div>
          <p className="eyebrow mt-2">Control diario de ventas</p>
          <div className="mt-3 flex justify-center lg:justify-start">
            <LogoQuin tono="claro" alto={58} priority />
          </div>
          <p className="mx-auto mt-4 max-w-lg text-[17px] leading-relaxed text-d-txt-2 lg:mx-0">
            Todas las ventas de la agencia, claras y reunidas en un solo lugar.
          </p>
        </div>

        <div className="soft-card p-8">
          <div className="mb-6 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-tinta text-white">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <div>
              <h1 className="text-2xl font-black text-d-txt">Entrar al panel</h1>
              <p className="mt-1 text-sm text-d-txt-2">Acceso solo para administración.</p>
            </div>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
