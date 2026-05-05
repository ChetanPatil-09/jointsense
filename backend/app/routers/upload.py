"""
File Upload Router — accepts a Python calculation file,
parses it with AST, extracts structure, and suggests sidebar config.
"""

import ast, re, json
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.core.config import settings

router = APIRouter()


# ── Formula extractor ─────────────────────────────────────────
def extract_formulas(node):
    out = []
    for child in ast.walk(node):
        if isinstance(child, ast.Return) and child.value is not None:
            try:
                expr = ast.unparse(child.value)
                if any(op in expr for op in ['/', '*', '**', 'math.']):
                    out.append(expr)
            except Exception:
                pass
    return out


# ── Deep AST parser ───────────────────────────────────────────
def parse_python_file(source: str) -> dict:
    try:
        tree = ast.parse(source)
    except SyntaxError as e:
        raise ValueError(f"Syntax error: {e}")

    result = {"classes": [], "functions": [], "imports": [], "constants": [], "formulas": []}

    for node in ast.iter_child_nodes(tree):
        if isinstance(node, ast.Import):
            for a in node.names:
                result["imports"].append(a.name)
        elif isinstance(node, ast.ImportFrom):
            if node.module:
                result["imports"].append(node.module)
        elif isinstance(node, ast.Assign):
            for t in node.targets:
                if isinstance(t, ast.Name) and t.id.isupper():
                    try:
                        result["constants"].append({"name": t.id, "value": ast.literal_eval(node.value)})
                    except Exception:
                        pass
        elif isinstance(node, ast.ClassDef):
            cls = {"name": node.name, "docstring": ast.get_docstring(node) or "",
                   "methods": [], "init_args": [], "init_defaults": {}}
            for item in ast.iter_child_nodes(node):
                if not isinstance(item, ast.FunctionDef):
                    continue
                args = [a.arg for a in item.args.args if a.arg != "self"]
                fmls = extract_formulas(item)
                defaults = {}
                default_vals = [ast.literal_eval(d) for d in item.args.defaults
                                if isinstance(d, (ast.Constant,))]
                for arg, dval in zip(reversed(args), reversed(default_vals)):
                    try:
                        defaults[arg] = float(dval)
                    except Exception:
                        pass
                cls["methods"].append({
                    "name": item.name, "args": args, "formulas": fmls,
                    "is_init": item.name == "__init__",
                    "docstring": ast.get_docstring(item) or "",
                    "defaults": defaults,
                    "returns": ast.unparse(item.returns) if item.returns else "",
                })
                if item.name == "__init__":
                    cls["init_args"] = args
                    cls["init_defaults"] = defaults
                for f in fmls:
                    result["formulas"].append({"context": f"{node.name}.{item.name}", "expression": f, "args": args})
            result["classes"].append(cls)
        elif isinstance(node, ast.FunctionDef):
            args = [a.arg for a in node.args.args]
            fmls = extract_formulas(node)
            result["functions"].append({"name": node.name, "args": args,
                                        "docstring": ast.get_docstring(node) or "", "formulas": fmls})
            for f in fmls:
                result["formulas"].append({"context": node.name, "expression": f, "args": args})
    return result


# ── Failure mode detection ────────────────────────────────────
KNOWN_MODES = {"bearing","net_section","net section","shear_out","shear out","pull_through","pull through","shear","tension","interaction"}
KEYWORDS = {
    "bearing":     ["bearing","fbru","fbry"],
    "net_section": ["net_section","net section","net_area"],
    "shear_out":   ["shear_out","shear out","shear_area"],
    "pull_through":["pull_through","pull through","pull_thru"],
    "buckling":    ["buckling","euler","slender"],
    "fatigue":     ["fatigue","cycles","endurance"],
    "bending":     ["bending","moment","flexur"],
    "compression": ["compression","fcy","compressive"],
    "lug":         ["lug","clevis","pin_bearing"],
    "weld":        ["weld","fillet","groove"],
}

def detect_modes(source):
    src = source.lower()
    detected, new = [], []
    for mode, kws in KEYWORDS.items():
        if any(k in src for k in kws):
            label = mode.replace("_"," ").title()
            detected.append(label)
            if mode not in KNOWN_MODES:
                new.append(label)
    return detected, new


# ── Input detection ───────────────────────────────────────────
UNIT_MAP = {
    "width":"mm","thickness":"mm","diameter":"mm","length":"mm",
    "height":"mm","radius":"mm","distance":"mm","edge":"mm",
    "load":"N","force":"N","shear":"N","axial":"N",
    "stress":"MPa","allowable":"MPa","ftu":"MPa","fsu":"MPa",
    "fbru":"MPa","fty":"MPa","modulus":"MPa",
    "area":"mm²","moment":"N·mm","factor":"—","ratio":"—",
}
DESC_MAP = {
    "width":"Plate width","thickness":"Plate thickness","diameter":"Bolt/hole diameter",
    "bearing_allowable":"Bearing allowable stress","net_allowable":"Net section allowable",
    "shear_allowable":"Shear allowable stress","edge_distance":"Edge distance",
    "axial_load":"Axial load","load":"Applied load","ftu":"Ultimate tensile strength",
    "fsu":"Ultimate shear strength","fbru":"Ultimate bearing strength",
}

