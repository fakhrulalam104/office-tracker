import { RegisterForm } from "@/components/Auth/RegisterForm";

export default async function RegisterPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.14),_transparent_34%),linear-gradient(180deg,#f8fafc_0%,#f8fafc_100%)] px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center">
        <RegisterForm />
      </div>
    </main>
  );
}
