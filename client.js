/** Browser configuration for the plugin's sidebar detail page. */
window.__ModuleLoader__.load({
  id: "dsh-reasoning-options",
  factory: (require) => {
    var react = require("react");
    var h = react.createElement;
    var NS = "reasoningOptions";
    var zh = {
      enabled: "自动补齐模型推理档位",
      autoSessionHeader: "自动为 OpenCode 网关注入会话标识头",
      sessionHeaderValue: "会话标识",
      pollIntervalMs: "自动检查间隔（毫秒，0 表示关闭定时检查）",
      intro: "为自定义模型补齐推理强度选项，并为 OpenCode 网关补齐会话标识。",
      save: "保存", saving: "保存中…", saved: "已保存",
      unavailable: "插件配置尚未加载", error: "保存失败，请检查配置后重试"
    };
    var en = {
      enabled: "Add missing model reasoning levels",
      autoSessionHeader: "Add session headers for OpenCode gateways",
      sessionHeaderValue: "Session identifier",
      pollIntervalMs: "Automatic check interval (ms; 0 disables periodic checks)",
      intro: "Add reasoning levels to custom models and session headers to OpenCode gateways.",
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
          if (ok) { setDraft({}); setNotice(t("saved")); }
          else setError(t("error"));
        }).catch(function () { setError(t("error")); }).finally(function () { setBusy(false); });
      }

      return h("div", { style: { maxWidth: 960, display: "flex", flexDirection: "column", gap: 24 } },
        h("p", { style: { color: "var(--dsw-alias-label-secondary)" } }, t("intro")),
        FIELDS.map(function (field) {
          var current = Object.prototype.hasOwnProperty.call(draft, field.key) ? draft[field.key] : snapshot.value[field.key];
          var input = {
            type: field.type, disabled: busy || !snapshot.writable,
            onChange: function (event) {
              var next = field.type === "checkbox" ? event.target.checked : event.target.value;
              setDraft(function (previous) { return Object.assign({}, previous, { [field.key]: next }); });
              setNotice(""); setError("");
            },
            style: field.type === "checkbox" ? { accentColor: "var(--dsw-alias-state-business-primary)" } : {
              padding: "10px 12px", borderRadius: 10, font: "inherit", color: "inherit",
              border: "1px solid var(--dsw-alias-border-l2)", background: "var(--dsw-alias-bg-layer-3)"
            }
          };
          if (field.type === "checkbox") input.checked = Boolean(current);
          else { input.value = current ?? ""; if (field.type === "number") { input.min = 0; input.step = 1; } }
          return h("label", { key: field.key, style: { display: "flex", flexDirection: field.type === "checkbox" ? "row" : "column", gap: 10 } },
            h("span", null, t(field.key)), h("input", input));
        }),
        h("div", { style: { display: "flex", gap: 12, alignItems: "center" } },
          h("button", { type: "button", onClick: save, disabled: busy || !snapshot.writable || !Object.keys(draft).length,
            style: { padding: "8px 16px", borderRadius: 10, border: 0, background: "var(--dsw-alias-label-primary)", color: "var(--dsw-alias-bg-layer-1)", font: "inherit" }
          }, t(busy ? "saving" : "save")),
          notice ? h("span", { role: "status" }, notice) : null,
          error ? h("span", { role: "alert" }, error) : null));
    }

    function apply(ctx) {
      ctx.effect(function () { return ctx.locale.register(NS, { zh: zh, en: en }); }, "dsh-reasoning-options: dictionaries");
      var scope = ctx.configForms.get("reasoning-efforts"), t = ctx.locale.bind(NS);
      ctx.slots.inject("plugins.bundle.config", function () {
        return ctx.slots.register({ name: "plugins.bundle.config", key: "dsh-reasoning-options", locale: NS }, function (props) {
          return h(ReasoningPage, Object.assign({}, props, { scope: scope, t: t }));
        });
      });
    }
    return { apply: apply, inject: ["slots", "locale", "configForms"] };
  }
});
