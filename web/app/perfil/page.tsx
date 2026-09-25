'use client';

import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

type ProfileRow = {
  display_name: string | null;
  avatar_path: string | null;
  currency: string;
  budget_alerts_enabled: boolean;
  partner_activity_enabled: boolean;
};

type PartnerStatus = {
  partner_name: string | null;
  member_count: number;
  invite_code: string | null;
};

async function getAvatarUrl(path: string | null) {
  if (!path) return null;
  const { data, error } = await supabase.storage.from('avatars').createSignedUrl(path, 60 * 60);
  if (error) return null;
  return data.signedUrl;
}

function extensionFor(file: File) {
  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/webp') return 'webp';
  return 'jpg';
}

export default function PerfilPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [partnerStatus, setPartnerStatus] = useState<PartnerStatus | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const load = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const currentUser = sessionData.session?.user ?? null;

    if (!currentUser) {
      router.replace('/login');
      return;
    }

    const [profileResult, partnerResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('display_name, avatar_path, currency, budget_alerts_enabled, partner_activity_enabled')
        .eq('id', currentUser.id)
        .single(),
      supabase.rpc('get_partner_status'),
    ]);

    if (profileResult.error) {
      setErrorMessage(profileResult.error.message);
      setLoading(false);
      return;
    }

    const nextProfile = profileResult.data as ProfileRow;
    const status = (partnerResult.data?.[0] ?? null) as PartnerStatus | null;

    setUser(currentUser);
    setProfile(nextProfile);
    setPartnerStatus(status);
    setAvatarUrl(await getAvatarUrl(nextProfile.avatar_path));
    setLoading(false);
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !user || !profile) return;

    setErrorMessage('');

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrorMessage('La foto debe ser JPG, PNG o WEBP.');
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('La foto no puede superar 5 MB.');
      event.target.value = '';
      return;
    }

    setAvatarBusy(true);

    const path = user.id + '/avatar-' + Date.now() + '.' + extensionFor(file);
    const previousPath = profile.avatar_path;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, {
        contentType: file.type,
        upsert: false,
        cacheControl: '3600',
      });

    if (uploadError) {
      setAvatarBusy(false);
      setErrorMessage(uploadError.message);
      event.target.value = '';
      return;
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ avatar_path: path, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (profileError) {
      await supabase.storage.from('avatars').remove([path]);
      setAvatarBusy(false);
      setErrorMessage(profileError.message);
      event.target.value = '';
      return;
    }

    if (previousPath && previousPath !== path) {
      await supabase.storage.from('avatars').remove([previousPath]);
    }

    setProfile({ ...profile, avatar_path: path });
    setAvatarUrl(await getAvatarUrl(path));
    setAvatarBusy(false);
    event.target.value = '';
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  if (loading || !user || !profile) {
    return <main className="dashboardLoading"><p>Cargando perfil...</p></main>;
  }

  const displayName =
    profile.display_name ||
    user.user_metadata?.display_name ||
    user.email?.split('@')[0] ||
    'Usuario';

  const linked = Boolean(partnerStatus?.member_count && partnerStatus.member_count >= 2);

  return (
    <main className="profilePage">
      <header className="expenseTopbar">
        <a className="brand" href="/espacio">
          <span className="brandMark" aria-hidden="true"><span className="brandDollar">$</span></span>
          <span>MiFinanzas</span>
        </a>
        <a className="expenseBack" href="/espacio">← Inicio</a>
      </header>

      <section className="profileWrap">
        <div className="profileHeading">
          <div>
            <p className="eyebrow">TU CUENTA</p>
            <h1>Perfil</h1>
            <p>Cuenta, privacidad y organización.</p>
          </div>
        </div>

        <section className="profileHero">
          <button
            className="profileAvatarButton"
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={avatarBusy}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" />
            ) : (
              <span>{displayName.slice(0, 1).toUpperCase()}</span>
            )}
            <i>{avatarBusy ? '…' : '＋'}</i>
          </button>

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={(event) => void handleAvatar(event)}
          />

          <div className="profileIdentity">
            <h2>{displayName}</h2>
            <span>{user.email}</span>
            <small>{avatarBusy ? 'Actualizando foto...' : 'Haz clic en la foto para cambiarla'}</small>
          </div>

          <a className="profileEditButton" href="/ajustes">Editar cuenta</a>
        </section>

        {errorMessage ? <p className="formError profileError">{errorMessage}</p> : null}

        <div className="profileColumns">
          <section className="profileMenuCard">
            <div className="profileCardTitle">
              <p className="eyebrow">FINANZAS</p>
              <h2>Mi dinero</h2>
            </div>

            <a href="/presupuestos"><span>◎</span><div><b>Presupuestos</b><small>Límites personales y compartidos</small></div><i>→</i></a>
            <a href="/categorias"><span>◇</span><div><b>Categorías</b><small>Organiza en qué gastas</small></div><i>→</i></a>
            <a href="/metodos-pago"><span>▤</span><div><b>Métodos de pago</b><small>Yape, Plin, efectivo, tarjetas...</small></div><i>→</i></a>
            <a href="/deudas"><span>↕</span><div><b>Deudas</b><small>Deudas privadas e historial de liquidaciones</small></div><i>→</i></a>
          </section>

          <section className="profileMenuCard">
            <div className="profileCardTitle">
              <p className="eyebrow">CUENTA</p>
              <h2>Preferencias</h2>
            </div>

            <a href="/pareja">
              <span>♥</span>
              <div>
                <b>Pareja</b>
                <small>{linked ? 'Vinculado con ' + (partnerStatus?.partner_name || 'tu pareja') : partnerStatus?.invite_code ? 'Invitación pendiente' : 'No vinculada'}</small>
              </div>
              <i>→</i>
            </a>

            <a href="/ajustes"><span>⚙</span><div><b>Cuenta y preferencias</b><small>Nombre, moneda, avisos y privacidad</small></div><i>→</i></a>
            <a href="/datos"><span>🔒</span><div><b>Datos y seguridad</b><small>Privacidad, reinicio y cierre de sesión</small></div><i>→</i></a>
          </section>
        </div>

        <section className="profilePrivacy">
          <span>🔒</span>
          <div>
            <b>Tus datos personales son privados</b>
            <p>Solo se comparte lo que registras expresamente dentro del espacio Pareja.</p>
          </div>
        </section>

        <button className="profileLogout" type="button" onClick={() => void signOut()}>Cerrar sesión</button>
      </section>
    </main>
  );
}
