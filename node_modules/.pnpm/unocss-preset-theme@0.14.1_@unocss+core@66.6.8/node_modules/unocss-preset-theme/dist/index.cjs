'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const core = require('@unocss/core');
const ruleUtils = require('@unocss/rule-utils');

function wrapVar(name, fallback) {
  return fallback ? `var(${name}, ${fallback})` : `var(${name})`;
}
function wrapCSSFunction(name, v, alpha) {
  if (name[name.length - 1] === "a")
    name = name.slice(0, -1);
  return `${name}(${[v, alpha].filter((value) => value !== void 0).join("/")})`;
}
function getThemeVal(theme, keys, index = 0) {
  for (const key of keys) {
    theme = theme[key];
    if (theme === void 0)
      return;
  }
  return Array.isArray(theme) ? theme[index] : theme;
}
function escapeStringRegexp(str) {
  return str.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&").replace(/-/g, "\\x2d");
}

const defaultThemeNames = ["dark", "light"];
const PRESET_THEME_RULE = "PRESET_THEME_RULE";
function presetTheme(options) {
  const { prefix = "--un-preset-theme", theme } = options;
  const selectors = { light: ":root", ...options.selectors };
  let originalThemeKey = "light";
  if (!theme.dark) {
    theme.dark = {};
    originalThemeKey = "dark";
  }
  if (!theme.light) {
    theme.light = {};
    originalThemeKey = "light";
  }
  const keys = Object.keys(theme);
  const varsRE = new RegExp(`var\\((${escapeStringRegexp(prefix)}[\\w-]*)\\)`);
  const themeValues = /* @__PURE__ */ new Map();
  const usedTheme = [];
  return {
    name: "unocss-preset-theme",
    extendTheme(originalTheme) {
      const recursiveTheme = (curTheme, preKeys = []) => {
        Object.keys(curTheme).forEach((configKey) => {
          const val = Reflect.get(curTheme, configKey);
          const themeKeys = preKeys.concat(configKey);
          const setThemeValue = (name, index = 0, isColor = false) => {
            themeValues.set(name, {
              theme: keys.reduce(
                (obj, themeKey) => {
                  let themeValue = getThemeVal(theme[themeKey], themeKeys, index) || (themeKey === originalThemeKey ? getThemeVal(originalTheme, themeKeys) : null);
                  let themeAlphaValue;
                  if (themeValue) {
                    const cssVarName = `${prefix}-${preKeys.join("-")}-${configKey}`;
                    if (isColor) {
                      const cssColor = ruleUtils.parseCssColor(themeValue);
                      if (cssColor?.alpha !== void 0 && cssColor?.alpha !== null) {
                        if (`var(${cssVarName}--alpha, 1)` === cssColor.alpha) {
                          const values = themeValues.get(name);
                          if (values?.theme[themeKey][`${name}--alpha`])
                            themeAlphaValue = values.theme[themeKey][`${name}--alpha`];
                        } else {
                          themeAlphaValue = `${cssColor.alpha}`;
                        }
                      }
                      if (cssColor?.components) {
                        if (cssColor.components.length === 1 && `var(${cssVarName})` === cssColor.components[0]) {
                          const values = themeValues.get(name);
                          if (values?.theme[themeKey][name])
                            themeValue = values.theme[themeKey][name];
                        } else {
                          themeValue = cssColor.components.join(" ");
                        }
                      }
                    } else {
                      if (`var(${cssVarName})` === themeValue) {
                        const values = themeValues.get(name);
                        if (values?.theme[themeKey][name]) {
                          themeValue = values.theme[themeKey][name];
                        }
                      }
                    }
                    obj[themeKey] = {
                      [name]: themeValue
                    };
                    if (themeAlphaValue !== void 0)
                      obj[themeKey][`${name}--alpha`] = themeAlphaValue;
                  }
                  return obj;
                },
                {}
              ),
              name
            });
          };
          if (Array.isArray(val)) {
            val.forEach((_, index) => {
              const name = [prefix, ...themeKeys, index].join("-");
              setThemeValue(name, index);
              val[index] = wrapVar(name);
            });
          } else if (typeof val === "string") {
            const name = [prefix, ...themeKeys].join("-");
            const isColor = themeKeys[0] === "colors";
            setThemeValue(name, 0, isColor);
            curTheme[configKey] = wrapVar(name);
            if (isColor) {
              const cssColor = ruleUtils.parseCssColor(val) || val;
              if (typeof cssColor !== "string")
                curTheme[configKey] = wrapCSSFunction(cssColor.type, curTheme[configKey], wrapVar(`${name}--alpha`, "1"));
            }
          } else {
            recursiveTheme(val, themeKeys);
          }
        });
        return curTheme;
      };
      return core.mergeDeep(
        originalTheme,
        recursiveTheme(
          keys.reduce((obj, key) => {
            return core.mergeDeep(obj, theme[key]);
          }, {})
        )
      );
    },
    rules: [
      [
        new RegExp(`^${PRESET_THEME_RULE}:(.*):`),
        (re) => {
          return usedTheme.reduce((obj, e) => {
            const key = re?.[1];
            if (!key || !e.theme[key])
              return obj;
            return {
              ...obj,
              ...e.theme[key]
            };
          }, {});
        }
      ]
    ],
    variants: [
      {
        name: "preset-theme-rule",
        match(matcher) {
          if (matcher.includes(PRESET_THEME_RULE)) {
            return {
              matcher,
              selector(input) {
                const themeName = input.match(/:([\w-]+)\\:\d+/)[1];
                return selectors[themeName] || `.${themeName}`;
              }
            };
          }
        }
      }
    ],
    layers: {
      theme: 0,
      default: 1
    },
    preflights: [
      {
        layer: "theme",
        async getCSS(context) {
          const { css } = await context.generator.generate(
            // Add Date.now() to avoid cache
            keys.map(
              (key) => `${defaultThemeNames.includes(key) ? `${key}:` : ""}${PRESET_THEME_RULE}:${key}:${Date.now()}`
            ),
            { preflights: false }
          );
          let inMediaPrefersColorScheme = "";
          const res = [];
          css.replace(/,\n/g, ",").split("\n").slice(1).forEach((line) => {
            if (line === "@media (prefers-color-scheme: dark){") {
              inMediaPrefersColorScheme = selectors.dark || ".dark";
              res.push(line);
              return;
            }
            if (line === "@media (prefers-color-scheme: light){") {
              inMediaPrefersColorScheme = selectors.light;
              res.push(line);
              return;
            }
            if (inMediaPrefersColorScheme && line === "}") {
              inMediaPrefersColorScheme = "";
              res[res.length - 1] += line;
              return;
            }
            if (inMediaPrefersColorScheme) {
              if (line.startsWith(`${inMediaPrefersColorScheme}{`)) {
                res[res.length - 1] += line.replace(`${inMediaPrefersColorScheme}{`, ":root{");
                return;
              }
              return;
            }
            const regexStr = new RegExp(
              keys.map(
                (key) => `((.${key}) ((${selectors[key] ? escapeStringRegexp(selectors[key]) : `.${key}`}[{|,])|(.${key}\\\\:)))`
              ).join("|"),
              "g"
            );
            const replacedLine = line.replace(regexStr, (matchStr, ...params) => {
              const matchGroup = params.slice(0, -2);
              let replacement = "";
              for (let i = 0; i < matchGroup.length / 5; i++) {
                const startIndex = i * 5;
                if (!matchGroup[startIndex])
                  continue;
                if (matchGroup[startIndex + 3]) {
                  replacement = matchGroup[startIndex + 3];
                } else {
                  const key = matchGroup[startIndex + 1].substring(1);
                  replacement = `${selectors[key]} ${matchGroup[startIndex + 2]}`;
                }
                break;
              }
              return replacement;
            });
            res.push(replacedLine);
          });
          return res.sort((a, b) => {
            const regexStr = `^${selectors[originalThemeKey]}|^@media \\(prefers-color-scheme:`;
            if (a.match(regexStr)?.length)
              return b.match(regexStr)?.length ? 0 : -1;
            return 1;
          }).join("\n");
        }
      }
    ],
    postprocess(util) {
      util.entries.forEach(([, val]) => {
        if (typeof val === "string") {
          const varName = val.match(varsRE)?.[1];
          if (varName) {
            const values = themeValues.get(varName);
            if (values)
              usedTheme.push(values);
          }
        }
      });
    }
  };
}

exports.default = presetTheme;
exports.presetTheme = presetTheme;
