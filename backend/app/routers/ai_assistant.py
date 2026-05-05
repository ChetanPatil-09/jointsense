from fastapi import APIRouter, HTTPException
from app.models.schemas import AIAnalysisRequest, AIAnalysisResponse
from app.core.config import settings
import anthropic
import json

router = APIRouter()

SYSTEM_PROMPT = """You are a senior aerospace structural engineer and CAE specialist with 20+ years of experience in bolted joint analysis per MMPDS and MIL-HDBK-5. 

When analyzing structural joint data:
1. Identify and explain the CRITICAL failure mode in clear engineering terms
2. Explain WHY this mode is critical (load path, geometry, material)
3. Give concrete, specific design recommendations with expected improvement percentages
4. Mention relevant aerospace standards where applicable
5. Keep language professional but accessible

Respond in exactly this JSON format:
{
  "analysis": "Main analysis paragraph (3-4 sentences, specific numbers)",
  "critical_mode_explanation": "One focused paragraph explaining the critical failure mode physically",
  "recommendations": [
    "Specific recommendation 1 with expected outcome",
    "Specific recommendation 2 with expected outcome",
    "Specific recommendation 3 with expected outcome"
  ]
}

Return ONLY valid JSON. No markdown, no extra text."""


@router.post("/analyze", response_model=AIAnalysisResponse)
async def ai_analyze(body: AIAnalysisRequest):
    if not settings.ANTHROPIC_API_KEY:
        raise HTTPException(503, "ANTHROPIC_API_KEY not configured.")

    r = body.joint_result
    user_q = body.user_question or ""

    prompt = f"""Analyze this aerospace bolted joint:

CONFIGURATION:
- Bolt: d={r.bolt_diameter}mm, {r.bolt.material_name}
- Plates: {len(r.plates)} plate(s), grip={r.grip_length:.2f}mm, edge={r.edge_distance:.2f}mm
- Shear planes: {r.n_shear_planes}

LOADS:
- Axial Fx={r.Fx:.0f}N | Resultant Shear={r.resultant_shear:.1f}N
- Effective tensile (with prying): {r.effective_tensile:.1f}N

BOLT RESULTS:
- Shear: {r.bolt.shear.applied_mpa:.1f}/{r.bolt.shear.allowable_mpa:.1f} MPa → MoS={r.bolt.shear.margin_of_safety:.3f} [{r.bolt.shear.status}]
- Tension: {r.bolt.tension.applied_mpa:.1f}/{r.bolt.tension.allowable_mpa:.1f} MPa → MoS={r.bolt.tension.margin_of_safety:.3f} [{r.bolt.tension.status}]
- Interaction: MoS={r.bolt.interaction.margin_of_safety:.3f} [{r.bolt.interaction.status}]

PLATE RESULTS:
""" + "\n".join([
        f"Plate {p.plate_index} ({p.material_name}, t={p.thickness:.2f}mm, w={p.width:.2f}mm):\n"
        f"  Bearing: {p.bearing.applied_mpa:.1f}/{p.bearing.allowable_mpa:.1f} → MoS={p.bearing.margin_of_safety:.3f} [{p.bearing.status}]\n"
        f"  Net Section: {p.net_section.applied_mpa:.1f}/{p.net_section.allowable_mpa:.1f} → MoS={p.net_section.margin_of_safety:.3f} [{p.net_section.status}]\n"
        f"  Shear-Out: {p.shear_out.applied_mpa:.1f}/{p.shear_out.allowable_mpa:.1f} → MoS={p.shear_out.margin_of_safety:.3f} [{p.shear_out.status}]\n"
        f"  Pull-Through: {p.pull_through.applied_mpa:.1f}/{p.pull_through.allowable_mpa:.1f} → MoS={p.pull_through.margin_of_safety:.3f} [{p.pull_through.status}]"
        for p in r.plates
    ]) + f"""

CRITICAL: {r.critical_item['label']} → Min MoS = {r.minimum_mos:.3f}
STATUS: {r.overall_status}
{f'USER QUESTION: {user_q}' if user_q else ''}"""

    try:
        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1000,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}]
        )
        text = message.content[0].text.strip()
        # Strip markdown fences if present
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        data = json.loads(text)
        return AIAnalysisResponse(
            analysis=data.get("analysis", ""),
            recommendations=data.get("recommendations", []),
            critical_mode_explanation=data.get("critical_mode_explanation", ""),
        )
    except json.JSONDecodeError as e:
        raise HTTPException(500, f"AI response parse error: {e}")
    except Exception as e:
        raise HTTPException(500, f"AI analysis failed: {e}")
