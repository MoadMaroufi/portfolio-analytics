import json
import logging

from openai import OpenAI

from config import Settings

logger = logging.getLogger(__name__)


FALLBACK_LIMIT = 5
MAX_DESCRIPTION_CHARS = 500


def _trim_description(value: str, max_chars: int = MAX_DESCRIPTION_CHARS) -> str:
    if len(value) <= max_chars:
        return value
    return f"{value[:max_chars].rstrip()}..."


def build_semantic_prompt(query: str, companies: list[dict]) -> str:
    company_lines = []
    for company in companies:
        description = _trim_description(company["description"])
        company_lines.append(
            (
                f"- ticker: {company['ticker']} | name: {company['name']} | "
                f"sector: {company['sector']} | industry: {company['industry']} | "
                f"country: {company['country']} | exchange: {company['exchange']} | "
                f"score: {company['score']:.4f} | description: {description}"
            )
        )

    company_block = "\n".join(company_lines)
    return (
        "You are an expert European equity portfolio construction assistant.\n\n"
        f'User query: "{query}"\n\n'
        "Retrieved companies:\n"
        f"{company_block}\n\n"
        "Select the best matching companies from the retrieved list only. "
        "Prefer 5 companies when available, otherwise use as many valid companies as possible.\n"
        "Return JSON only with this exact shape:\n"
        "{\n"
        '  "recommendations": [\n'
        "    {\n"
        '      "ticker": "string",\n'
        '      "weight": 0.2,\n'
        '      "rationale": "short explanation"\n'
        "    }\n"
        "  ],\n"
        '  "explanation": "overall portfolio explanation"\n'
        "}\n\n"
        "Rules:\n"
        "- Use exact tickers from the retrieved companies only.\n"
        "- Weights must be non-negative numbers summing to 1.0.\n"
        "- Do not include markdown fences or any extra text.\n"
        "- Keep each rationale concise and specific to the query."
    )


def _build_client(settings: Settings) -> OpenAI:
    if not settings.nvidia_api_key:
        raise RuntimeError("NVIDIA API key is not configured.")

    return OpenAI(
        base_url=settings.nvidia_base_url,
        api_key=settings.nvidia_api_key,
    )


def _normalize_weights(recommendations: list[dict]) -> list[dict]:
    total_weight = sum(float(item["weight"]) for item in recommendations)
    if total_weight <= 0:
        raise ValueError("Recommendation weights must sum to a positive value.")

    normalized: list[dict] = []
    for item in recommendations:
        normalized.append({**item, "weight": float(item["weight"]) / total_weight})
    return normalized


def _enrich_recommendations(
    recommendations: list[dict], companies_by_ticker: dict[str, dict]
) -> list[dict]:
    enriched: list[dict] = []
    for item in recommendations:
        ticker = item.get("ticker")
        if not isinstance(ticker, str) or ticker not in companies_by_ticker:
            continue

        weight = item.get("weight")
        rationale = item.get("rationale")
        if not isinstance(weight, int | float) or float(weight) < 0:
            continue
        if not isinstance(rationale, str) or not rationale.strip():
            continue

        enriched.append(
            {
                **companies_by_ticker[ticker],
                "weight": float(weight),
                "rationale": rationale.strip(),
            }
        )

    if not enriched:
        raise ValueError("No valid recommendations were returned by the LLM.")

    return _normalize_weights(enriched)


def build_ranking_recommendations(companies: list[dict]) -> tuple[list[dict], str]:
    """Build recommendations using only semantic ranking (no LLM).

    Uses the top 5 companies ranked by similarity score with weights
    proportional to their relative scores.
    """
    ranking_companies = companies[:FALLBACK_LIMIT]
    if not ranking_companies:
        return [], "No relevant companies were found for this query."

    # Calculate weights proportional to similarity scores
    total_score = sum(company["score"] for company in ranking_companies)
    if total_score <= 0:
        # Fallback to equal weights if scores are invalid
        equal_weight = 1.0 / len(ranking_companies)
        recommendations = [
            {
                **company,
                "weight": equal_weight,
                "rationale": f"Selected based on semantic similarity (score: {company['score']:.4f}).",
            }
            for company in ranking_companies
        ]
    else:
        recommendations = [
            {
                **company,
                "weight": company["score"] / total_score,
                "rationale": f"Selected based on semantic similarity (score: {company['score']:.4f}).",
            }
            for company in ranking_companies
        ]

    explanation = (
        f"Portfolio built from the top {len(ranking_companies)} semantically matched companies "
        "with weights proportional to their relevance scores."
    )
    return recommendations, explanation


