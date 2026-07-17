/**
 * Contexto de género para o i18next: quando a utilizadora é mulher, as chaves
 * com variante `_female` são usadas (ex.: privacy.closeFriends_female = "Sis"
 * em vez de "Bradas" na linguagem da banda). Sem variante, cai na chave base.
 */
export function genderCtx(gender?: string | null): { context?: string } {
  return gender === 'female' ? { context: 'female' } : {};
}
