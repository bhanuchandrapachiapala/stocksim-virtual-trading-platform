import { Suspense } from 'react'
import { RegisterForm } from './_components/RegisterForm'

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  )
}
