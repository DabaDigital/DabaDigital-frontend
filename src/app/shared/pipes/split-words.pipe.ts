import { Pipe, type PipeTransform } from '@angular/core';

/**
 * Splits a translated string into words for word-by-word animation.
 *
 * Words, never characters: Arabic is a joined script, and wrapping each letter
 * in its own box breaks the joins — the text would render as isolated letter
 * forms. A word is the smallest unit that animates safely in all three locales.
 *
 * Punctuation stays attached to its word, so nothing is ever animated alone.
 * Pure, so Angular re-splits only when the language actually changes.
 */
@Pipe({ name: 'splitWords' })
export class SplitWordsPipe implements PipeTransform {
  transform(value: string | null | undefined): string[] {
    const text = value?.trim() ?? '';
    return text ? text.split(/\s+/u) : [];
  }
}
