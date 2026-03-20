var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-Nlmj6t/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader.apply(null, argArray)
    ]);
  }
});

// build/index.js
import { WorkerEntrypoint as pt } from "cloudflare:workers";
import Q from "./c734275b27c544206c3fd845ca626e9f76129a6b-index_bg.wasm";
var E = /* @__PURE__ */ __name(class {
  __destroy_into_raw() {
    let t = this.__wbg_ptr;
    return this.__wbg_ptr = 0, it.unregister(this), t;
  }
  free() {
    let t = this.__destroy_into_raw();
    o.__wbg_containerstartupoptions_free(t, 0);
  }
  get enableInternet() {
    if (this.__wbg_inst !== void 0 && this.__wbg_inst !== c)
      throw new Error("Invalid stale object from previous Wasm instance");
    let t = o.__wbg_get_containerstartupoptions_enableInternet(this.__wbg_ptr);
    return t === 16777215 ? void 0 : t !== 0;
  }
  get entrypoint() {
    try {
      if (this.__wbg_inst !== void 0 && this.__wbg_inst !== c)
        throw new Error("Invalid stale object from previous Wasm instance");
      let i = o.__wbindgen_add_to_stack_pointer(-16);
      o.__wbg_get_containerstartupoptions_entrypoint(i, this.__wbg_ptr);
      var t = f().getInt32(i + 0, true), e = f().getInt32(i + 4, true), r = bt(t, e).slice();
      return o.__wbindgen_export4(t, e * 4, 4), r;
    } finally {
      o.__wbindgen_add_to_stack_pointer(16);
    }
  }
  get env() {
    if (this.__wbg_inst !== void 0 && this.__wbg_inst !== c)
      throw new Error("Invalid stale object from previous Wasm instance");
    let t = o.__wbg_get_containerstartupoptions_env(this.__wbg_ptr);
    return y(t);
  }
  set enableInternet(t) {
    if (this.__wbg_inst !== void 0 && this.__wbg_inst !== c)
      throw new Error("Invalid stale object from previous Wasm instance");
    o.__wbg_set_containerstartupoptions_enableInternet(this.__wbg_ptr, d(t) ? 16777215 : t ? 1 : 0);
  }
  set entrypoint(t) {
    if (this.__wbg_inst !== void 0 && this.__wbg_inst !== c)
      throw new Error("Invalid stale object from previous Wasm instance");
    let e = gt(t, o.__wbindgen_export), r = l;
    o.__wbg_set_containerstartupoptions_entrypoint(this.__wbg_ptr, e, r);
  }
  set env(t) {
    if (this.__wbg_inst !== void 0 && this.__wbg_inst !== c)
      throw new Error("Invalid stale object from previous Wasm instance");
    o.__wbg_set_containerstartupoptions_env(this.__wbg_ptr, s(t));
  }
}, "E");
Symbol.dispose && (E.prototype[Symbol.dispose] = E.prototype.free);
var R = /* @__PURE__ */ __name(class {
  __destroy_into_raw() {
    let t = this.__wbg_ptr;
    return this.__wbg_ptr = 0, ot.unregister(this), t;
  }
  free() {
    let t = this.__destroy_into_raw();
    o.__wbg_intounderlyingbytesource_free(t, 0);
  }
  get autoAllocateChunkSize() {
    if (this.__wbg_inst !== void 0 && this.__wbg_inst !== c)
      throw new Error("Invalid stale object from previous Wasm instance");
    return o.intounderlyingbytesource_autoAllocateChunkSize(this.__wbg_ptr) >>> 0;
  }
  cancel() {
    if (this.__wbg_inst !== void 0 && this.__wbg_inst !== c)
      throw new Error("Invalid stale object from previous Wasm instance");
    let t = this.__destroy_into_raw();
    o.intounderlyingbytesource_cancel(t);
  }
  pull(t) {
    if (this.__wbg_inst !== void 0 && this.__wbg_inst !== c)
      throw new Error("Invalid stale object from previous Wasm instance");
    let e = o.intounderlyingbytesource_pull(this.__wbg_ptr, s(t));
    return y(e);
  }
  start(t) {
    if (this.__wbg_inst !== void 0 && this.__wbg_inst !== c)
      throw new Error("Invalid stale object from previous Wasm instance");
    o.intounderlyingbytesource_start(this.__wbg_ptr, s(t));
  }
  get type() {
    if (this.__wbg_inst !== void 0 && this.__wbg_inst !== c)
      throw new Error("Invalid stale object from previous Wasm instance");
    let t = o.intounderlyingbytesource_type(this.__wbg_ptr);
    return et[t];
  }
}, "R");
Symbol.dispose && (R.prototype[Symbol.dispose] = R.prototype.free);
var j = /* @__PURE__ */ __name(class {
  __destroy_into_raw() {
    let t = this.__wbg_ptr;
    return this.__wbg_ptr = 0, st.unregister(this), t;
  }
  free() {
    let t = this.__destroy_into_raw();
    o.__wbg_intounderlyingsink_free(t, 0);
  }
  abort(t) {
    if (this.__wbg_inst !== void 0 && this.__wbg_inst !== c)
      throw new Error("Invalid stale object from previous Wasm instance");
    let e = this.__destroy_into_raw(), r = o.intounderlyingsink_abort(e, s(t));
    return y(r);
  }
  close() {
    if (this.__wbg_inst !== void 0 && this.__wbg_inst !== c)
      throw new Error("Invalid stale object from previous Wasm instance");
    let t = this.__destroy_into_raw(), e = o.intounderlyingsink_close(t);
    return y(e);
  }
  write(t) {
    if (this.__wbg_inst !== void 0 && this.__wbg_inst !== c)
      throw new Error("Invalid stale object from previous Wasm instance");
    let e = o.intounderlyingsink_write(this.__wbg_ptr, s(t));
    return y(e);
  }
}, "j");
Symbol.dispose && (j.prototype[Symbol.dispose] = j.prototype.free);
var F = /* @__PURE__ */ __name(class {
  __destroy_into_raw() {
    let t = this.__wbg_ptr;
    return this.__wbg_ptr = 0, ct.unregister(this), t;
  }
  free() {
    let t = this.__destroy_into_raw();
    o.__wbg_intounderlyingsource_free(t, 0);
  }
  cancel() {
    if (this.__wbg_inst !== void 0 && this.__wbg_inst !== c)
      throw new Error("Invalid stale object from previous Wasm instance");
    let t = this.__destroy_into_raw();
    o.intounderlyingsource_cancel(t);
  }
  pull(t) {
    if (this.__wbg_inst !== void 0 && this.__wbg_inst !== c)
      throw new Error("Invalid stale object from previous Wasm instance");
    let e = o.intounderlyingsource_pull(this.__wbg_ptr, s(t));
    return y(e);
  }
}, "F");
Symbol.dispose && (F.prototype[Symbol.dispose] = F.prototype.free);
var S = /* @__PURE__ */ __name(class {
  __destroy_into_raw() {
    let t = this.__wbg_ptr;
    return this.__wbg_ptr = 0, ut.unregister(this), t;
  }
  free() {
    let t = this.__destroy_into_raw();
    o.__wbg_minifyconfig_free(t, 0);
  }
  get css() {
    if (this.__wbg_inst !== void 0 && this.__wbg_inst !== c)
      throw new Error("Invalid stale object from previous Wasm instance");
    return o.__wbg_get_minifyconfig_css(this.__wbg_ptr) !== 0;
  }
  get html() {
    if (this.__wbg_inst !== void 0 && this.__wbg_inst !== c)
      throw new Error("Invalid stale object from previous Wasm instance");
    return o.__wbg_get_minifyconfig_html(this.__wbg_ptr) !== 0;
  }
  get js() {
    if (this.__wbg_inst !== void 0 && this.__wbg_inst !== c)
      throw new Error("Invalid stale object from previous Wasm instance");
    return o.__wbg_get_minifyconfig_js(this.__wbg_ptr) !== 0;
  }
  set css(t) {
    if (this.__wbg_inst !== void 0 && this.__wbg_inst !== c)
      throw new Error("Invalid stale object from previous Wasm instance");
    o.__wbg_set_minifyconfig_css(this.__wbg_ptr, t);
  }
  set html(t) {
    if (this.__wbg_inst !== void 0 && this.__wbg_inst !== c)
      throw new Error("Invalid stale object from previous Wasm instance");
    o.__wbg_set_minifyconfig_html(this.__wbg_ptr, t);
  }
  set js(t) {
    if (this.__wbg_inst !== void 0 && this.__wbg_inst !== c)
      throw new Error("Invalid stale object from previous Wasm instance");
    o.__wbg_set_minifyconfig_js(this.__wbg_ptr, t);
  }
}, "S");
Symbol.dispose && (S.prototype[Symbol.dispose] = S.prototype.free);
var k = /* @__PURE__ */ __name(class {
  __destroy_into_raw() {
    let t = this.__wbg_ptr;
    return this.__wbg_ptr = 0, ft.unregister(this), t;
  }
  free() {
    let t = this.__destroy_into_raw();
    o.__wbg_r2range_free(t, 0);
  }
  get length() {
    try {
      if (this.__wbg_inst !== void 0 && this.__wbg_inst !== c)
        throw new Error("Invalid stale object from previous Wasm instance");
      let r = o.__wbindgen_add_to_stack_pointer(-16);
      o.__wbg_get_r2range_length(r, this.__wbg_ptr);
      var t = f().getInt32(r + 0, true), e = f().getFloat64(r + 8, true);
      return t === 0 ? void 0 : e;
    } finally {
      o.__wbindgen_add_to_stack_pointer(16);
    }
  }
  get offset() {
    try {
      if (this.__wbg_inst !== void 0 && this.__wbg_inst !== c)
        throw new Error("Invalid stale object from previous Wasm instance");
      let r = o.__wbindgen_add_to_stack_pointer(-16);
      o.__wbg_get_r2range_offset(r, this.__wbg_ptr);
      var t = f().getInt32(r + 0, true), e = f().getFloat64(r + 8, true);
      return t === 0 ? void 0 : e;
    } finally {
      o.__wbindgen_add_to_stack_pointer(16);
    }
  }
  get suffix() {
    try {
      if (this.__wbg_inst !== void 0 && this.__wbg_inst !== c)
        throw new Error("Invalid stale object from previous Wasm instance");
      let r = o.__wbindgen_add_to_stack_pointer(-16);
      o.__wbg_get_r2range_suffix(r, this.__wbg_ptr);
      var t = f().getInt32(r + 0, true), e = f().getFloat64(r + 8, true);
      return t === 0 ? void 0 : e;
    } finally {
      o.__wbindgen_add_to_stack_pointer(16);
    }
  }
  set length(t) {
    if (this.__wbg_inst !== void 0 && this.__wbg_inst !== c)
      throw new Error("Invalid stale object from previous Wasm instance");
    o.__wbg_set_r2range_length(this.__wbg_ptr, !d(t), d(t) ? 0 : t);
  }
  set offset(t) {
    if (this.__wbg_inst !== void 0 && this.__wbg_inst !== c)
      throw new Error("Invalid stale object from previous Wasm instance");
    o.__wbg_set_r2range_offset(this.__wbg_ptr, !d(t), d(t) ? 0 : t);
  }
  set suffix(t) {
    if (this.__wbg_inst !== void 0 && this.__wbg_inst !== c)
      throw new Error("Invalid stale object from previous Wasm instance");
    o.__wbg_set_r2range_suffix(this.__wbg_ptr, !d(t), d(t) ? 0 : t);
  }
}, "k");
Symbol.dispose && (k.prototype[Symbol.dispose] = k.prototype.free);
function V() {
  c++, x = null, A = null, typeof numBytesDecoded < "u" && (numBytesDecoded = 0), typeof l < "u" && (l = 0), typeof w < "u" && (w = new Array(1024).fill(void 0), w = w.concat([void 0, null, true, false]), typeof v < "u" && (v = w.length)), o = new WebAssembly.Instance(Q, G()).exports, o.__wbindgen_start();
}
__name(V, "V");
function J(n, t, e) {
  let r = o.fetch(s(n), s(t), s(e));
  return y(r);
}
__name(J, "J");
function D(n) {
  o.setPanicHook(s(n));
}
__name(D, "D");
function G() {
  return { __proto__: null, "./index_bg.js": { __proto__: null, __wbg_Error_83742b46f01ce22d: function(t, e) {
    let r = Error(h(t, e));
    return s(r);
  }, __wbg_Number_a5a435bd7bbec835: function(t) {
    return Number(_(t));
  }, __wbg_String_8564e559799eccda: function(t, e) {
    let r = String(_(e)), i = m(r, o.__wbindgen_export, o.__wbindgen_export2), u = l;
    f().setInt32(t + 4, u, true), f().setInt32(t + 0, i, true);
  }, __wbg___wbindgen_boolean_get_c0f3f60bac5a78d1: function(t) {
    let e = _(t), r = typeof e == "boolean" ? e : void 0;
    return d(r) ? 16777215 : r ? 1 : 0;
  }, __wbg___wbindgen_debug_string_5398f5bb970e0daa: function(t, e) {
    let r = L(_(e)), i = m(r, o.__wbindgen_export, o.__wbindgen_export2), u = l;
    f().setInt32(t + 4, u, true), f().setInt32(t + 0, i, true);
  }, __wbg___wbindgen_in_41dbb8413020e076: function(t, e) {
    return _(t) in _(e);
  }, __wbg___wbindgen_is_function_3c846841762788c1: function(t) {
    return typeof _(t) == "function";
  }, __wbg___wbindgen_is_object_781bc9f159099513: function(t) {
    let e = _(t);
    return typeof e == "object" && e !== null;
  }, __wbg___wbindgen_is_undefined_52709e72fb9f179c: function(t) {
    return _(t) === void 0;
  }, __wbg___wbindgen_jsval_loose_eq_5bcc3bed3c69e72b: function(t, e) {
    return _(t) == _(e);
  }, __wbg___wbindgen_number_get_34bb9d9dcfa21373: function(t, e) {
    let r = _(e), i = typeof r == "number" ? r : void 0;
    f().setFloat64(t + 8, d(i) ? 0 : i, true), f().setInt32(t + 0, !d(i), true);
  }, __wbg___wbindgen_string_get_395e606bd0ee4427: function(t, e) {
    let r = _(e), i = typeof r == "string" ? r : void 0;
    var u = d(i) ? 0 : m(i, o.__wbindgen_export, o.__wbindgen_export2), a = l;
    f().setInt32(t + 4, a, true), f().setInt32(t + 0, u, true);
  }, __wbg___wbindgen_throw_6ddd609b62940d55: function(t, e) {
    throw new Error(h(t, e));
  }, __wbg__wbg_cb_unref_6b5b6b8576d35cb1: function(t) {
    _(t)._wbg_cb_unref();
  }, __wbg_abort_5ef96933660780b7: function(t) {
    _(t).abort();
  }, __wbg_abort_6479c2d794ebf2ee: function(t, e) {
    _(t).abort(_(e));
  }, __wbg_append_608dfb635ee8998f: function() {
    return g(function(t, e, r, i, u) {
      _(t).append(h(e, r), h(i, u));
    }, arguments);
  }, __wbg_buffer_60b8043cd926067d: function(t) {
    let e = _(t).buffer;
    return s(e);
  }, __wbg_byobRequest_6342e5f2b232c0f9: function(t) {
    let e = _(t).byobRequest;
    return d(e) ? 0 : s(e);
  }, __wbg_byteLength_607b856aa6c5a508: function(t) {
    return _(t).byteLength;
  }, __wbg_byteOffset_b26b63681c83856c: function(t) {
    return _(t).byteOffset;
  }, __wbg_call_2d781c1f4d5c0ef8: function() {
    return g(function(t, e, r) {
      let i = _(t).call(_(e), _(r));
      return s(i);
    }, arguments);
  }, __wbg_cause_f02a23068e3256fa: function(t) {
    let e = _(t).cause;
    return s(e);
  }, __wbg_cf_c5a23ee8e524d1e1: function() {
    return g(function(t) {
      let e = _(t).cf;
      return d(e) ? 0 : s(e);
    }, arguments);
  }, __wbg_clearTimeout_2256f1e7b94ef517: function(t) {
    let e = clearTimeout(y(t));
    return s(e);
  }, __wbg_close_690d36108c557337: function() {
    return g(function(t) {
      _(t).close();
    }, arguments);
  }, __wbg_close_737b4b1fbc658540: function() {
    return g(function(t) {
      _(t).close();
    }, arguments);
  }, __wbg_done_08ce71ee07e3bd17: function(t) {
    return _(t).done;
  }, __wbg_enqueue_ec3552838b4b7fbf: function() {
    return g(function(t, e) {
      _(t).enqueue(_(e));
    }, arguments);
  }, __wbg_entries_5b8fe91cea59610e: function(t) {
    let e = _(t).entries();
    return s(e);
  }, __wbg_error_8d9a8e04cd1d3588: function(t) {
    console.error(_(t));
  }, __wbg_error_a6fa202b58aa1cd3: function(t, e) {
    let r, i;
    try {
      r = t, i = e, console.error(h(t, e));
    } finally {
      o.__wbindgen_export4(r, i, 1);
    }
  }, __wbg_error_cfce0f619500de52: function(t, e) {
    console.error(_(t), _(e));
  }, __wbg_fetch_43b2f110608a59ff: function(t) {
    let e = fetch(_(t));
    return s(e);
  }, __wbg_fetch_5550a88cf343aaa9: function(t, e) {
    let r = _(t).fetch(_(e));
    return s(r);
  }, __wbg_get_a8ee5c45dabc1b3b: function(t, e) {
    let r = _(t)[e >>> 0];
    return s(r);
  }, __wbg_get_with_ref_key_6412cf3094599694: function(t, e) {
    let r = _(t)[_(e)];
    return s(r);
  }, __wbg_has_926ef2ff40b308cf: function() {
    return g(function(t, e) {
      return Reflect.has(_(t), _(e));
    }, arguments);
  }, __wbg_headers_eb2234545f9ff993: function(t) {
    let e = _(t).headers;
    return s(e);
  }, __wbg_headers_fc8c672cd757e0fd: function(t) {
    let e = _(t).headers;
    return s(e);
  }, __wbg_instanceof_ArrayBuffer_101e2bf31071a9f6: function(t) {
    let e;
    try {
      e = _(t) instanceof ArrayBuffer;
    } catch {
      e = false;
    }
    return e;
  }, __wbg_instanceof_Error_4691a5b466e32a80: function(t) {
    let e;
    try {
      e = _(t) instanceof Error;
    } catch {
      e = false;
    }
    return e;
  }, __wbg_instanceof_Response_9b4d9fd451e051b1: function(t) {
    let e;
    try {
      e = _(t) instanceof Response;
    } catch {
      e = false;
    }
    return e;
  }, __wbg_instanceof_Uint8Array_740438561a5b956d: function(t) {
    let e;
    try {
      e = _(t) instanceof Uint8Array;
    } catch {
      e = false;
    }
    return e;
  }, __wbg_isArray_33b91feb269ff46e: function(t) {
    return Array.isArray(_(t));
  }, __wbg_isSafeInteger_ecd6a7f9c3e053cd: function(t) {
    return Number.isSafeInteger(_(t));
  }, __wbg_json_23d07e6730d48b96: function() {
    return g(function(t) {
      let e = _(t).json();
      return s(e);
    }, arguments);
  }, __wbg_length_ea16607d7b61445b: function(t) {
    return _(t).length;
  }, __wbg_method_23aa7d0d6ec9a08f: function(t, e) {
    let r = _(e).method, i = m(r, o.__wbindgen_export, o.__wbindgen_export2), u = l;
    f().setInt32(t + 4, u, true), f().setInt32(t + 0, i, true);
  }, __wbg_new_0837727332ac86ba: function() {
    return g(function() {
      let t = new Headers();
      return s(t);
    }, arguments);
  }, __wbg_new_227d7c05414eb861: function() {
    let t = new Error();
    return s(t);
  }, __wbg_new_5f486cdf45a04d78: function(t) {
    let e = new Uint8Array(_(t));
    return s(e);
  }, __wbg_new_ab79df5bd7c26067: function() {
    let t = new Object();
    return s(t);
  }, __wbg_new_c518c60af666645b: function() {
    return g(function() {
      let t = new AbortController();
      return s(t);
    }, arguments);
  }, __wbg_new_d15cb560a6a0e5f0: function(t, e) {
    let r = new Error(h(t, e));
    return s(r);
  }, __wbg_new_from_slice_22da9388ac046e50: function(t, e) {
    let r = new Uint8Array(q(t, e));
    return s(r);
  }, __wbg_new_typed_aaaeaf29cf802876: function(t, e) {
    try {
      var r = { a: t, b: e }, i = /* @__PURE__ */ __name((a, b) => {
        let p = r.a;
        r.a = 0;
        try {
          return tt(p, r.b, a, b);
        } finally {
          r.a = p;
        }
      }, "i");
      let u = new Promise(i);
      return s(u);
    } finally {
      r.a = r.b = 0;
    }
  }, __wbg_new_with_byte_offset_and_length_b2ec5bf7b2f35743: function(t, e, r) {
    let i = new Uint8Array(_(t), e >>> 0, r >>> 0);
    return s(i);
  }, __wbg_new_with_length_825018a1616e9e55: function(t) {
    let e = new Uint8Array(t >>> 0);
    return s(e);
  }, __wbg_new_with_opt_buffer_source_and_init_cbf3b8468cedbba9: function() {
    return g(function(t, e) {
      let r = new Response(_(t), _(e));
      return s(r);
    }, arguments);
  }, __wbg_new_with_opt_readable_stream_and_init_15b79ab5fa39d080: function() {
    return g(function(t, e) {
      let r = new Response(_(t), _(e));
      return s(r);
    }, arguments);
  }, __wbg_new_with_opt_str_and_init_a1ea8e111a765950: function() {
    return g(function(t, e, r) {
      let i = new Response(t === 0 ? void 0 : h(t, e), _(r));
      return s(i);
    }, arguments);
  }, __wbg_new_with_str_and_init_b4b54d1a819bc724: function() {
    return g(function(t, e, r) {
      let i = new Request(h(t, e), _(r));
      return s(i);
    }, arguments);
  }, __wbg_next_11b99ee6237339e3: function() {
    return g(function(t) {
      let e = _(t).next();
      return s(e);
    }, arguments);
  }, __wbg_prototypesetcall_d62e5099504357e6: function(t, e, r) {
    Uint8Array.prototype.set.call(q(t, e), _(r));
  }, __wbg_queueMicrotask_0c399741342fb10f: function(t) {
    let e = _(t).queueMicrotask;
    return s(e);
  }, __wbg_queueMicrotask_a082d78ce798393e: function(t) {
    queueMicrotask(_(t));
  }, __wbg_resolve_ae8d83246e5bcc12: function(t) {
    let e = Promise.resolve(_(t));
    return s(e);
  }, __wbg_respond_e286ee502e7cf7e4: function() {
    return g(function(t, e) {
      _(t).respond(e >>> 0);
    }, arguments);
  }, __wbg_setTimeout_b188b3bcc8977c7d: function(t, e) {
    let r = setTimeout(_(t), e);
    return s(r);
  }, __wbg_set_7eaa4f96924fd6b3: function() {
    return g(function(t, e, r) {
      return Reflect.set(_(t), _(e), _(r));
    }, arguments);
  }, __wbg_set_8c0b3ffcf05d61c2: function(t, e, r) {
    _(t).set(q(e, r));
  }, __wbg_set_body_a3d856b097dfda04: function(t, e) {
    _(t).body = _(e);
  }, __wbg_set_cache_ec7e430c6056ebda: function(t, e) {
    _(t).cache = nt[e];
  }, __wbg_set_credentials_ed63183445882c65: function(t, e) {
    _(t).credentials = rt[e];
  }, __wbg_set_e09648bea3f1af1e: function() {
    return g(function(t, e, r, i, u) {
      _(t).set(h(e, r), h(i, u));
    }, arguments);
  }, __wbg_set_headers_3c8fecc693b75327: function(t, e) {
    _(t).headers = _(e);
  }, __wbg_set_headers_bf56980ea1a65acb: function(t, e) {
    _(t).headers = _(e);
  }, __wbg_set_method_8c015e8bcafd7be1: function(t, e, r) {
    _(t).method = h(e, r);
  }, __wbg_set_mode_5a87f2c809cf37c2: function(t, e) {
    _(t).mode = _t[e];
  }, __wbg_set_signal_0cebecb698f25d21: function(t, e) {
    _(t).signal = _(e);
  }, __wbg_set_status_b80d37d9d23276c4: function(t, e) {
    _(t).status = e;
  }, __wbg_signal_166e1da31adcac18: function(t) {
    let e = _(t).signal;
    return s(e);
  }, __wbg_stack_3b0d974bbf31e44f: function(t, e) {
    let r = _(e).stack, i = m(r, o.__wbindgen_export, o.__wbindgen_export2), u = l;
    f().setInt32(t + 4, u, true), f().setInt32(t + 0, i, true);
  }, __wbg_static_accessor_GLOBAL_8adb955bd33fac2f: function() {
    let t = typeof global > "u" ? null : global;
    return d(t) ? 0 : s(t);
  }, __wbg_static_accessor_GLOBAL_THIS_ad356e0db91c7913: function() {
    let t = typeof globalThis > "u" ? null : globalThis;
    return d(t) ? 0 : s(t);
  }, __wbg_static_accessor_SELF_f207c857566db248: function() {
    let t = typeof self > "u" ? null : self;
    return d(t) ? 0 : s(t);
  }, __wbg_static_accessor_WINDOW_bb9f1ba69d61b386: function() {
    let t = typeof window > "u" ? null : window;
    return d(t) ? 0 : s(t);
  }, __wbg_status_318629ab93a22955: function(t) {
    return _(t).status;
  }, __wbg_text_372f5b91442c50f9: function() {
    return g(function(t) {
      let e = _(t).text();
      return s(e);
    }, arguments);
  }, __wbg_then_098abe61755d12f6: function(t, e) {
    let r = _(t).then(_(e));
    return s(r);
  }, __wbg_then_9e335f6dd892bc11: function(t, e, r) {
    let i = _(t).then(_(e), _(r));
    return s(i);
  }, __wbg_toString_fca8b5e46235cfb4: function(t) {
    let e = _(t).toString();
    return s(e);
  }, __wbg_url_7fefc1820fba4e0c: function(t, e) {
    let r = _(e).url, i = m(r, o.__wbindgen_export, o.__wbindgen_export2), u = l;
    f().setInt32(t + 4, u, true), f().setInt32(t + 0, i, true);
  }, __wbg_url_b6f96880b733816c: function(t, e) {
    let r = _(e).url, i = m(r, o.__wbindgen_export, o.__wbindgen_export2), u = l;
    f().setInt32(t + 4, u, true), f().setInt32(t + 0, i, true);
  }, __wbg_value_21fc78aab0322612: function(t) {
    let e = _(t).value;
    return s(e);
  }, __wbg_view_f68a712e7315f8b2: function(t) {
    let e = _(t).view;
    return d(e) ? 0 : s(e);
  }, __wbindgen_cast_0000000000000001: function(t, e) {
    let r = $(t, e, o.__wasm_bindgen_func_elem_2579, Z);
    return s(r);
  }, __wbindgen_cast_0000000000000002: function(t, e) {
    let r = $(t, e, o.__wasm_bindgen_func_elem_1921, Y);
    return s(r);
  }, __wbindgen_cast_0000000000000003: function(t, e) {
    let r = h(t, e);
    return s(r);
  }, __wbindgen_object_clone_ref: function(t) {
    let e = _(t);
    return s(e);
  }, __wbindgen_object_drop_ref: function(t) {
    y(t);
  } } };
}
__name(G, "G");
function Y(n, t) {
  o.__wasm_bindgen_func_elem_1922(n, t);
}
__name(Y, "Y");
function Z(n, t, e) {
  try {
    let u = o.__wbindgen_add_to_stack_pointer(-16);
    o.__wasm_bindgen_func_elem_799(u, n, t, s(e));
    var r = f().getInt32(u + 0, true), i = f().getInt32(u + 4, true);
    if (i)
      throw y(r);
  } finally {
    o.__wbindgen_add_to_stack_pointer(16);
  }
}
__name(Z, "Z");
function tt(n, t, e, r) {
  o.__wasm_bindgen_func_elem_810(n, t, s(e), s(r));
}
__name(tt, "tt");
var et = ["bytes"];
var nt = ["default", "no-store", "reload", "no-cache", "force-cache", "only-if-cached"];
var rt = ["omit", "same-origin", "include"];
var _t = ["same-origin", "no-cors", "cors", "navigate"];
var c = 0;
var it = typeof FinalizationRegistry > "u" ? { register: () => {
}, unregister: () => {
} } : new FinalizationRegistry(({ ptr: n, instance: t }) => {
  t === c && o.__wbg_containerstartupoptions_free(n >>> 0, 1);
});
var ot = typeof FinalizationRegistry > "u" ? { register: () => {
}, unregister: () => {
} } : new FinalizationRegistry(({ ptr: n, instance: t }) => {
  t === c && o.__wbg_intounderlyingbytesource_free(n >>> 0, 1);
});
var st = typeof FinalizationRegistry > "u" ? { register: () => {
}, unregister: () => {
} } : new FinalizationRegistry(({ ptr: n, instance: t }) => {
  t === c && o.__wbg_intounderlyingsink_free(n >>> 0, 1);
});
var ct = typeof FinalizationRegistry > "u" ? { register: () => {
}, unregister: () => {
} } : new FinalizationRegistry(({ ptr: n, instance: t }) => {
  t === c && o.__wbg_intounderlyingsource_free(n >>> 0, 1);
});
var ut = typeof FinalizationRegistry > "u" ? { register: () => {
}, unregister: () => {
} } : new FinalizationRegistry(({ ptr: n, instance: t }) => {
  t === c && o.__wbg_minifyconfig_free(n >>> 0, 1);
});
var ft = typeof FinalizationRegistry > "u" ? { register: () => {
}, unregister: () => {
} } : new FinalizationRegistry(({ ptr: n, instance: t }) => {
  t === c && o.__wbg_r2range_free(n >>> 0, 1);
});
function s(n) {
  v === w.length && w.push(w.length + 1);
  let t = v;
  return v = w[t], w[t] = n, t;
}
__name(s, "s");
var N = typeof FinalizationRegistry > "u" ? { register: () => {
}, unregister: () => {
} } : new FinalizationRegistry((n) => {
  n.instance === c && n.dtor(n.a, n.b);
});
function L(n) {
  let t = typeof n;
  if (t == "number" || t == "boolean" || n == null)
    return `${n}`;
  if (t == "string")
    return `"${n}"`;
  if (t == "symbol") {
    let i = n.description;
    return i == null ? "Symbol" : `Symbol(${i})`;
  }
  if (t == "function") {
    let i = n.name;
    return typeof i == "string" && i.length > 0 ? `Function(${i})` : "Function";
  }
  if (Array.isArray(n)) {
    let i = n.length, u = "[";
    i > 0 && (u += L(n[0]));
    for (let a = 1; a < i; a++)
      u += ", " + L(n[a]);
    return u += "]", u;
  }
  let e = /\[object ([^\]]+)\]/.exec(toString.call(n)), r;
  if (e && e.length > 1)
    r = e[1];
  else
    return toString.call(n);
  if (r == "Object")
    try {
      return "Object(" + JSON.stringify(n) + ")";
    } catch {
      return "Object";
    }
  return n instanceof Error ? `${n.name}: ${n.message}
${n.stack}` : r;
}
__name(L, "L");
function at(n) {
  n < 1028 || (w[n] = v, v = n);
}
__name(at, "at");
function bt(n, t) {
  n = n >>> 0;
  let e = f(), r = [];
  for (let i = n; i < n + 4 * t; i += 4)
    r.push(y(e.getUint32(i, true)));
  return r;
}
__name(bt, "bt");
function q(n, t) {
  return n = n >>> 0, P().subarray(n / 1, n / 1 + t);
}
__name(q, "q");
var x = null;
function f() {
  return (x === null || x.buffer.detached === true || x.buffer.detached === void 0 && x.buffer !== o.memory.buffer) && (x = new DataView(o.memory.buffer)), x;
}
__name(f, "f");
function h(n, t) {
  return n = n >>> 0, dt(n, t);
}
__name(h, "h");
var A = null;
function P() {
  return (A === null || A.byteLength === 0) && (A = new Uint8Array(o.memory.buffer)), A;
}
__name(P, "P");
function _(n) {
  return w[n];
}
__name(_, "_");
function g(n, t) {
  try {
    return n.apply(this, t);
  } catch (e) {
    o.__wbindgen_export3(s(e));
  }
}
__name(g, "g");
var w = new Array(1024).fill(void 0);
w.push(void 0, null, true, false);
var v = w.length;
function d(n) {
  return n == null;
}
__name(d, "d");
function $(n, t, e, r) {
  let i = { a: n, b: t, cnt: 1, dtor: e, instance: c }, u = /* @__PURE__ */ __name((...a) => {
    if (i.instance !== c)
      throw new Error("Cannot invoke closure from previous WASM instance");
    i.cnt++;
    let b = i.a;
    i.a = 0;
    try {
      return r(b, i.b, ...a);
    } finally {
      i.a = b, u._wbg_cb_unref();
    }
  }, "u");
  return u._wbg_cb_unref = () => {
    --i.cnt === 0 && (i.dtor(i.a, i.b), i.a = 0, N.unregister(i));
  }, N.register(u, i, i), u;
}
__name($, "$");
function gt(n, t) {
  let e = t(n.length * 4, 4) >>> 0, r = f();
  for (let i = 0; i < n.length; i++)
    r.setUint32(e + 4 * i, s(n[i]), true);
  return l = n.length, e;
}
__name(gt, "gt");
function m(n, t, e) {
  if (e === void 0) {
    let b = O.encode(n), p = t(b.length, 1) >>> 0;
    return P().subarray(p, p + b.length).set(b), l = b.length, p;
  }
  let r = n.length, i = t(r, 1) >>> 0, u = P(), a = 0;
  for (; a < r; a++) {
    let b = n.charCodeAt(a);
    if (b > 127)
      break;
    u[i + a] = b;
  }
  if (a !== r) {
    a !== 0 && (n = n.slice(a)), i = e(i, r, r = a + n.length * 3, 1) >>> 0;
    let b = P().subarray(i + a, i + r), p = O.encodeInto(n, b);
    a += p.written, i = e(i, r, a, 1) >>> 0;
  }
  return l = a, i;
}
__name(m, "m");
function y(n) {
  let t = _(n);
  return at(n), t;
}
__name(y, "y");
var K = new TextDecoder("utf-8", { ignoreBOM: true, fatal: true });
K.decode();
function dt(n, t) {
  return K.decode(P().subarray(n, n + t));
}
__name(dt, "dt");
var O = new TextEncoder();
"encodeInto" in O || (O.encodeInto = function(n, t) {
  let e = O.encode(n);
  return t.set(e), { read: n.length, written: e.length };
});
var l = 0;
var wt = new WebAssembly.Instance(Q, G());
var o = wt.exports;
Error.stackTraceLimit = 100;
var z = false;
function X() {
  D && D(function(n) {
    let t = new Error("Rust panic: " + n);
    console.error("Critical", t), z = true;
  });
}
__name(X, "X");
X();
var U = 0;
function H() {
  z && (console.log("Reinitializing Wasm application"), V(), z = false, X(), U++);
}
__name(H, "H");
addEventListener("error", (n) => {
  B(n.error);
});
function B(n) {
  n instanceof WebAssembly.RuntimeError && (console.error("Critical", n), z = true);
}
__name(B, "B");
var M = /* @__PURE__ */ __name(class extends pt {
}, "M");
M.prototype.fetch = function(t) {
  return J.call(this, t, this.env, this.ctx);
};
var ht = { set: (n, t, e, r) => Reflect.set(n.instance, t, e, r), has: (n, t) => Reflect.has(n.instance, t), deleteProperty: (n, t) => Reflect.deleteProperty(n.instance, t), apply: (n, t, e) => Reflect.apply(n.instance, t, e), construct: (n, t, e) => Reflect.construct(n.instance, t, e), getPrototypeOf: (n) => Reflect.getPrototypeOf(n.instance), setPrototypeOf: (n, t) => Reflect.setPrototypeOf(n.instance, t), isExtensible: (n) => Reflect.isExtensible(n.instance), preventExtensions: (n) => Reflect.preventExtensions(n.instance), getOwnPropertyDescriptor: (n, t) => Reflect.getOwnPropertyDescriptor(n.instance, t), defineProperty: (n, t, e) => Reflect.defineProperty(n.instance, t, e), ownKeys: (n) => Reflect.ownKeys(n.instance) };
var I = { construct(n, t, e) {
  try {
    H();
    let r = { instance: Reflect.construct(n, t, e), instanceId: U, ctor: n, args: t, newTarget: e };
    return new Proxy(r, { ...ht, get(i, u, a) {
      i.instanceId !== U && (i.instance = Reflect.construct(i.ctor, i.args, i.newTarget), i.instanceId = U);
      let b = Reflect.get(i.instance, u, a);
      return typeof b != "function" ? b : b.constructor === Function ? new Proxy(b, { apply(p, T, C) {
        H();
        try {
          return p.apply(T, C);
        } catch (W) {
          throw B(W), W;
        }
      } }) : new Proxy(b, { async apply(p, T, C) {
        H();
        try {
          return await p.apply(T, C);
        } catch (W) {
          throw B(W), W;
        }
      } });
    } });
  } catch (r) {
    throw z = true, r;
  }
} };
var xt = new Proxy(M, I);
var vt = new Proxy(E, I);
var It = new Proxy(R, I);
var Et = new Proxy(j, I);
var Rt = new Proxy(F, I);
var jt = new Proxy(S, I);
var Ft = new Proxy(k, I);

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-Nlmj6t/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = xt;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-Nlmj6t/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  vt as ContainerStartupOptions,
  It as IntoUnderlyingByteSource,
  Et as IntoUnderlyingSink,
  Rt as IntoUnderlyingSource,
  jt as MinifyConfig,
  Ft as R2Range,
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=shim.js.map
