import os
from typing import List, Optional, Union

import httpx

RESEND_API_KEY = os.getenv("RESEND_API_KEY")
RESEND_API_URL = os.getenv("RESEND_API_URL", "https://api.resend.com/emails")


class Emails:
    @staticmethod
    def send(
        from_: str,
        to: List[str],
        subject: str,
        html: str,
        reply_to: Optional[str] = None,
        cc: Optional[Union[str, List[str]]] = None,
        bcc: Optional[Union[str, List[str]]] = None,
        tags: Optional[List[dict]] = None,
    ):
        if RESEND_API_KEY is None:
            raise ValueError("RESEND_API_KEY is not set in environment.")

        headers = {
            "Authorization": f"Bearer {RESEND_API_KEY}",
            "Content-Type": "application/json",
        }

        payload = {"from": from_, "to": to, "subject": subject, "html": html}

        # Optional fields

        if reply_to:
            payload["reply_to"] = reply_to
        if cc:
            payload["cc"] = cc
        if bcc:
            payload["bcc"] = bcc
        if tags:
            payload["tags"] = tags

        response = httpx.post(RESEND_API_URL, headers=headers, json=payload)

        if response.status_code >= 400:
            raise RuntimeError(
                f"Resend API error: {response.status_code} {response.text}"
            )

        return response.json()
