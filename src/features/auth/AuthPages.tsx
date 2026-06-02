import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, KeyRound, Mail } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { BrandMark, BrandSolo } from '../../components/layout/BrandMark';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Field, TextInput } from '../../components/ui/Form';
import { useToast } from '../../components/ui/Toast';
import { supabase } from '../../lib/supabase';
import { authSchema } from '../../lib/validations';
import { useAuth } from './AuthProvider';

type AuthValues = z.infer<typeof authSchema>;

function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center overflow-hidden px-4 py-10">
      <div className="w-full max-w-full sm:max-w-2xl">
        <div className="mb-7 text-center">
          <div className="mb-5 hidden sm:block">
            <BrandMark variant="auth" />
          </div>
          <div className="mb-5 flex justify-center sm:hidden">
            <BrandSolo variant="mobile" />
          </div>
        </div>
        <div className="mx-auto w-full max-w-[calc(100vw-2rem)] sm:max-w-md">
          <Card title={title}>{children}</Card>
        </div>
      </div>
    </main>
  );
}

export function LoginPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<AuthValues>({ resolver: zodResolver(authSchema) });

  if (session) return <Navigate to="/dashboard" replace />;

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(values);
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate('/dashboard');
  });

  const resetPassword = async () => {
    const email = getValues('email');
    if (!email) {
      toast.error('Escribe tu email para recuperar la contraseña');
      return;
    }
    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/login` });
    setResetLoading(false);
    if (error) toast.error(error.message);
    else toast.success('Revisa tu bandeja para continuar');
  };

  return (
    <AuthShell title="Iniciar sesión">
      <form className="grid gap-4" onSubmit={onSubmit}>
        <Field label="Email" error={errors.email?.message}>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-textMuted" />
            <TextInput className="nexo-input pl-11" type="email" placeholder="tu@email.com" {...register('email')} />
          </div>
        </Field>
        <Field label="Contraseña" error={errors.password?.message}>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-textMuted" />
            <TextInput className="nexo-input pl-11" type="password" placeholder="••••••••" {...register('password')} />
          </div>
        </Field>
        <Button type="submit" isLoading={loading} icon={<ArrowRight className="h-4 w-4" />}>
          Entrar
        </Button>
      </form>
      <div className="mt-5 grid gap-3 text-sm sm:flex sm:flex-wrap sm:items-center sm:justify-between">
        <button className="text-textMuted hover:text-accent" type="button" onClick={resetPassword} disabled={resetLoading}>
          Recuperar contraseña
        </button>
        <Link className="font-semibold text-accent hover:text-cyan-100" to="/register">
          Crear cuenta
        </Link>
      </div>
    </AuthShell>
  );
}

export function RegisterPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthValues>({ resolver: zodResolver(authSchema) });

  if (session) return <Navigate to="/dashboard" replace />;

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);
    const { error } = await supabase.auth.signUp(values);
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Cuenta creada. Si Supabase exige confirmación, revisa tu email.');
    navigate('/dashboard');
  });

  return (
    <AuthShell title="Crear cuenta">
      <form className="grid gap-4" onSubmit={onSubmit}>
        <Field label="Email" error={errors.email?.message}>
          <TextInput type="email" placeholder="tu@email.com" {...register('email')} />
        </Field>
        <Field label="Contraseña" error={errors.password?.message}>
          <TextInput type="password" placeholder="Mínimo 6 caracteres" {...register('password')} />
        </Field>
        <Button type="submit" isLoading={loading} icon={<ArrowRight className="h-4 w-4" />}>
          Registrarme
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-textMuted">
        ¿Ya tienes cuenta?{' '}
        <Link className="font-semibold text-accent hover:text-cyan-100" to="/login">
          Inicia sesión
        </Link>
      </p>
    </AuthShell>
  );
}

