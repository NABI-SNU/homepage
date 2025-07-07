#!/usr/bin/env python3
from __future__ import annotations
import os
from datetime import datetime, timezone
from pathlib import Path
from io import StringIO
import sys

import paperfinder_nabi


def main() -> None:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise SystemExit("GEMINI_API_KEY not set")

    buf = StringIO()
    stdout = sys.stdout
    sys.stdout = buf
    paperfinder_nabi.core.run(api_key)
    sys.stdout = stdout

    output = buf.getvalue().strip()

    now = datetime.now(timezone.utc)
    title = now.strftime("%B %Y")
    slug = now.strftime("%B-%Y").lower()

    mdx_path = Path("src/pages/monthly") / f"{slug}.mdx"
    mdx_content = f"""---
title: {title}
layout: '~/layouts/MarkdownLayout.astro'
---

{output}
"""
    mdx_path.write_text(mdx_content, encoding="utf-8")


if __name__ == "__main__":
    main()