def detect_inputs(parsed):
    inputs, seen = [], set()
    for cls in parsed["classes"]:
        for arg in cls["init_args"]:
            if arg not in seen:
                seen.add(arg)
                unit = next((v for k,v in UNIT_MAP.items() if k in arg.lower()), "—")
                desc = DESC_MAP.get(arg, arg.replace("_"," ").title())
                inputs.append({"name":arg,"description":desc,"unit":unit})
    for fn in parsed["functions"]:
        for arg in fn["args"]:
            if arg not in seen and arg != "self":
                seen.add(arg)
                unit = next((v for k,v in UNIT_MAP.items() if k in arg.lower()), "—")
                desc = DESC_MAP.get(arg, arg.replace("_"," ").title())
                inputs.append({"name":arg,"description":desc,"unit":unit})
    return inputs


# ── Suggested sidebar config ──────────────────────────────────
def extract_suggested_config(source: str, parsed: dict) -> dict:
    """
    Smart extraction of numeric values from the file.
    Uses multiple strategies so it works even without __init__ defaults.
    """
    config = {"bolt_diameter": None, "plates": [], "edge_distance_mode": None,
              "Fx": None, "Fy": None, "Fz": None, "detected_fields": []}

    src_lines = source

    # ── Strategy 1: scan for assignment patterns anywhere in file
    num_assigns = {}
    for m in re.finditer(r'(\w+)\s*=\s*([\d]+\.?[\d]*)', source):
        name, val = m.group(1).lower(), float(m.group(2))
        num_assigns[name] = val

    # ── Bolt diameter
    for key in ["bolt_diameter","diameter","d","bolt_d","fastener_diameter"]:
        if key in num_assigns:
            val = num_assigns[key]
            if 1.0 <= val <= 100.0:
                config["bolt_diameter"] = val
                config["detected_fields"].append(f"bolt_diameter={val}mm")
                break

    # ── Strategy 2: __init__ defaults per class
    plates_from_init = []
    for cls in parsed["classes"]:
        defs = cls.get("init_defaults", {})
        plate = {}
        for arg, val in defs.items():
            al = arg.lower()
            if "width" in al and 5 <= val <= 2000:
                plate["width"] = val
            elif "thick" in al and 0.1 <= val <= 200:
                plate["thickness"] = val
        if plate:
            plate.setdefault("width", 25.4)
            plate.setdefault("thickness", 3.175)
            plate["material_key"] = "al2024_t3"
            plates_from_init.append(plate)

    # ── Strategy 3: scan file for width/thickness assignments if no defaults
    if not plates_from_init:
        plate = {}
        for key in ["width","plate_width","w"]:
            if key in num_assigns and 5 <= num_assigns[key] <= 2000:
                plate["width"] = num_assigns[key]
                break
        for key in ["thickness","t","plate_thickness","thk"]:
            if key in num_assigns and 0.1 <= num_assigns[key] <= 200:
                plate["thickness"] = num_assigns[key]
                break
        if plate:
            plate.setdefault("width", 25.4)
            plate.setdefault("thickness", 3.175)
            plate["material_key"] = "al2024_t3"
            plates_from_init.append(plate)

    # If we found plate data, use it; otherwise give 1 sensible default plate
    if plates_from_init:
        config["plates"] = plates_from_init
        for p in plates_from_init:
            config["detected_fields"].append(f"plate t={p['thickness']}mm w={p['width']}mm")
    else:
        # Always give at least 1 plate so sidebar isn't empty
        config["plates"] = [{"width": 25.4, "thickness": 3.175, "material_key": "al2024_t3"}]

    # ── Loads
    for key, keys in {
        "Fx": ["fx","axial_load","axial","p_axial","load_axial"],
        "Fy": ["fy","shear_y","vy","load_y"],
        "Fz": ["fz","shear_z","vz","load_z","shear_load","load"],
    }.items():
        for k in keys:
            if k in num_assigns and num_assigns[k] > 0:
                config[key] = num_assigns[k]
                config["detected_fields"].append(f"{key}={num_assigns[k]}N")
                break

    # ── Edge distance
    if re.search(r'2\s*\*\s*[d_]|2\.0\s*\*\s*[d_]|edge.*2[^.]', source, re.IGNORECASE):
        config["edge_distance_mode"] = "2d"
    elif re.search(r'1\.5\s*\*\s*[d_]|edge.*1\.5', source, re.IGNORECASE):
        config["edge_distance_mode"] = "1.5d"

    return config