def build_fallback_recommendations(companies: list[dict]) -> tuple[list[dict], str]:
    fallback_companies = companies[:FALLBACK_LIMIT]
    if not fallback_companies:
        return [], "No relevant companies were found for this query."

    equal_weight = 1.0 / len(fallback_companies)
    recommendations = [
        {
            **company,
            "weight": equal_weight,
            "rationale": (
                f"Fallback selection based on semantic similarity for {company['name']}."
            ),
        }
        for company in fallback_companies
    ]
    explanation = (
        "Returned the top semantically matched companies with equal weights because "
        "the NVIDIA portfolio synthesis step was unavailable."
    )
    return recommendations, explanation


def generate_semantic_recommendations(
    query: str, companies: list[dict], settings: Settings
) -> tuple[list[dict], str]:
    logger.info(f"Starting semantic recommendations for query: {query[:50]}...")

    if not companies:
        logger.warning("No companies provided to generate_semantic_recommendations")
        return [], "No relevant companies were found for this query."

    try:
        prompt = build_semantic_prompt(query, companies)
        logger.info(f"Built prompt with {len(companies)} companies")
    except Exception as e:
        logger.error(f"Failed to build prompt: {e}", exc_info=True)
        raise

    try:
        client = _build_client(settings)
        logger.info(f"Created OpenAI client with base_url: {settings.nvidia_base_url}")
    except Exception as e:
        logger.error(f"Failed to build OpenAI client: {e}", exc_info=True)
        raise

    try:
        logger.info(f"Calling NVIDIA API with model: {settings.nvidia_model}")
        completion = client.chat.completions.create(
            model=settings.nvidia_model,
            messages=[{"role": "user", "content": prompt}],
            temperature=settings.llm_temperature,
            top_p=settings.llm_top_p,
            max_tokens=settings.llm_max_tokens,
            stream=False,
        )
        logger.info(f"NVIDIA API response received: {completion}")
    except Exception as e:
        logger.error(f"NVIDIA API call failed: {e}", exc_info=True)
        raise

    try:
        content = completion.choices[0].message.content if completion.choices else None
        logger.info(f"Extracted content length: {len(content) if content else 0}")
    except Exception as e:
        logger.error(f"Failed to extract content from completion: {e}", exc_info=True)
        raise

    if not content:
        raise ValueError("NVIDIA API returned an empty response.")

    try:
        payload = json.loads(content)
        logger.info(f"Parsed JSON payload with keys: {list(payload.keys())}")
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse JSON response: {e}")
        logger.error(f"Raw content: {content[:500]}")
        raise ValueError(f"Invalid JSON in LLM response: {e}")

    explanation = payload.get("explanation")
    if not isinstance(explanation, str) or not explanation.strip():
        logger.error(f"Missing or invalid explanation: {explanation}")
        raise ValueError("LLM response explanation is missing.")

    recommendations = payload.get("recommendations")
    if not isinstance(recommendations, list):
        logger.error(f"Missing or invalid recommendations: {recommendations}")
        raise ValueError("LLM response recommendations are missing.")

    logger.info(f"Processing {len(recommendations)} recommendations")

    companies_by_ticker = {company["ticker"]: company for company in companies}
    enriched = _enrich_recommendations(recommendations, companies_by_ticker)
    logger.info(f"Successfully enriched {len(enriched)} recommendations")
    return enriched, explanation.strip()
