import { Preset } from '@unocss/core';

interface Selectors {
    [themeName: string]: string;
}
interface PresetThemeOptions<Theme extends Record<string, any>> {
    /**
     * Multiple themes
     */
    theme: Record<string, Theme>;
    /**
     * The prefix of the generated css variables
     * @default --un-preset-theme
     */
    prefix?: string;
    /**
     * Customize the selectors of the generated css variables
     * @default { light: ':root', [themeName]: '.[themeName]' }
     */
    selectors?: Selectors;
}
/**
 * @deprecated use `PresetThemeOptions` instead
 * @see PresetThemeOptions
 */
type PresetTheme<Theme extends Record<string, any>> = PresetThemeOptions<Theme>;
declare function presetTheme<T extends Record<string, any>>(options: PresetThemeOptions<T>): Preset<T>;

export { type PresetTheme, type PresetThemeOptions, presetTheme as default, presetTheme };
