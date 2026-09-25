'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  icon: string;
};

const ICONS = ['🍽️', '🚕', '🏠', '🎬', '❤️', '🛍️', '💡', '📚', '🐶', '✈️', '🎁', '💳', '🏋️', '☕', '📦'];

function slugify(value: string) {
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || 'categoria-' + Date.now();
}

export default function CategoriasPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📦');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadCategories = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const currentUser = sessionData.session?.user ?? null;

    if (!currentUser) {
      router.replace('/login');
      return;
    }

    const { data, error } = await supabase
      .from('expense_categories')
      .select('id, slug, name, icon')
      .order('created_at', { ascending: true });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    setUser(currentUser);
    setCategories((data ?? []) as CategoryRow[]);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('web-categories-' + user.id)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expense_categories' },
        () => void loadCategories(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, loadCategories]);

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');

    if (!user) {
      router.replace('/login');
      return;
    }

    const cleanName = name.trim();

    if (!cleanName) {
      setErrorMessage('Escribe un nombre para la categoría.');
      return;
    }

    if (categories.some((item) => item.name.toLowerCase() === cleanName.toLowerCase())) {
      setErrorMessage('Ya existe una categoría con ese nombre.');
      return;
    }

    let slug = slugify(cleanName);
    if (categories.some((item) => item.slug === slug)) {
      slug += '-' + Date.now().toString().slice(-6);
    }

    setSaving(true);

    const { error } = await supabase.from('expense_categories').insert({
      user_id: user.id,
      slug,
      name: cleanName,
      icon,
    });

    setSaving(false);

    if (error) {
      setErrorMessage(error.message || 'No se pudo crear la categoría.');
      return;
    }

    setName('');
    setIcon('📦');
    await loadCategories();
  }

  async function handleDelete(category: CategoryRow) {
    setErrorMessage('');

    if (!user) return;

    if (categories.length <= 1) {
      setErrorMessage('Debes conservar al menos una categoría.');
      return;
    }

    const confirmed = window.confirm(
      '¿Eliminar “' + category.name + '”? Los gastos anteriores conservarán esta categoría en su historial.',
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from('expense_categories')
      .delete()
      .eq('id', category.id)
      .eq('user_id', user.id);

    if (error) {
      setErrorMessage(error.message || 'No se pudo eliminar la categoría.');
      return;
    }

    await loadCategories();
  }

  if (loading || !user) {
    return (
      <main className="dashboardLoading">
        <p>Cargando categorías...</p>
      </main>
    );
  }

  return (
    <main className="categoriesPage">
      <header className="expenseTopbar">
        <a className="brand" href="/dashboard">
          <span className="brandMark" aria-hidden="true">
            <span className="brandDollar">$</span>
          </span>
          <span>MiFinanzas</span>
        </a>
        <a className="expenseBack" href="/dashboard">← Mi dinero</a>
      </header>

      <section className="categoriesWrap">
        <div className="categoriesHeading">
          <div>
            <p className="eyebrow">PERSONALIZA TU APP</p>
            <h1>Categorías</h1>
            <p>Crea las categorías que necesites y elimina las que ya no uses.</p>
          </div>
          <span className="categoriesCount">{categories.length} categorías</span>
        </div>

        <div className="categoriesGrid">
          <form className="categoryCreateCard" onSubmit={handleAdd}>
            <div>
              <label htmlFor="category-name">Nombre</label>
              <input
                id="category-name"
                type="text"
                placeholder="Ej. Mascota, Viajes, Gimnasio..."
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={30}
                required
              />
            </div>

            <div>
              <span className="categoryFieldLabel">Icono</span>
              <div className="categoryIconPicker">
                {ICONS.map((item) => (
                  <button
                    key={item}
                    className={icon === item ? 'categoryIconChoice active' : 'categoryIconChoice'}
                    type="button"
                    onClick={() => setIcon(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="categoryPreview">
              <span className="categoryPreviewIcon">{icon}</span>
              <div>
                <small>Vista previa</small>
                <b>{name.trim() || 'Nueva categoría'}</b>
              </div>
            </div>

            {errorMessage ? <p className="formError categoryError">{errorMessage}</p> : null}

            <button className="primaryButton categoryAddButton" type="submit" disabled={saving}>
              {saving ? 'Creando...' : '＋ Agregar categoría'}
            </button>
          </form>

          <section className="categoryListCard">
            <div className="categoryListHeader">
              <div>
                <p className="eyebrow">MIS CATEGORÍAS</p>
                <h2>Disponibles</h2>
              </div>
              <span>{categories.length}</span>
            </div>

            <div className="categoryList">
              {categories.map((category) => (
                <article className="categoryRowWeb" key={category.id}>
                  <span className="categoryRowIcon">{category.icon}</span>
                  <div>
                    <b>{category.name}</b>
                    <small>{category.slug}</small>
                  </div>
                  <button type="button" onClick={() => void handleDelete(category)}>
                    Eliminar
                  </button>
                </article>
              ))}
            </div>

            <p className="categoryNote">
              Debes conservar al menos una categoría. Eliminar una categoría no borra los gastos anteriores.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