# ── Integration steps ─────────────────────────────────────────
def integration_steps(parsed, new_modes):
    steps = []
    cls_names = [c["name"] for c in parsed["classes"]]
    if cls_names:
        steps.append(f"Copy class(es) {', '.join(cls_names)} into backend/app/services/plate_analysis.py after the existing Plate class.")
    pub = [f"{c['name']}.{m['name']}()" for c in parsed["classes"]
           for m in c["methods"] if not m["is_init"] and not m["name"].startswith("_")]
    if pub:
        steps.append(f"Call these methods inside analyze_joint(): {', '.join(pub[:5])}.")
    if new_modes:
        steps.append(f"Add results for new failure modes ({', '.join(new_modes)}) to the PlateResult dataclass and all_margins list.")
    if parsed["formulas"]:
        steps.append(f"Verify {len(parsed['formulas'])} formula(s) match your design standard (MMPDS/MIL-HDBK-5) before integrating.")
    steps.append("Add any extra input fields to frontend/src/components/sidebar/Sidebar.jsx for new parameters.")
    return steps


# ── Summary builder ───────────────────────────────────────────
def build_summary(parsed, modes):
    cls_names = [c["name"] for c in parsed["classes"]]
    method_names = [m["name"].replace("_"," ") for c in parsed["classes"]
                    for m in c["methods"] if not m["is_init"]]
    parts = []
    if cls_names:
        parts.append(f"Contains {len(cls_names)} class(es): {', '.join(cls_names)}.")
    if method_names:
        parts.append(f"Defines {len(method_names)} method(s): {', '.join(method_names[:5])}{'...' if len(method_names)>5 else ''}.")
    if modes:
        parts.append(f"Covers failure modes: {', '.join(modes)}.")
    if parsed["formulas"]:
        parts.append(f"Contains {len(parsed['formulas'])} formula(s).")
    return " ".join(parts) if parts else "Python calculation file detected."


# ── Optional Claude enrichment ────────────────────────────────
def enrich_with_claude(source, local_result):
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        prompt = f"""Analyze this aerospace Python calculation file. Respond ONLY in JSON:
{{
  "summary": "2 sentence plain English summary",
  "additional_suggestions": ["tip 1", "tip 2"],
  "engineering_notes": "One paragraph engineering insight"
}}

SOURCE:
```python
{source[:2500]}
```"""
        msg = client.messages.create(model="claude-sonnet-4-20250514", max_tokens=600,
                                     messages=[{"role":"user","content":prompt}])
        text = msg.content[0].text.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"): text = text[4:]
        return json.loads(text.strip())
    except Exception:
        return None


# ── Upload endpoint ───────────────────────────────────────────
@router.post("/upload-calc")
async def upload_calculation_file(file: UploadFile = File(...)):
    if not file.filename.endswith(".py"):
        raise HTTPException(400, "Only Python (.py) files are supported.")
    content = await file.read()
    if len(content) > 500_000:
        raise HTTPException(400, "File too large. Max 500KB.")
    try:
        source = content.decode("utf-8")
    except UnicodeDecodeError:
        try:
            source = content.decode("latin-1")
        except Exception:
            raise HTTPException(400, "Could not decode file.")

    try:
        parsed = parse_python_file(source)
    except ValueError as e:
        raise HTTPException(422, str(e))

    modes, new_modes   = detect_modes(source)
    inputs             = detect_inputs(parsed)
    steps              = integration_steps(parsed, new_modes)
    summary            = build_summary(parsed, modes)
    suggested_config   = extract_suggested_config(source, parsed)
    compatible         = bool(parsed["classes"] or parsed["functions"])

    result = {
        "filename": file.filename,
        "file_size_bytes": len(content),
        "suggested_config": suggested_config,
        "parsed": {
            "class_count":    len(parsed["classes"]),
            "function_count": len(parsed["functions"]),
            "formula_count":  len(parsed["formulas"]),
            "classes":   parsed["classes"],
            "functions": parsed["functions"],
            "imports":   parsed["imports"],
            "constants": parsed["constants"],
            "formulas":  parsed["formulas"],
        },
        "analysis": {
            "summary": summary,
            "failure_modes":       modes,
            "new_failure_modes":   new_modes,
            "inputs_detected":     inputs,
            "formulas": [{"name": f["context"], "expression": f["expression"],
                          "description": f"In {f['context']} — args: {', '.join(f['args'])}"}
                         for f in parsed["formulas"]],
            "integration_suggestions": steps,
            "compatible": compatible,
            "compatibility_notes": (
                "Directly compatible — copy classes into plate_analysis.py."
                if compatible else "No classes or functions found. Check the file is a valid Python calculation."
            ),
            "ai_enriched": False,
            "engineering_notes": "",
        },
    }

    if settings.ANTHROPIC_API_KEY:
        enrichment = enrich_with_claude(source, result)
        if enrichment:
            result["analysis"]["summary"]                  = enrichment.get("summary", summary)
            result["analysis"]["engineering_notes"]        = enrichment.get("engineering_notes", "")
            result["analysis"]["integration_suggestions"] += enrichment.get("additional_suggestions", [])
            result["analysis"]["ai_enriched"]              = True

    return result
