#!/usr/bin/env python3
"""Run terraform init + apply using variables from bank_agent/.env."""

import sys

from rich.console import Console
from rich.panel import Panel
from rich.text import Text

from deploy.tf_run import ENV_PATH, load_env, terraform

console = Console()


def main():
    console.print()
    console.print(Panel.fit(
        Text.assemble(
            ("Bank Agent", "bold bright_green"),
            (" — ", "dim white"),
            ("Terraform Deploy", "bold white"),
        ),
        border_style="bright_green",
        padding=(0, 2),
    ))

    if not ENV_PATH.exists():
        console.print(f"[red]Error: {ENV_PATH} not found. Run `uv run setup-env` first.[/red]")
        sys.exit(1)

    dot_env = load_env(ENV_PATH)
    project_id = dot_env.get("GOOGLE_CLOUD_PROJECT")

    if not project_id:
        console.print("[red]Error: GOOGLE_CLOUD_PROJECT not set in .env[/red]")
        sys.exit(1)

    console.print(f"\n  Using project: [cyan]{project_id}[/cyan]")

    terraform("init")
    terraform("apply", "-auto-approve")

    console.print()
    console.print(Panel.fit(
        Text.assemble(("Deploy complete!", "bold bright_green")),
        border_style="bright_green",
        padding=(0, 2),
    ))
    console.print()


if __name__ == "__main__":
    main()
