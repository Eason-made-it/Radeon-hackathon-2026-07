/* ═══════════════════════════════════════════════════════════════
 * NodeFlow Mock API Layer
 * Implements all 16 backend endpoints per spec §13.
 * Swap NF_API_BASE to point at real backend when deploying.
 * ═══════════════════════════════════════════════════════════════ */

(function () {
  var USE_REAL_API = true; /* set to false to fall back to mock data */
  var API_BASE = '/api';

  /* ── Mock data ─────────────────────────────────────────────── */

  var MOCK_STYLES = [
    { key: 'cyberpunk',     label: 'Cyberpunk',    prompt_prefix: 'cyberpunk style, ' },
    { key: 'anime',         label: 'Anime',        prompt_prefix: 'anime style, ' },
    { key: 'watercolor',    label: 'Watercolor',   prompt_prefix: 'watercolor painting, ' },
    { key: 'oil_painting',  label: 'Oil Painting', prompt_prefix: 'oil painting, ' },
    { key: '3d_render',     label: '3D Render',    prompt_prefix: '3d render, octane, ' },
    { key: 'pixel_art',     label: 'Pixel Art',    prompt_prefix: 'pixel art, ' },
    { key: 'concept_art',   label: 'Concept Art',  prompt_prefix: 'concept art, ' },
    { key: 'minimalist',    label: 'Minimalist',   prompt_prefix: 'minimalist, clean, ' }
  ];

  var MOCK_MODELS = {
    fast: [
      { id: 'sdxl_lightning_4step', name: 'SDXL Lightning 4-Step',  architecture: 'SDXL', vram_gb: 6.8, license: 'OpenRAIL++M', commercial_use: true },
      { id: 'sdxl_lightning_8step', name: 'SDXL Lightning 8-Step',  architecture: 'SDXL', vram_gb: 7.0, license: 'OpenRAIL++M', commercial_use: true }
    ],
    expert: [
      { id: 'flux2klein_base',        name: 'FLUX.2 Klein Base',       architecture: 'FLUX', vram_gb: 12.4, license: 'Apache 2.0',  commercial_use: true },
      { id: 'flux2klein_distilled',   name: 'FLUX.2 Klein Distilled',  architecture: 'FLUX', vram_gb: 11.8, license: 'Apache 2.0',  commercial_use: true },
      { id: 'noobai_xl',              name: 'NoobAI XL 1.0',           architecture: 'SDXL', vram_gb: 6.9,  license: 'Fair AI',     commercial_use: false },
      { id: 'animagine_xl',           name: 'Animagine XL 4.0',        architecture: 'SDXL', vram_gb: 6.8,  license: 'SDXL License',commercial_use: true },
      { id: 'illustrious_xl',         name: 'Illustrious XL',          architecture: 'SDXL', vram_gb: 7.0,  license: 'Fair AI',     commercial_use: false }
    ]
  };

  var MOCK_MODEL_CONFIGS = {
    sdxl_lightning_4step: {
      param_ranges: {
        num_inference_steps: { min: 1, max: 8,   step: 1, default: 4, locked: true },
        guidance_scale:      { min: 0, max: 2,   step: 0.1, default: 1.0, locked: true }
      },
      recommended_aspect_ratios: ['1:1', '3:4', '4:3', '16:9'],
      ratio_details: {
        '1:1':   { width: 1024, height: 1024, recommended: true },
        '3:4':   { width: 768,  height: 1024, recommended: true },
        '4:3':   { width: 1024, height: 768,  recommended: true },
        '16:9':  { width: 1152, height: 648,  recommended: true },
        '9:16':  { width: 648,  height: 1152, recommended: false }
      }
    },
    sdxl_lightning_8step: {
      param_ranges: {
        num_inference_steps: { min: 1, max: 12,  step: 1, default: 8, locked: true },
        guidance_scale:      { min: 0, max: 3,   step: 0.1, default: 1.5, locked: true }
      },
      recommended_aspect_ratios: ['1:1', '3:4', '4:3', '16:9'],
      ratio_details: {
        '1:1':   { width: 1024, height: 1024, recommended: true },
        '3:4':   { width: 768,  height: 1024, recommended: true },
        '4:3':   { width: 1024, height: 768,  recommended: true },
        '16:9':  { width: 1152, height: 648,  recommended: true },
        '9:16':  { width: 648,  height: 1152, recommended: false }
      }
    },
    flux2klein_base: {
      param_ranges: {
        num_inference_steps: { min: 10,  max: 60,  step: 1, default: 28, locked: false },
        guidance_scale:      { min: 1.0, max: 7.0, step: 0.1, default: 3.5, locked: false }
      },
      recommended_aspect_ratios: ['1:1', '3:4', '4:3', '16:9', '9:16'],
      ratio_details: {
        '1:1':   { width: 1024, height: 1024, recommended: true },
        '3:4':   { width: 768,  height: 1024, recommended: true },
        '4:3':   { width: 1024, height: 768,  recommended: true },
        '16:9':  { width: 1216, height: 680,  recommended: true },
        '9:16':  { width: 680,  height: 1216, recommended: true }
      }
    },
    flux2klein_distilled: {
      param_ranges: {
        num_inference_steps: { min: 4,  max: 20, step: 1, default: 8,  locked: false },
        guidance_scale:      { min: 1,  max: 5,  step: 0.1, default: 2.0, locked: false }
      },
      recommended_aspect_ratios: ['1:1', '3:4', '4:3', '16:9', '9:16'],
      ratio_details: {
        '1:1':   { width: 1024, height: 1024, recommended: true },
        '3:4':   { width: 768,  height: 1024, recommended: true },
        '4:3':   { width: 1024, height: 768,  recommended: true },
        '16:9':  { width: 1216, height: 680,  recommended: true },
        '9:16':  { width: 680,  height: 1216, recommended: true }
      }
    },
    noobai_xl: {
      param_ranges: {
        num_inference_steps: { min: 10, max: 50, step: 1, default: 25, locked: false },
        guidance_scale:      { min: 3,  max: 12, step: 0.5, default: 7,  locked: false }
      },
      recommended_aspect_ratios: ['1:1', '3:4', '4:3', '3:2', '16:9'],
      ratio_details: {
        '1:1':   { width: 1024, height: 1024, recommended: true },
        '3:4':   { width: 768,  height: 1024, recommended: true },
        '4:3':   { width: 1024, height: 768,  recommended: true },
        '3:2':   { width: 1152, height: 768,  recommended: true },
        '16:9':  { width: 1152, height: 648,  recommended: true }
      }
    },
    animagine_xl: {
      param_ranges: {
        num_inference_steps: { min: 10, max: 50, step: 1, default: 28, locked: false },
        guidance_scale:      { min: 4,  max: 12, step: 0.5, default: 7,  locked: false }
      },
      recommended_aspect_ratios: ['1:1', '3:4', '4:3', '3:2', '16:9'],
      ratio_details: {
        '1:1':   { width: 1024, height: 1024, recommended: true },
        '3:4':   { width: 768,  height: 1024, recommended: true },
        '4:3':   { width: 1024, height: 768,  recommended: true },
        '3:2':   { width: 1152, height: 768,  recommended: true },
        '16:9':  { width: 1152, height: 648,  recommended: true }
      }
    },
    illustrious_xl: {
      param_ranges: {
        num_inference_steps: { min: 10, max: 50, step: 1, default: 30, locked: false },
        guidance_scale:      { min: 3,  max: 12, step: 0.5, default: 7.5, locked: false }
      },
      recommended_aspect_ratios: ['1:1', '3:4', '4:3', '3:2', '16:9'],
      ratio_details: {
        '1:1':   { width: 1024, height: 1024, recommended: true },
        '3:4':   { width: 768,  height: 1024, recommended: true },
        '4:3':   { width: 1024, height: 768,  recommended: true },
        '3:2':   { width: 1152, height: 768,  recommended: true },
        '16:9':  { width: 1152, height: 648,  recommended: true }
      }
    }
  };

  var MOCK_LORAS = [
    { id: 'lora_001', name: 'Detail Enhancer',  category: 'Quality',    architecture: 'SDXL', weight: 0.6, loaded: true  },
    { id: 'lora_002', name: 'Cinematic Lights', category: 'Style',      architecture: 'SDXL', weight: 0.8, loaded: true  },
    { id: 'lora_003', name: 'Portrait Pro',     category: 'Style',      architecture: 'FLUX', weight: 1.0, loaded: false },
    { id: 'lora_004', name: 'Anime Lineart',    category: 'Style',      architecture: 'SDXL', weight: 0.5, loaded: false }
  ];

  var MOCK_STORE_MODELS = [
    { id: 'store_m_01', name: 'Realistic Vision v6', source: 'HuggingFace', architecture: 'SDXL', downloads: 1280000, license: 'CreativeML Open RAIL-M', commercial_use: true,  thumbnail: '' },
    { id: 'store_m_02', name: 'DreamShaper XL',    source: 'Civitai',     architecture: 'SDXL', downloads: 890000,  license: 'SDXL License',         commercial_use: true,  thumbnail: '' },
    { id: 'store_m_03', name: 'FLUX.1-dev',        source: 'HuggingFace', architecture: 'FLUX', downloads: 2100000, license: 'FLUX.1-dev Non-Commercial', commercial_use: false, thumbnail: '' },
    { id: 'store_m_04', name: 'Juggernaut XL',     source: 'Civitai',     architecture: 'SDXL', downloads: 560000,  license: 'Fair AI',              commercial_use: false, thumbnail: '' }
  ];

  var MOCK_STORE_LORAS = [
    { id: 'store_l_01', name: 'More Details',         source: 'Civitai', base_model: 'SDXL 1.0', downloads: 420000, license: 'OpenRAIL',      commercial_use: true,  thumbnail: '' },
    { id: 'store_l_02', name: 'Epic Lighting',        source: 'Civitai', base_model: 'SDXL 1.0', downloads: 310000, license: 'CC BY-SA 4.0', commercial_use: true,  thumbnail: '' },
    { id: 'store_l_03', name: 'Add More Details',     source: 'Civitai', base_model: 'FLUX',     downloads: 180000, license: 'Non-Commercial', commercial_use: false, thumbnail: '' },
    { id: 'store_l_04', name: 'Perfect Skin',         source: 'Civitai', base_model: 'SDXL 1.0', downloads: 250000, license: 'OpenRAIL',      commercial_use: true,  thumbnail: '' }
  ];

  var MOCK_HISTORY = []; /* populated by generate calls */

  /* ── Mock helpers ──────────────────────────────────────────── */

  function delay(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function ok(data) { return Promise.resolve({ ok: true, data: data }); }

  function err(msg, code) {
    return Promise.resolve({ ok: false, error: { message: msg, code: code || 500 } });
  }

  var currentModelId = 'sdxl_lightning_4step';
  var currentMode = 'fast';

  /* ── Mock endpoint implementations ─────────────────────────── */

  var mockEndpoints = {
    'GET /api/info': function () {
      return delay(80).then(function () {
        return ok({
          version: '1.0.0-mock',
          backend: 'mock',
          gpu: { name: 'Mock ROCm GPU', vram_total_gb: 24, vram_used_gb: 4.2 },
          current_model: currentModelId,
          current_mode: currentMode
        });
      });
    },

    'GET /api/health': function () {
      return delay(60).then(function () {
        return ok({
          status: 'ready',
          gpu: { utilization: 12, vram_used_gb: 4.2, vram_total_gb: 24, temperature: 58 },
          current_model: currentModelId,
          available_styles: MOCK_STYLES.map(function (s) { return s.key; })
        });
      });
    },

    'GET /api/styles': function () {
      return delay(40).then(function () {
        return ok({ styles: MOCK_STYLES });
      });
    },

    'GET /api/models': function (params) {
      var mode = (params && params.mode) || currentMode;
      var list = MOCK_MODELS[mode] || [];
      return delay(80).then(function () {
        return ok({ models: list.map(function (m) { return Object.assign({}, m, { is_current: m.id === currentModelId }); }) });
      });
    },

    'GET /api/models/current': function () {
      var model = findModel(currentModelId);
      return delay(40).then(function () {
        return ok({ model: model });
      });
    },

    'GET /api/models/{id}/config': function (_, params) {
      var id = params.id;
      var cfg = MOCK_MODEL_CONFIGS[id];
      if (!cfg) return err('Model not found: ' + id, 404);
      return delay(60).then(function () {
        return ok(cfg);
      });
    },

    'POST /api/models/switch': function (body) {
      var id = body.model_id;
      var model = findModel(id);
      if (!model) return err('Model not found: ' + id, 404);
      return delay(1200).then(function () {
        currentModelId = id;
        /* auto-switch mode if needed */
        if (MOCK_MODELS.fast.some(function (m) { return m.id === id; })) currentMode = 'fast';
        else currentMode = 'expert';
        return ok({ model: model });
      });
    },

    'GET /api/loras': function () {
      var loaded = MOCK_LORAS.filter(function (l) { return l.loaded; });
      return delay(50).then(function () {
        return ok({ loras: loaded });
      });
    },

    'POST /api/loras/load': function (body) {
      var target = MOCK_LORAS.find(function (l) { return l.id === body.lora_id || l.name === body.path; });
      if (!target) return err('LoRA not found', 404);
      target.loaded = true;
      if (typeof body.weight === 'number') target.weight = body.weight;
      return delay(600).then(function () { return ok({ lora: target }); });
    },

    'POST /api/loras/unload': function (body) {
      var target = MOCK_LORAS.find(function (l) { return l.id === body.lora_id; });
      if (!target) return err('LoRA not found', 404);
      target.loaded = false;
      return delay(300).then(function () { return ok({ success: true }); });
    },

    'GET /api/store/models': function (params) {
      var limit = (params && params.limit) ? parseInt(params.limit) : 20;
      return delay(200).then(function () {
        return ok({ items: MOCK_STORE_MODELS.slice(0, limit), total: MOCK_STORE_MODELS.length });
      });
    },

    'GET /api/store/loras': function (params) {
      var limit = (params && params.limit) ? parseInt(params.limit) : 20;
      return delay(200).then(function () {
        return ok({ items: MOCK_STORE_LORAS.slice(0, limit), total: MOCK_STORE_LORAS.length });
      });
    },

    'POST /api/store/download': function (body) {
      return delay(1500).then(function () {
        return ok({ success: true, downloaded_path: body.target_path || '/models/downloaded.safetensors' });
      });
    },

    'GET /api/gpu/status': function () {
      return delay(40).then(function () {
        return ok({
          vram_total_gb: 24,
          vram_used_gb: 4.2 + Math.random() * 0.5,
          utilization: 12 + Math.floor(Math.random() * 6),
          temperature: 58 + Math.floor(Math.random() * 4)
        });
      });
    },

    'POST /api/generate/text2img': function (body) {
      return delay(1500 + Math.random() * 800).then(function () {
        var warnings = [];
        var cfg = MOCK_MODEL_CONFIGS[currentModelId];
        if (cfg && body.aspect_ratio && cfg.recommended_aspect_ratios.indexOf(body.aspect_ratio) === -1) {
          warnings.push('该比例非当前模型推荐比例，可能效果不佳');
        }
        var dims = ratioToDims(body.aspect_ratio, cfg);
        var result = {
          image: generatePlaceholderImage(dims.width, dims.height, body.style || 'none'),
          width: dims.width,
          height: dims.height,
          generation_time_sec: 1.6 + Math.random(),
          warnings: warnings,
          seed: body.seed || Math.floor(Math.random() * 99999999)
        };
        MOCK_HISTORY.unshift({
          id: 'gen_' + Date.now(),
          image: result.image,
          prompt: body.prompt || '',
          mode: currentMode,
          model: currentModelId,
          style: body.style || '',
          timestamp: Date.now(),
          width: result.width,
          height: result.height
        });
        if (MOCK_HISTORY.length > 30) MOCK_HISTORY.length = 30;
        return ok(result);
      });
    },

    'POST /api/generate/img2img': function (body) {
      return delay(1800 + Math.random() * 800).then(function () {
        var warnings = [];
        var cfg = MOCK_MODEL_CONFIGS[currentModelId];
        if (cfg && body.aspect_ratio && cfg.recommended_aspect_ratios.indexOf(body.aspect_ratio) === -1) {
          warnings.push('该比例非当前模型推荐比例，可能效果不佳');
        }
        var dims = ratioToDims(body.aspect_ratio, cfg);
        var result = {
          image: generatePlaceholderImage(dims.width, dims.height, body.style || 'img2img'),
          width: dims.width,
          height: dims.height,
          generation_time_sec: 2.0 + Math.random(),
          warnings: warnings,
          seed: body.seed || Math.floor(Math.random() * 99999999)
        };
        MOCK_HISTORY.unshift({
          id: 'gen_' + Date.now(),
          image: result.image,
          prompt: body.prompt || '[img2img]',
          mode: currentMode,
          model: currentModelId,
          style: body.style || '',
          timestamp: Date.now(),
          width: result.width,
          height: result.height
        });
        if (MOCK_HISTORY.length > 30) MOCK_HISTORY.length = 30;
        return ok(result);
      });
    }
  };

  /* Helper: find model across both modes */
  function findModel(id) {
    var all = MOCK_MODELS.fast.concat(MOCK_MODELS.expert);
    return all.find(function (m) { return m.id === id; }) || null;
  }

  /* Helper: aspect ratio → pixel dims */
  function ratioToDims(ratio, cfg) {
    if (cfg && cfg.ratio_details && cfg.ratio_details[ratio]) {
      return { width: cfg.ratio_details[ratio].width, height: cfg.ratio_details[ratio].height };
    }
    return { width: 1024, height: 1024 };
  }

  /* Helper: generate SVG placeholder data URL */
  function generatePlaceholderImage(w, h, label) {
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="#2a2a2a"/><stop offset="100%" stop-color="#1a1a1a"/></linearGradient></defs>' +
      '<rect width="100%" height="100%" fill="url(#g)"/>' +
      '<text x="50%" y="50%" fill="#666" font-family="Inter,sans-serif" font-size="16" text-anchor="middle" dominant-baseline="middle">' +
      (label || 'generated') + ' · ' + w + '×' + h + '</text></svg>';
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
  }

  /* ── HTTP transport (real API) ─────────────────────────────── */

  function httpRequest(method, path, body, params, isForm) {
    var url = API_BASE + path;
    if (params && Object.keys(params).length) {
      var qs = Object.keys(params).map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); }).join('&');
      url += '?' + qs;
    }
    var opts = { method: method };
    if (isForm && typeof FormData !== 'undefined' && body instanceof FormData) {
      /* FormData: 不手动设置 Content-Type (浏览器自动带 boundary) */
      opts.body = body;
    } else {
      opts.headers = { 'Content-Type': 'application/json' };
      if (body) opts.body = JSON.stringify(body);
    }
    return fetch(url, opts).then(function (r) {
      return r.json().then(function (data) {
        return { ok: r.ok, data: data, status: r.status };
      });
    }).catch(function (e) {
      return { ok: false, error: { message: 'Network error: ' + e.message, code: 0 } };
    });
  }

  /* ── Real-backend field adapters ───────────────────────────── */

  /* 架构小写转原稿期望的大写标签 */
  function archLabel(arch) {
    var a = String(arch || '').toLowerCase();
    if (a.indexOf('flux') !== -1) return 'FLUX';
    if (a.indexOf('sdxl') !== -1 || a === 'sd') return 'SDXL';
    return arch || '';
  }

  /* 真后端 models 条目 → 原稿期望结构 */
  function adaptModel(m) {
    return {
      id: m.id,
      name: m.name,
      architecture: archLabel(m.architecture),
      vram_gb: m.vram_gb,
      license: (m.license_info && m.license_info.name) || m.license || '',
      commercial_use: !!m.commercial_use,
      license_info: m.license_info || {},
    };
  }

  /* 真后端 config → 原稿期望 (补充 default/step, ratio_details 转对象) */
  function adaptConfig(cfg) {
    var src = cfg || {};
    var pr = src.param_ranges || {};
    function fillRange(r, def) {
      r = r || {};
      return {
        min: r.min != null ? r.min : 0,
        max: r.max != null ? r.max : 100,
        step: r.step != null ? r.step : 1,
        default: r.default != null ? r.default : (def != null ? def : (r.max != null ? r.max : 4)),
        locked: !!r.locked,
      };
    }
    var defaults = src.default_params || {};
    /* 真后端用 supported_ratios;mock 用 recommended_aspect_ratios,两者都兜底 */
    var ratios = src.supported_ratios || src.recommended_aspect_ratios || [];
    var ratioObj = {};
    var rd = src.ratio_details;
    if (Array.isArray(rd)) {
      /* 真后端: ratio_details 是数组 */
      rd.forEach(function (r) {
        if (r && r.ratio) ratioObj[r.ratio] = { width: r.width, height: r.height, recommended: r.recommended };
      });
    } else if (rd && typeof rd === 'object') {
      /* mock: ratio_details 已是 { ratio: {width,height,recommended} } */
      ratioObj = rd;
    }
    /* 若 ratio_details 数组缺失,用 supported_ratios 兜底 */
    if (Object.keys(ratioObj).length === 0) {
      var RATIO_DIMS = { '1:1':[1024,1024], '3:4':[768,1024], '4:3':[1024,768], '3:2':[1152,768], '16:9':[1152,648], '9:16':[648,1152] };
      ratios.forEach(function (r) {
        var d = RATIO_DIMS[r] || [1024, 1024];
        ratioObj[r] = { width: d[0], height: d[1], recommended: true };
      });
    }
    /* 推荐比例: 优先从 ratio_details 的 recommended 标志推导 (真后端数组含此标志);
       若均无标志(mock 纯列表场景),退回 supported/recommended 列表本身 */
    var recList = Object.keys(ratioObj).filter(function (k) {
      return ratioObj[k] && ratioObj[k].recommended !== false;
    });
    if (recList.length === 0) recList = ratios.slice();
    return {
      param_ranges: {
        num_inference_steps: fillRange(pr.num_inference_steps, defaults.num_inference_steps),
        guidance_scale: fillRange(pr.guidance_scale, defaults.guidance_scale),
        strength: fillRange(pr.strength, defaults.strength != null ? defaults.strength : 0.8),
      },
      recommended_aspect_ratios: recList,
      ratio_details: ratioObj,
    };
  }

  /* 真后端 loras 字典 → 原稿期望数组 */
  function adaptLoras(loras) {
    /* loras 形如 { id: {path, weight} } */
    if (!loras || typeof loras !== 'object') return [];
    return Object.keys(loras).map(function (id) {
      var info = loras[id] || {};
      var path = info.path || id;
      var name = path.split('/').pop() || id;
      var lower = path.toLowerCase();
      return {
        id: id,
        name: name,
        path: path,
        weight: info.weight != null ? info.weight : 0.8,
        architecture: lower.indexOf('flux') !== -1 ? 'FLUX' : 'SDXL',
        category: 'general_quality',
        loaded: true,
      };
    });
  }

  /* 真后端生成响应 → 原稿期望 (补 seed) */
  function adaptGen(resp) {
    return {
      image: resp.image,
      seed: resp.seed != null ? resp.seed : Math.floor(Math.random() * 99999999),
      generation_time_sec: resp.generation_time_sec,
      warnings: resp.warnings || [],
      width: resp.width,
      height: resp.height,
    };
  }

  /* ── Public API ────────────────────────────────────────────── */

  var NF = window.NF || (window.NF = {});

  function apiCall(method, path, body, params) {
    if (USE_REAL_API) return httpRequest(method, path, body, params);
    return mockCall(method, path, body, params);
  }

  function mockCall(method, path, body, params) {
    var key = method + ' ' + API_BASE + path;
    var handler = mockEndpoints[key];
    if (!handler) {
      var fullPath = API_BASE + path;
      for (var pattern in mockEndpoints) {
        var parts = pattern.split(' ');
        var m = parts[0], p = parts[1];
        if (m !== method) continue;
        var regex = new RegExp('^' + p.replace(/\{(\w+)\}/g, '([^/]+)') + '$');
        var match = fullPath.match(regex);
        if (match) {
          var paramNames = (p.match(/\{\w+\}/g) || []).map(function (s) { return s.slice(1, -1); });
          var pathParams = {};
          paramNames.forEach(function (name, i) { pathParams[name] = match[i + 1]; });
          return mockEndpoints[pattern](body, pathParams, params);
        }
      }
      return err('Endpoint not found: ' + method + ' ' + path, 404);
    }
    return handler(body, {}, params);
  }

  NF.api = {
    getInfo: function () {
      return apiCall('GET', '/info');
    },
    getHealth: function () {
      return apiCall('GET', '/health');
    },
    getStyles: function () {
      return apiCall('GET', '/styles');
    },
    getModels: function (mode) {
      return apiCall('GET', '/models', null, { mode: mode }).then(function (res) {
        if (!res.ok || !res.data) return res;
        var models = (res.data.models || []).map(adaptModel);
        return { ok: true, data: { models: models } };
      });
    },
    getCurrentModel: function () {
      return apiCall('GET', '/models/current').then(function (res) {
        if (!res.ok || !res.data) return res;
        var cur = res.data.current || res.data.model_id || {};
        var model = typeof cur === 'object' ? adaptModel(cur) : { id: res.data.current || res.data.model_id };
        return { ok: true, data: { model: model } };
      });
    },
    getModelConfig: function (id) {
      return apiCall('GET', '/models/' + id + '/config').then(function (res) {
        if (!res.ok || !res.data) return res;
        var cfg = res.data.config || res.data;
        return { ok: true, data: adaptConfig(cfg) };
      });
    },
    switchModel: function (id) {
      return apiCall('POST', '/models/switch', { model_id: id }).then(function (res) {
        if (!res.ok) return res;
        return { ok: true, data: { model: { id: id } } };
      });
    },
    getLoras: function () {
      return apiCall('GET', '/loras').then(function (res) {
        if (!res.ok || !res.data) return res;
        return { ok: true, data: { loras: adaptLoras(res.data.loras) } };
      });
    },
    loadLora: function (path, w) {
      return apiCall('POST', '/loras/load', { path: path, weight: w });
    },
    unloadLora: function (loraId) {
      return apiCall('POST', '/loras/unload', { lora_id: loraId });
    },
    getStoreModels: function (src, limit) {
      return apiCall('GET', '/store/models', null, { source: src || 'hf', limit: limit || 20 }).then(function (res) {
        if (!res.ok || !res.data) return res;
        var items = (res.data.models || res.data.items || []).map(function (m) {
          var lic = (m.license_info && m.license_info.name) || m.license;
          var commercial = m.commercial_use;
          if (commercial === 'conditional') commercial = true;
          return {
            id: m.id || m.name,
            name: m.name || '',
            source: res.data.source || m.source || src || 'hf',
            architecture: archLabel(m.architecture),
            downloads: m.downloads || 0,
            license: lic,
            commercial_use: !!commercial,
            thumbnail: '',
          };
        });
        return { ok: true, data: { items: items } };
      });
    },
    getStoreLoras: function (base, limit) {
      return apiCall('GET', '/store/loras', null, { source: 'civitai', base_model: base || 'SDXL 1.0', limit: limit || 20 }).then(function (res) {
        if (!res.ok || !res.data) return res;
        var items = (res.data.loras || res.data.items || []).map(function (l) {
          var commercial = l.commercial_use;
          if (commercial === 'conditional') commercial = true;
          return {
            id: l.id || l.name,
            name: l.name || '',
            source: 'Civitai',
            base_model: l.base_model || base || 'SDXL 1.0',
            downloads: l.downloads || 0,
            license: l.license,
            commercial_use: !!commercial,
            thumbnail: '',
          };
        });
        return { ok: true, data: { items: items } };
      });
    },
    downloadStore: function (url, tp, ty) {
      return apiCall('POST', '/store/download', { url: url, target_path: tp, type: ty });
    },
    getGpuStatus: function () {
      return apiCall('GET', '/gpu/status');
    },
    generateText2Img: function (payload) {
      return apiCall('POST', '/generate/text2img', payload).then(function (res) {
        if (!res.ok) return res;
        return { ok: true, data: adaptGen(res.data) };
      });
    },
    generateImg2Img: function (payload) {
      if (payload instanceof FormData) {
        if (!USE_REAL_API) {
          /* mock 模式: 从 FormData 提取字段,返回占位图 (本地预览也能出图) */
          var style = payload.get('style') || 'img2img';
          var ratio = payload.get('aspect_ratio') || '1:1';
          var mode = payload.get('mode') || currentMode;
          return delay(1800 + Math.random() * 800).then(function () {
            var cfg = MOCK_MODEL_CONFIGS[currentModelId];
            var dims = ratioToDims(ratio, cfg);
            var result = {
              image: generatePlaceholderImage(dims.width, dims.height, style),
              width: dims.width,
              height: dims.height,
              generation_time_sec: 2.0 + Math.random(),
              warnings: [],
              seed: Math.floor(Math.random() * 99999999)
            };
            MOCK_HISTORY.unshift({
              id: 'gen_' + Date.now(),
              image: result.image,
              prompt: '[img2img]',
              mode: mode,
              model: currentModelId,
              style: style,
              timestamp: Date.now(),
              width: result.width,
              height: result.height
            });
            if (MOCK_HISTORY.length > 30) MOCK_HISTORY.length = 30;
            return { ok: true, data: result };
          });
        }
        return httpRequest('POST', '/generate/img2img', payload, null, true).then(function (res) {
          if (!res.ok) return res;
          return { ok: true, data: adaptGen(res.data) };
        });
      }
      return Promise.reject(new Error('img2img requires a FormData payload'));
    },
    getHistory: function () {
      return Promise.resolve({ ok: true, data: { items: MOCK_HISTORY } });
    }
  };

  NF.api.useRealBackend = function (baseUrl) {
    USE_REAL_API = true;
    API_BASE = baseUrl || '/api';
  };

  NF.api.useMock = function () {
    USE_REAL_API = false;
  };

  /* 自动探测后端: 可达则用真实,否则回退 mock (本地无后端时也能预览完整功能) */
  NF.api.autoDetect = function (timeoutMs) {
    timeoutMs = timeoutMs || 1500;
    var ctrl;
    if (typeof AbortController !== 'undefined') ctrl = new AbortController();
    var timer = setTimeout(function () {
      if (ctrl) ctrl.abort();
    }, timeoutMs);
    return fetch(API_BASE + '/health', { signal: ctrl && ctrl.signal })
      .then(function (r) {
        clearTimeout(timer);
        USE_REAL_API = r.ok;
        return r.ok;
      })
      .catch(function () {
        clearTimeout(timer);
        USE_REAL_API = false;
        return false;
      });
  };

  NF.api.setMode = function (mode) { currentMode = mode; };
  NF.api.getMode = function () { return currentMode; };
})();
