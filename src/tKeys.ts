import en from './locales/en';

/**
 * Typed key builder for `t()`.
 *
 * Instead of writing string literals like `t('settings.language')`, you can
 * write `t(T.settings.language)` and get:
 *   - IntelliSense at every dot (`T.settings.` autocompletes to real keys)
 *   - Compile-time errors on typos
 *   - Safe renames across the codebase (via Find All References)
 *
 * Leaf properties evaluate to the dotted string path that i18next expects
 * (e.g. `T.settings.language === 'settings.language'`).
 *
 * Container properties keep chaining, so `T.settings.themeDark` works.
 *
 * Implementation note:
 *   The runtime value is a Proxy whose `get` trap first delegates to the
 *   underlying dotted-path string (so `.length`, `.slice`, `.toString`,
 *   Symbol.iterator, and everything else on `String.prototype` behave
 *   correctly — this is what fixes i18next's `key.length` access).
 *   Only *new* string properties that aren't already on `String.prototype`
 *   continue extending the path.
 */

// Recursive type that mirrors the resource tree, with string leaves replaced
// by the dotted path string.
type TKeyTree<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string
    ? // Leaf: the dotted key path is a string suitable for t()
      `${Prefix}${K}` & string
    : // Branch: keep drilling, but the branch itself is also a valid key
      TKeyTree<T[K], `${Prefix}${K}.`> & (`${Prefix}${K}` & string);
};

function makeProxy(path = ''): any {
  // A String object holds the current dotted path and is the proxy target.
  // Using a String object (rather than a primitive) means the proxy can
  // transparently expose all `String.prototype` members (`length`, `slice`,
  // `startsWith`, `Symbol.iterator`, etc.) to consumers like i18next.
  const target: any = new String(path);

  return new Proxy(target, {
    // When coerced to a primitive (e.g. React children, `+`, template
    // strings, i18next reading the raw key), return the dotted string.
    get(t, prop, receiver) {
      if (prop === Symbol.toPrimitive) return () => path;
      if (prop === 'toString' || prop === 'valueOf') return () => path;

      // Delegate anything that already exists on the String target
      // (length, slice, startsWith, Symbol.iterator, ...) to the string.
      if (prop in t) {
        const value = Reflect.get(t, prop, receiver);
        return typeof value === 'function' ? value.bind(path) : value;
      }

      // Otherwise treat the access as extending the i18n key path.
      if (typeof prop === 'symbol') return undefined;
      const next = path ? `${path}.${prop}` : prop;
      return makeProxy(next);
    },
  });
}

// The public accessor. Cast the runtime proxy to the derived tree type.
const T = makeProxy() as TKeyTree<typeof en>;

export default T;
export type { TKeyTree };
