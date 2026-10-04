/** Browser configuration for the plugin's sidebar detail page. */
window.__ModuleLoader__.load({
  id: "dsh-reasoning-options",
  factory: (require) => {
    var react = require("react");
    var h = react.createElement;
    var CSS = "";
    // Scoped flat controls retain native keyboard and form behavior.
    CSS += `
.dsh-flat.__ro_root{width:100%;max-width:720px;gap:14px;font-size:13px;line-height:1.65;color:var(--dsw-alias-label-primary);--flat-accent:var(--dsw-alias-state-business-primary,#3964fe);--flat-border:var(--dsw-alias-border-l2,#dce2eb)}
.dsh-flat.__ro_root *{box-sizing:border-box;min-width:0}
.dsh-flat.__ro_root p{margin:0}
.dsh-flat.__ro_root label[class$="_field"]{gap:7px}
.dsh-flat.__ro_root [class$="_label"]{font-size:13px;font-weight:500}
.dsh-flat.__ro_root [class$="_hint"]{font-size:12px;line-height:1.65}
.dsh-flat.__ro_root input:not([type=checkbox]),.dsh-flat.__ro_root select,.dsh-flat.__ro_root textarea{width:100%;border:1px solid var(--flat-border);border-radius:6px;background:var(--dsw-alias-bg-layer-3);color:inherit;font:inherit;padding:9px 12px;min-height:40px;box-shadow:none;transition:border-color .15s}
.dsh-flat.__ro_root input:hover:not(:disabled),.dsh-flat.__ro_root select:hover:not(:disabled),.dsh-flat.__ro_root textarea:hover:not(:disabled){border-color:var(--dsw-alias-label-tertiary)}
.dsh-flat.__ro_root input[type=checkbox]{appearance:none;flex:none;width:30px;height:18px;margin:0;border:1px solid var(--flat-border);border-radius:12px;background:var(--dsw-alias-bg-layer-2);position:relative;cursor:pointer;transition:background .15s,border-color .15s}
.dsh-flat.__ro_root input[type=checkbox]::before{content:"";position:absolute;left:2px;top:2px;width:12px;height:12px;border-radius:50%;background:var(--dsw-alias-label-secondary);transition:transform .15s}
.dsh-flat.__ro_root input[type=checkbox]:checked{background:var(--flat-accent);border-color:var(--flat-accent)}
.dsh-flat.__ro_root input[type=checkbox]:checked::before{transform:translateX(12px);background:#fff}
.dsh-flat.__ro_root :is(input,select,textarea,button,summary,a):focus-visible{outline:2px solid var(--flat-accent);outline-offset:3px}
.dsh-flat.__ro_root :is(input,select,textarea,button):disabled{opacity:.5;cursor:default}
.dsh-flat.__ro_root [class$="_actions"]{flex-wrap:wrap;gap:10px;margin-top:4px;padding-top:16px;border-top:1px solid var(--flat-border)}
.dsh-flat.__ro_root details{border-top:1px solid var(--flat-border);padding:0}
.dsh-flat.__ro_root summary{list-style:none;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 0;font-size:13px;font-weight:500;cursor:pointer;color:var(--dsw-alias-label-secondary)}
.dsh-flat.__ro_root summary::-webkit-details-marker{display:none}
.dsh-flat.__ro_root summary::after{content:"+";font-size:18px;font-weight:400;flex:none}
.dsh-flat.__ro_root details[open]>summary::after{content:"−"}
.dsh-flat.__ro_root details>div{padding-bottom:18px}
.dsh-flat.__ro_root .__ro_field{display:flex;flex-direction:column;gap:7px}
.dsh-flat.__ro_root .__ro_toggle{flex-direction:row;align-items:center;justify-content:space-between;padding:12px 0}
.dsh-flat.__ro_root .__ro_advanced{display:flex;flex-direction:column;gap:18px}
.dsh-flat.__ro_root .__ro_actions{display:flex;align-items:center}
.dsh-flat.__ro_root .__ro_save{border:1px solid var(--flat-accent);background:var(--flat-accent);color:#fff;cursor:pointer}
@media(prefers-reduced-motion:reduce){.dsh-flat.__ro_root *,.dsh-flat.__ro_root input[type=checkbox]::before{transition:none}}
.dsh-flat.__ro_root button{border-radius:6px;min-height:34px;padding:7px 14px;font:inherit;font-size:12px;box-shadow:none}
.dsh-flat.__ro_root :is(h2,h3){margin:0;font-size:14px;font-weight:600}
`;
    var tagId = "dsh-reasoning-options/main.css";
    if (typeof document !== "undefined" && !document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]")) {
      var tag = document.createElement("style");
      tag.dataset.pluginCss = tagId;
      tag.textContent = CSS;
      document.head.appendChild(tag);
    }
    var NS = "reasoningOptions";
    var zh = {
      enabled: "自动补齐模型推理档位",
      autoSessionHeader: "自动为 OpenCode 网关注入会话标识头",
      sessionHeaderValue: "会话标识",
      pollIntervalMs: "自动检查间隔（毫秒，0 表示关闭定时检查）",
      intro: "为自定义模型补齐推理强度选项，并为 OpenCode 网关补齐会话标识。",
      advanced: "高级设置：网关与检查间隔",
      defaultsHint: "开启后自动工作；通常无需调整下方参数。",
      save: "保存", saving: "保存中…", saved: "已保存",
      unavailable: "插件配置尚未加载", error: "保存失败，请检查配置后重试"
    };
    var en = {
      enabled: "Add missing model reasoning levels",
      autoSessionHeader: "Add session headers for OpenCode gateways",
      sessionHeaderValue: "Session identifier",
      pollIntervalMs: "Automatic check interval (ms; 0 disables periodic checks)",
      intro: "Add reasoning levels to custom models and session headers to OpenCode gateways.",
      advanced: "Advanced: gateways and check interval",
      defaultsHint: "Works automatically when enabled; the defaults usually need no changes.",
      save: "Save", saving: "Saving…", saved: "Saved",
      unavailable: "Plugin configuration is not loaded", error: "Save failed; check the configuration and retry"
    };
    var FIELDS = [
      { key: "enabled", type: "checkbox" },
      { key: "autoSessionHeader", type: "checkbox" },
      { key: "sessionHeaderValue", type: "text" },
      { key: "pollIntervalMs", type: "number" }
    ];

    function ReasoningPage(props) {
      useLocale(props.locale);
      var scope = props.scope, t = props.t;
      var [snapshot, setSnapshot] = react.useState(function () { return scope.getSnapshot(); });
      var [draft, setDraft] = react.useState({});
      var [busy, setBusy] = react.useState(false);
      var [notice, setNotice] = react.useState("");
      var [error, setError] = react.useState("");
      react.useEffect(function () {
        setSnapshot(scope.getSnapshot());
        return scope.subscribe(function () { setSnapshot(scope.getSnapshot()); });
      }, [scope]);
      if (snapshot.status !== "ready" || !snapshot.value) return h("p", null, t("unavailable"));

      function save() {
        if (busy || !snapshot.writable) return;
        var ops = Object.keys(draft).map(function (key) {
          return { op: "set", path: [key], value: key === "pollIntervalMs" ? Number(draft[key]) : draft[key] };
        });
        if (!ops.length) return;
        setBusy(true); setNotice(""); setError("");
        Promise.resolve().then(function () { return scope.mutate(ops, snapshot.revision); }).then(function (ok) {
          setSnapshot(scope.getSnapshot());
          if (ok) { setDraft({}); setNotice({ key: "saved" }); }
          else setError({ key: "error" });
        }).catch(function () { setError({ key: "error" }); }).finally(function () { setBusy(false); });
      }

      function renderField(field) {
          var current = Object.prototype.hasOwnProperty.call(draft, field.key) ? draft[field.key] : snapshot.value[field.key];
          var input = {
            type: field.type, disabled: busy || !snapshot.writable,
            onChange: function (event) {
              var next = field.type === "checkbox" ? event.target.checked : event.target.value;
              setDraft(function (previous) { return Object.assign({}, previous, { [field.key]: next }); });
              setNotice(""); setError("");
            },
            className: "__ro_input"
          };
          if (field.type === "checkbox") input.checked = Boolean(current);
          else { input.value = current ?? ""; if (field.type === "number") { input.min = 0; input.step = 1; } }
          return h("label", { key: field.key, className: "__ro_field" + (field.type === "checkbox" ? " __ro_toggle" : "") },
            h("span", null, t(field.key)), h("input", input));
      }
      return h("div", { className: "__ro_root dsh-flat", style: { display: "flex", flexDirection: "column" } },
        h("p", { style: { color: "var(--dsw-alias-label-secondary)" } }, t("intro")),
        renderField(FIELDS[0]),
        h("p", { style: { color: "var(--dsw-alias-label-secondary)", margin: 0 } }, t("defaultsHint")),
        h("details", null,
          h("summary", { className: "__ro_summary" }, t("advanced")),
          h("div", { className: "__ro_advanced" }, FIELDS.slice(1).map(renderField))),
        h("div", { className: "__ro_actions" },
          h("button", { type: "button", onClick: save, disabled: busy || !snapshot.writable || !Object.keys(draft).length,
            className: "__ro_save"
          }, t(busy ? "saving" : "save")),
          notice ? h("span", { role: "status" }, messageText(t, notice)) : null,
          error ? h("span", { role: "alert" }, messageText(t, error)) : null));
    }


    // Follow the host language without remounting the form or losing drafts.
    function useLocale(locale) {
      var refresh = react.useState(0)[1];
      react.useEffect(function () {
        if (!locale || typeof locale.subscribe !== "function") return;
        return locale.subscribe(function () { refresh(function (revision) { return revision + 1; }); });
      }, [locale]);
    }
    // Keep translation keys in state so feedback follows later language changes.
    function messageText(t, message) {
      if (!message) return "";
      return t(message.key) + (message.detailKey ? ": " + t(message.detailKey) : message.detail ? ": " + message.detail : "");
    }

    function apply(ctx) {
      ctx.effect(function () { return ctx.locale.register(NS, { zh: zh, en: en }); }, "dsh-reasoning-options: dictionaries");
      var scope = ctx.configForms.get("reasoning-efforts"), t = ctx.locale.bind(NS);
      ctx.slots.inject("plugins.bundle.config", function () {
        return ctx.slots.register({ name: "plugins.bundle.config", key: "dsh-reasoning-options", locale: NS }, function (props) {
          return h(ReasoningPage, Object.assign({}, props, { scope: scope, t: t, locale: ctx.locale }));
        });
      });
    }
    return { apply: apply, inject: ["slots", "locale", "configForms"] };
  }
});
