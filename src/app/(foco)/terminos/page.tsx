import Link from "next/link";
export const metadata = { title: "Términos y condiciones" };
export default function Terminos() {
  return (
    <div className="mx-auto max-w-xl space-y-4 px-5 py-10">
      <Link href="/planes" className="text-sm font-semibold underline">← Volver</Link>
      <h1 className="font-comic text-4xl tracking-wide">Términos y condiciones</h1>
      <p>Esta es una versión de demostración de Mixzine. El texto legal definitivo (condiciones de la suscripción, cancelación, tratamiento de datos personales conforme a la Ley 1581 de 2012 y licencias de música) está pendiente de redacción y revisión.</p>
      <p>Por ahora, todo lo que creas se guarda únicamente en tu dispositivo.</p>
    </div>
  );
}
