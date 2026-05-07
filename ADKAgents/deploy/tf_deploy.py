#!/usr/bin/env python3
"""Run terraform init + apply, build & push the container image, then redeploy."""

import json
import subprocess
import sys
from pathlib import Path

from rich.console import Console
from rich.panel import Panel
from rich.text import Text

from deploy.tf_run import ENV_PATH, TF_DIR, load_env, terraform

console = Console()

DOCKERFILE_DIR = Path(__file__).parent.parent


def tf_output(key: str) -> str:
    result = subprocess.run(
        ["terraform", "output", "-json"],
        cwd=TF_DIR,
        capture_output=True,
        text=True,
    )
    return json.loads(result.stdout).get(key, {}).get("value", "")


def write_env_value(key: str, value: str) -> None:
    lines = ENV_PATH.read_text().splitlines()
    updated = False
    for i, line in enumerate(lines):
        if line.startswith(f"{key}="):
            lines[i] = f"{key}={value}"
            updated = True
            break
    if not updated:
        lines.append(f"{key}={value}")
    ENV_PATH.write_text("\n".join(lines) + "\n")


def build_and_push(image_url: str, project_id: str) -> None:
    console.print(f"\n  Building and pushing [cyan]{image_url}[/cyan] via Cloud Build...\n")
    args = ["gcloud", "builds", "submit", "--tag", image_url, "--project", project_id, str(DOCKERFILE_DIR)]
    # On Windows, gcloud is a .cmd script and requires shell=True; on macOS/Linux use the list directly.
    if sys.platform == "win32":
        cmd = " ".join(f'"{a}"' for a in args)
        result = subprocess.run(cmd, shell=True)
    else:
        result = subprocess.run(args)
    if result.returncode != 0:
        console.print("[red]Cloud Build failed.[/red]")
        sys.exit(result.returncode)


def main():
    console.print()
    console.print(Panel.fit(
        Text.assemble(
            ("Bank Agent", "bold bright_green"),
            (" \u2014 ", "dim white"),
            ("Terraform Deploy", "bold white"),
        ),
        border_style="bright_green",
        padding=(0, 2),
    ))

    if not ENV_PATH.exists():
        console.print(f"[red]Error: {ENV_PATH} not found. Run `uv run setup-env` first.[/red]")
        sys.exit(1)

    dot_env = load_env(ENV_PATH)
    project_id = dot_env.get("GOOGLE_CLOUD_PROJECT", "")

    if not project_id:
        console.print("[red]Error: GOOGLE_CLOUD_PROJECT not set in .env[/red]")
        sys.exit(1)

    console.print(f"\n  Using project: [cyan]{project_id}[/cyan]")

    # Phase 1: provision infra (registry, data store, IAM — skip Cloud Run)
    console.print("\n  [bold]Phase 1:[/bold] Provisioning infrastructure...\n")
    terraform("init")
    terraform("apply", "-auto-approve")

    # Build and push the container image
    image_url = tf_output("image_url")
    if not image_url:
        console.print("[red]Could not read image_url from Terraform output.[/red]")
        sys.exit(1)

    build_and_push(image_url, project_id)

    # Write CONTAINER_IMAGE into .env so Phase 2 picks it up
    if dot_env.get("CONTAINER_IMAGE") != image_url:
        write_env_value("CONTAINER_IMAGE", image_url)
        console.print(f"\n  Written [cyan]CONTAINER_IMAGE={image_url}[/cyan] to .env")

    # Phase 2: deploy Cloud Run with the image (force replace to pick up new image)
    console.print("\n  [bold]Phase 2:[/bold] Deploying Cloud Run service...\n")
    terraform("apply", "-auto-approve", "-replace=google_cloud_run_v2_service.agent[0]")
    # Sync any dependent resources (e.g. IAM bindings) that may have drifted after replace
    terraform("apply", "-auto-approve")

    cloud_run_url = tf_output("cloud_run_url")
    vertex_data_store_id = tf_output("vertex_data_store_id")

    console.print()
    console.print(Panel.fit(
        Text.assemble(("Deploy complete!", "bold bright_green")),
        border_style="bright_green",
        padding=(0, 2),
    ))
    if vertex_data_store_id:
        console.print(f"\n  Vertex Data Store ID : [cyan]{vertex_data_store_id}[/cyan]")
    if cloud_run_url:
        console.print(f"  Cloud Run URL        : [cyan]{cloud_run_url}[/cyan]")
    console.print()


if __name__ == "__main__":
    main()
